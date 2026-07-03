import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  type Adapter,
  type AdapterCapabilities,
  type EventMap,
  type Hook,
  type IR,
  type McpServer,
  type Scope,
  type Skill,
  type WriteOpts,
  type WriteReport,
  mergeJsonKeys,
  parseRule,
  parseSkill,
  serializeSkill,
} from '../../core/index.js';

/**
 * Crush config truth (RETURN §2/Crush, §3/crush d1–d6):
 * - ONE config home: `crush.json` (`.crush.json` variant) at the project
 *   root, `~/.config/crush/crush.json` at user scope. MCP lives under its
 *   `mcp` key with required-style `type`; hooks under `hooks.PreToolUse`;
 *   permissions under `permissions.allowed_tools` [CR1][CR3]. The sidecar
 *   `.crush/mcp.json` is fabricated — never written, never read [CR1].
 * - User rules: `~/.config/crush/CRUSH.md` (a documented global context
 *   path; the alternative is `~/.config/AGENTS.md`) — `~/.config/crush/
 *   AGENTS.md` is fabricated [CR1][CR2]. Project rules: root AGENTS.md,
 *   a default `context_paths` entry [CR2].
 */

interface CrushPaths {
  crushDir: string;
  rulesFile: string;
  /** The single documented config home (mcp + hooks + permissions) [CR1]. */
  configFile: string;
  skillsDir: string;
}

function paths(scope: Scope, cwd: string): CrushPaths {
  if (scope === 'user') {
    const root = join(homedir(), '.config', 'crush');
    return {
      crushDir: root,
      rulesFile: join(root, 'CRUSH.md'),
      configFile: join(root, 'crush.json'),
      skillsDir: join(root, 'skills'),
    };
  }
  const root = join(cwd, '.crush');
  // Documented lookup order: `.crush.json` → `crush.json` [CR1]. Follow an
  // existing file; default new emission to `crush.json`.
  const dotted = join(cwd, '.crush.json');
  const plain = join(cwd, 'crush.json');
  return {
    crushDir: root,
    rulesFile: join(cwd, 'AGENTS.md'),
    configFile: existsSync(dotted) ? dotted : plain,
    skillsDir: join(root, 'skills'),
  };
}

/** A `crush.json` `mcp` entry — `type` is required-style [CR1]. */
interface CrushMcpEntry {
  type?: 'stdio' | 'http' | 'sse';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
}

/** A `crush.json` `hooks.PreToolUse` entry [CR3]. */
interface CrushHookEntry {
  name?: string;
  matcher?: string;
  command: string;
  timeout?: number;
}

const capabilities: AdapterCapabilities = {
  resources: {
    rules: 'full',
    skills: 'partial',
    commands: 'none',
    agents: 'none',
    // hooks.PreToolUse in crush.json — the only event [CR3].
    hooks: 'partial',
    mcp: 'partial',
    // permissions.allowed_tools in crush.json [CR1].
    permissions: 'partial',
    // $VAR expansion only; no env surface documented [CR1].
    env: 'none',
  },
  hooks: {
    supported: ['tool.use.pre'],
    // Matchers are regex on the tool name [CR3].
    matchers: 'regex',
    payload: 'native',
  },
  scopes: ['user', 'project'],
};

const eventMap: EventMap = { 'tool.use.pre': 'PreToolUse' };

async function readConfig(
  p: CrushPaths,
): Promise<Record<string, unknown> | null> {
  if (!existsSync(p.configFile)) return null;
  return JSON.parse(await readFile(p.configFile, 'utf8')) as Record<
    string,
    unknown
  >;
}

