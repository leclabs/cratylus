import { existsSync, statSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  type Adapter,
  type AdapterCapabilities,
  type IR,
  type McpServer,
  type Scope,
  type Skill,
  type WriteOpts,
  type WriteReport,
  parseRule,
  parseSkill,
  serializeFrontmatter,
} from '../../core/index.js';

/**
 * Zed adapter. Ground truth: harness-landscape-research.RETURN.md §2 "Zed"
 * ([ZD1]–[ZD9]).
 *
 * - user:    ~/.config/zed/{settings.json, AGENTS.md} + ~/.agents/skills/ [ZD1][ZD2][ZD9]
 * - project: <cwd>/AGENTS.md · <cwd>/.agents/skills/ · <cwd>/.zed/settings.json [ZD1][ZD2][ZD3]
 *
 * Zed reads NO other project skills path — skills land in exactly
 * `.agents/skills/` [ZD2]. MCP lives under the `context_servers` settings key
 * [ZD3]. No hooks [ZD5]; extension slash commands were removed [ZD8]; agents
 * are a subagent tool / ACP surface, not file-config [ZD4][ZD6].
 */

interface ZedPaths {
  zedDir: string;
  settingsFile: string;
  rulesFile: string;
  skillsDir: string;
}

function paths(scope: Scope, cwd: string): ZedPaths {
  if (scope === 'user') {
    const zedDir = join(homedir(), '.config', 'zed');
    return {
      zedDir,
      settingsFile: join(zedDir, 'settings.json'),
      rulesFile: join(zedDir, 'AGENTS.md'),
      skillsDir: join(homedir(), '.agents', 'skills'),
    };
  }
  const zedDir = join(cwd, '.zed');
  return {
    zedDir,
    settingsFile: join(zedDir, 'settings.json'),
    rulesFile: join(cwd, 'AGENTS.md'),
    skillsDir: join(cwd, '.agents', 'skills'),
  };
}

/**
 * Project-instruction filenames Zed matches BEFORE AGENTS.md in its
 * first-match-of-9 chain [ZD1]. Any of these present as a FILE shadows the
 * AGENTS.md we write.
 */
const SHADOWING_FILES: readonly string[] = [
  '.rules',
  '.cursorrules',
  '.windsurfrules',
  '.clinerules',
  join('.github', 'copilot-instructions.md'),
  'AGENT.md',
];

function isFile(p: string): boolean {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

/** Skill frontmatter constraints [ZD2]: name ≤64 of [a-z0-9-]; description <1024 bytes. */
const SKILL_NAME_RE = /^[a-z0-9-]{1,64}$/;
const SKILL_DESC_MAX_BYTES = 1024;

function skillConstraintViolation(skill: Skill): string | null {
  if (!SKILL_NAME_RE.test(skill.name)) {
    return `name must be ≤64 chars of [a-z0-9-], got '${skill.name}' [ZD2]`;
  }
  if (!skill.description) {
    return 'description is required [ZD2]';
  }
  if (Buffer.byteLength(skill.description, 'utf8') >= SKILL_DESC_MAX_BYTES) {
    return `description must be <${SKILL_DESC_MAX_BYTES} bytes [ZD2]`;
  }
  return null;
}

/**
 * Spec-form SKILL.md for the shared `.agents/skills/` tree: Agent Skills spec
 * fields only (dashed keys), plus Zed's documented `disable-model-invocation`
 * [ZD2]. IR-only fields are dropped (callers warn on the lossy ones).
 */
function serializeZedSkill(skill: Skill): string {
  const fm: Record<string, unknown> = {
    name: skill.name,
    description: skill.description,
  };
  if (skill.allowed_tools) fm['allowed-tools'] = skill.allowed_tools;
  if (skill.license !== undefined) fm.license = skill.license;
  if (skill.compatibility !== undefined) fm.compatibility = skill.compatibility;
  if (skill.metadata !== undefined) fm.metadata = skill.metadata;
  if (skill.disable_model_invocation !== undefined)
    fm['disable-model-invocation'] = skill.disable_model_invocation;
  return serializeFrontmatter(fm, skill.body);
}

/** Skill fields with no Zed/spec frontmatter home — dropped loudly. */
const LOSSY_SKILL_FIELDS = ['files', 'paths', 'user_invocable'] as const;

interface ContextServerEntry {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
}

const capabilities: AdapterCapabilities = {
  resources: {
    rules: 'partial', // single first-match file; per-rule metadata lost [ZD1]
    skills: 'partial', // frontmatter constraints; supporting trees unmodeled [ZD2]
    commands: 'none', // extension slash commands removed [ZD8]
    agents: 'none', // subagent tool + ACP, not file-config [ZD4][ZD6]
    hooks: 'none', // no hook system [ZD5]
    mcp: 'partial', // context_servers in settings [ZD3]
    permissions: 'none', // tool_permissions is nearest, not modeled [ZD5]
    env: 'none', // per-context-server env only; no global env surface [ZD3]
  },
  hooks: { supported: [], matchers: 'none', payload: 'native' },
  scopes: ['user', 'project'],
};

async function readSettings(
  file: string,
): Promise<Record<string, unknown> | null> {
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(await readFile(file, 'utf8')) as Record<string, unknown>;
  } catch {
    return null; // JSONC or malformed — best-effort read only [ZD9]
  }
}