async function readImpl(scope: Scope, cwd: string): Promise<Partial<IR>> {
  const p = paths(scope, cwd);
  const ir: Partial<IR> = {};

  let rulesFile = p.rulesFile;
  if (scope === 'user' && !existsSync(rulesFile)) {
    // Documented global-context alternative [CR2].
    rulesFile = join(homedir(), '.config', 'AGENTS.md');
  }
  if (existsSync(rulesFile)) {
    const text = await readFile(rulesFile, 'utf8');
    ir.rules = [parseRule(text, 'main')];
  }

  if (existsSync(p.skillsDir)) {
    const entries = await readdir(p.skillsDir, { withFileTypes: true });
    const skills: Skill[] = [];
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory()) continue;
      const f = join(p.skillsDir, entry.name, 'SKILL.md');
      if (!existsSync(f)) continue;
      skills.push(parseSkill(await readFile(f, 'utf8'), entry.name));
    }
    if (skills.length) ir.skills = skills;
  }

  // MCP lives under the `mcp` key of crush.json — the fabricated
  // `.crush/mcp.json` sidecar is never consulted [CR1].
  const config = await readConfig(p);
  const mcp = config?.mcp as Record<string, CrushMcpEntry> | undefined;
  if (mcp) {
    const out: McpServer[] = [];
    for (const [name, s] of Object.entries(mcp)) {
      if (s.url && (s.type === 'http' || s.type === 'sse')) {
        const server = { name, transport: s.type, url: s.url } as McpServer;
        if (s.headers)
          (server as { headers?: Record<string, string> }).headers = s.headers;
        out.push(server);
      } else if (s.command) {
        const server = {
          name,
          transport: 'stdio',
          command: s.command,
        } as McpServer;
        if (s.args) (server as { args?: string[] }).args = s.args;
        if (s.env) (server as { env?: Record<string, string> }).env = s.env;
        out.push(server);
      }
    }
    if (out.length) ir.mcp_servers = out;
  }

  // Hooks live under `hooks.PreToolUse` of the same config home — the only
  // documented event [CR3].
  const hooksRaw = config?.hooks as
    | { PreToolUse?: CrushHookEntry[] }
    | undefined;
  if (hooksRaw?.PreToolUse?.length) {
    const hooks: Hook[] = hooksRaw.PreToolUse.map((h) => {
      const hook: Hook = { events: ['tool.use.pre'], command: h.command };
      if (h.name) hook.id = h.name;
      if (h.matcher) hook.matcher = h.matcher;
      if (h.timeout !== undefined) hook.timeout = h.timeout;
      return hook;
    });
    ir.hooks = hooks;
  }

  // Permissions: `permissions.allowed_tools` is the only documented list
  // [CR1] — deny/ask have no crush.json surface, so they never round-trip.
  const permsRaw = config?.permissions as
    | { allowed_tools?: string[] }
    | undefined;
  if (permsRaw?.allowed_tools?.length) {
    ir.permissions = { allow: permsRaw.allowed_tools };
  }

  return ir;
}

function mcpEntry(s: McpServer): CrushMcpEntry {
  if (s.transport === 'stdio') {
    const [command, ...argvRest] = Array.isArray(s.command)
      ? s.command
      : [s.command];
    const args = [...argvRest, ...(s.args ?? [])];
    const entry: CrushMcpEntry = { type: 'stdio', command };
    if (args.length) entry.args = args;
    if (s.env) entry.env = s.env;
    return entry;
  }
  const entry: CrushMcpEntry = { type: s.transport, url: s.url };
  if (s.headers) entry.headers = s.headers;
  return entry;
}

function hookEntry(h: Hook): CrushHookEntry {
  const entry: CrushHookEntry = { command: h.command };
  if (h.id) entry.name = h.id;
  if (h.matcher) entry.matcher = h.matcher;
  if (h.timeout !== undefined) entry.timeout = h.timeout;
  return entry;
}