async function readImpl(scope: Scope, cwd: string): Promise<Partial<IR>> {
  const p = paths(scope, cwd);
  const ir: Partial<IR> = {};

  if (existsSync(p.rulesFile)) {
    const text = await readFile(p.rulesFile, 'utf8');
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

  const settings = await readSettings(p.settingsFile);
  const servers = settings?.context_servers as
    | Record<string, ContextServerEntry>
    | undefined;
  if (servers && typeof servers === 'object' && !Array.isArray(servers)) {
    const out: McpServer[] = [];
    for (const [name, s] of Object.entries(servers)) {
      if (s.url) {
        out.push({ name, transport: 'http', url: s.url } as McpServer);
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

  return ir;
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
    if (scope !== 'user') {
      for (const rel of SHADOWING_FILES) {
        if (isFile(join(cwd, rel))) {
          warnings.push(
            `rules: ${rel} precedes AGENTS.md in Zed's first-match instruction chain and will shadow it [ZD1]`,
          );
        }
      }
    }
    const body = ir.rules.map((r: { body: string }) => r.body).join('\n\n');
    if (!opts.dryRun) {
      await mkdir(dirname(p.rulesFile), { recursive: true });
      await writeFile(p.rulesFile, `${body}\n`, 'utf8');
    }
    written.push(p.rulesFile);
  }

  if (ir.skills?.length) {
    for (const skill of ir.skills) {
      const skillFile = join(p.skillsDir, skill.name, 'SKILL.md');
      const violation = skillConstraintViolation(skill);
      if (violation) {
        warnings.push(`skills/${skill.name}: ${violation}`);
        skipped.push({ path: skillFile, reason: 'constraint-violation' });
        continue;
      }
      for (const field of LOSSY_SKILL_FIELDS) {
        if (skill[field] !== undefined) {
          warnings.push(
            `skills/${skill.name}: '${field}' has no Zed frontmatter equivalent (dropped) [ZD2]`,
          );
        }
      }
      if (!opts.dryRun) {
        await mkdir(dirname(skillFile), { recursive: true });
        await writeFile(skillFile, serializeZedSkill(skill), 'utf8');
      }
      written.push(skillFile);
    }
  }

  if (ir.mcp_servers?.length) {
    const existing = (await readSettings(p.settingsFile)) ?? {};
    const servers =
      (existing.context_servers as Record<string, unknown> | undefined) ?? {};
    for (const s of ir.mcp_servers) {
      if (s.transport === 'stdio') {
        const entry: Record<string, unknown> = { command: s.command };
        if (s.args) entry.args = s.args;
        if (s.env) entry.env = s.env;
        servers[s.name] = entry;
      } else {
        const entry: Record<string, unknown> = { url: s.url };
        if (s.headers) entry.headers = s.headers;
        servers[s.name] = entry;
      }
    }
    existing.context_servers = servers;
    if (!opts.dryRun) {
      await mkdir(dirname(p.settingsFile), { recursive: true });
      await writeFile(
        p.settingsFile,
        `${JSON.stringify(existing, null, 2)}\n`,
        'utf8',
      );
    }
    written.push(p.settingsFile);
  }

  if (ir.hooks?.length) {
    warnings.push(
      `hooks: Zed has no hook system (${ir.hooks.length} skipped) [ZD5]`,
    );
    for (const h of ir.hooks)
      skipped.push({
        path: `hooks/${h.id ?? '?'}.yaml`,
        reason: 'unsupported',
      });
  }
  if (ir.commands?.length) {
    warnings.push(
      `commands: Zed removed extension slash commands (${ir.commands.length} skipped) [ZD8]`,
    );
    for (const c of ir.commands)
      skipped.push({ path: `commands/${c.name}`, reason: 'unsupported' });
  }
  if (ir.agents?.length) {
    warnings.push(
      `agents: Zed's subagent tool and ACP agent_servers are not file-config (${ir.agents.length} skipped) [ZD4][ZD6]`,
    );
    for (const a of ir.agents)
      skipped.push({ path: `agents/${a.name}`, reason: 'unsupported' });
  }
  if (ir.permissions) {
    warnings.push(
      'permissions: Zed agent.tool_permissions is not modeled (dropped) [ZD5]',
    );
    skipped.push({ path: 'permissions', reason: 'unsupported' });
  }
  if (ir.env && Object.keys(ir.env).length) {
    warnings.push('env: Zed has no global env surface (dropped) [ZD3]');
    skipped.push({ path: 'env', reason: 'unsupported' });
  }

  return { written, skipped, warnings };
}

export const zedAdapter: Adapter = {
  id: 'zed',
  capabilities,
  async detect(scope: Scope, cwd: string): Promise<boolean> {
    const p = paths(scope, cwd);
    return existsSync(p.zedDir) || existsSync(p.rulesFile);
  },
  read: readImpl,
  write: writeImpl,
};
export default zedAdapter;