async function writeImpl(
  ir: IR,
  scope: Scope,
  cwd: string,
  opts: WriteOpts = {},
): Promise<WriteReport> {
  const p = paths(scope, cwd);
  const written: string[] = [];
  const skipped: { path: string; reason: string }[] = [];
  const warnings: string[] = [];

  if (ir.rules?.length) {
    const body = ir.rules.map((r: { body: string }) => r.body).join('\n\n');
    if (!opts.dryRun) {
      await mkdir(dirname(p.rulesFile), { recursive: true });
      await writeFile(p.rulesFile, `${body}\n`, 'utf8');
    }
    written.push(p.rulesFile);
  }

  if (ir.skills?.length) {
    for (const skill of ir.skills) {
      const skillDir = join(p.skillsDir, skill.name);
      const skillFile = join(skillDir, 'SKILL.md');
      if (!opts.dryRun) {
        await mkdir(skillDir, { recursive: true });
        await writeFile(skillFile, serializeSkill(skill), 'utf8');
      }
      written.push(skillFile);
    }
  }

  // Config-home resources: mcp + hooks + permissions are keys of the ONE
  // documented config file; foreign keys survive (key-scoped merge) [CR1].
  const owned: Record<string, unknown> = {};

  if (ir.mcp_servers?.length) {
    const mcp: Record<string, CrushMcpEntry> = {};
    for (const s of ir.mcp_servers) mcp[s.name] = mcpEntry(s);
    owned.mcp = mcp;
  }

  if (ir.hooks?.length) {
    const pre: CrushHookEntry[] = [];
    for (const h of ir.hooks) {
      if (h.events.includes('tool.use.pre')) pre.push(hookEntry(h));
      const unsupported = h.events.filter((e) => e !== 'tool.use.pre');
      if (unsupported.length) {
        skipped.push({
          path: `hooks/${h.id ?? '?'}`,
          reason: `unsupported-event: crush hooks fire only PreToolUse; no native surface for ${unsupported.join(', ')} [CR3]`,
        });
      }
    }
    if (pre.length) owned.hooks = { PreToolUse: pre };
    const fullySkipped = ir.hooks.filter(
      (h) => !h.events.includes('tool.use.pre'),
    ).length;
    if (fullySkipped > 0) {
      warnings.push(
        `hooks: crush fires only PreToolUse — ${fullySkipped} hook(s) skipped [CR3]`,
      );
    }
  }

  if (ir.permissions) {
    if (ir.permissions.allow?.length) {
      owned.permissions = { allowed_tools: ir.permissions.allow };
    }
    const dropped = (['deny', 'ask'] as const).filter(
      (k) => ir.permissions?.[k]?.length,
    );
    if (dropped.length) {
      warnings.push(
        `permissions: crush supports only permissions.allowed_tools — ${dropped.join('/')} list(s) skipped [CR1]`,
      );
      for (const k of dropped)
        skipped.push({
          path: `permissions/${k}`,
          reason:
            'unsupported-list: crush permissions carry only allowed_tools [CR1]',
        });
    }
  }

  if (Object.keys(owned).length) {
    if (!opts.dryRun) {
      const existing = existsSync(p.configFile)
        ? await readFile(p.configFile, 'utf8')
        : undefined;
      await mkdir(dirname(p.configFile), { recursive: true });
      await writeFile(p.configFile, mergeJsonKeys(existing, owned), 'utf8');
    }
    written.push(p.configFile);
  }

  for (const [field, label] of [
    ['commands', 'commands'],
    ['agents', 'agents'],
  ] as const) {
    const items = ir[field];
    if (items?.length) {
      warnings.push(
        `${label}: Crush has no ${label} (${items.length} skipped)`,
      );
      for (const i of items)
        skipped.push({
          path: `${label}/${(i as { name: string }).name}`,
          // Self-explaining refusal: both missing surfaces named [CR4].
          reason: `no-native-no-plugin: Crush has no native ${label} surface and no plugin API [CR4]`,
        });
    }
  }

  return { written, skipped, warnings };
}

export const crushAdapter: Adapter = {
  id: 'crush',
  status: { kind: 'current' },
  capabilities,
  eventMap,
  async detect(scope: Scope, cwd: string): Promise<boolean> {
    const p = paths(scope, cwd);
    return (
      existsSync(p.crushDir) ||
      existsSync(p.rulesFile) ||
      existsSync(p.configFile)
    );
  },
  read: readImpl,
  write: writeImpl,
};
export default crushAdapter;
