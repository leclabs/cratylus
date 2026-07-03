import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { dump, load } from 'js-yaml';
import {
  type Adapter,
  type AdapterCapabilities,
  type IR,
  type McpServer,
  type Scope,
  type WriteOpts,
  type WriteReport,
  mergeYamlKeys,
  parseCommand,
  parseRule,
  serializeFrontmatter,
  serializeRule,
} from '../../core/index.js';

/**
 * Continue adapter — documented surfaces only (RETURN §2 "Continue", §3
 * "continue adapter" d1–d3):
 *
 * - Rules: `.continue/rules/*.md` [CT2] (user scope mirrors the block dirs
 *   under `~/.continue/` [CT5]). The former root `AGENTS.md` /
 *   `~/.continue/AGENTS.md` writes had no documented consumer — removed.
 * - Commands: invokable prompts `.continue/prompts/*.md` with
 *   `invokable: true` frontmatter → `/name` [CT3].
 * - MCP: `config.yaml` `mcpServers` is a LIST of blocks with required
 *   top-level `name`/`version`/`schema` [CT1][CT4]. An existing user
 *   `config.yaml` is key-merged (foreign blocks survive), never
 *   map-clobbered. With no `config.yaml` present, project scope targets the
 *   foreign-format auto-detect home `.continue/mcpServers/mcp.json` [CT4];
 *   user scope owns `~/.continue/config.yaml` [CT1] and creates it with the
 *   required top-level keys.
 */

interface ContinuePaths {
  continueDir: string;
  rulesDir: string;
  promptsDir: string;
  configFile: string;
  mcpJsonFile: string;
}

function paths(scope: Scope, cwd: string): ContinuePaths {
  const root =
    scope === 'user' ? join(homedir(), '.continue') : join(cwd, '.continue');
  return {
    continueDir: root,
    rulesDir: join(root, 'rules'),
    promptsDir: join(root, 'prompts'),
    configFile: join(root, 'config.yaml'),
    mcpJsonFile: join(root, 'mcpServers', 'mcp.json'),
  };
}

/** One `mcpServers` LIST block ([CT4]) or map entry (mcp.json auto-detect). */
interface McpEntry {
  name?: unknown;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  type?: string;
  headers?: Record<string, string>;
}

const capabilities: AdapterCapabilities = {
  resources: {
    rules: 'full',
    skills: 'none',
    commands: 'partial',
    agents: 'none',
    hooks: 'none',
    mcp: 'partial',
    permissions: 'none',
    env: 'none',
  },
  hooks: { supported: [], matchers: 'none', payload: 'native' },
  scopes: ['user', 'project'],
};

async function readMdDir<T>(
  dir: string,
  parse: (text: string, stem: string) => T,
): Promise<T[]> {
  if (!existsSync(dir)) return [];
  const files = (await readdir(dir)).filter((f) => f.endsWith('.md')).sort();
  const out: T[] = [];
  for (const f of files) {
    out.push(parse(await readFile(join(dir, f), 'utf8'), f.slice(0, -3)));
  }
  return out;
}

/** Lift one server entry; `name` always comes from the block's own `name`
 * field (LIST form) or the map key — never an array index [CT4]. */
function liftServer(name: string, entry: McpEntry): McpServer | undefined {
  if (entry.url) {
    const server = {
      name,
      transport: entry.type === 'sse' ? 'sse' : 'http',
      url: entry.url,
    } as McpServer;
    if (entry.headers)
      (server as { headers?: Record<string, string> }).headers = entry.headers;
    return server;
  }
  if (entry.command) {
    const server = {
      name,
      transport: 'stdio',
      command: entry.command,
    } as McpServer;
    if (entry.args) (server as { args?: string[] }).args = entry.args;
    if (entry.env) (server as { env?: Record<string, string> }).env = entry.env;
    return server;
  }
  return undefined;
}

function liftServers(raw: unknown, into: Map<string, McpServer>): void {
  if (Array.isArray(raw)) {
    // Documented LIST of blocks [CT4]: key by each block's `name`.
    for (const block of raw as McpEntry[]) {
      if (typeof block?.name !== 'string' || block.name === '') continue;
      const server = liftServer(block.name, block);
      if (server && !into.has(server.name)) into.set(server.name, server);
    }
    return;
  }
  if (raw && typeof raw === 'object') {
    // Map form (foreign-format mcp.json auto-detect / legacy emissions).
    for (const [name, entry] of Object.entries(
      raw as Record<string, McpEntry>,
    )) {
      const server = liftServer(name, entry);
      if (server && !into.has(server.name)) into.set(server.name, server);
    }
  }
}

async function readImpl(scope: Scope, cwd: string): Promise<Partial<IR>> {
  const p = paths(scope, cwd);
  const ir: Partial<IR> = {};

  const rules = await readMdDir(p.rulesDir, (text, stem) =>
    parseRule(text, stem),
  );
  if (rules.length) ir.rules = rules;

  const commands = await readMdDir(p.promptsDir, (text, stem) =>
    parseCommand(text, stem),
  );
  if (commands.length) ir.commands = commands;

  const servers = new Map<string, McpServer>();
  if (existsSync(p.configFile)) {
    const parsed = (load(await readFile(p.configFile, 'utf8')) ?? {}) as {
      mcpServers?: unknown;
    };
    liftServers(parsed.mcpServers, servers);
  }
  if (existsSync(p.mcpJsonFile)) {
    const parsed = JSON.parse(await readFile(p.mcpJsonFile, 'utf8')) as {
      mcpServers?: unknown;
    };
    liftServers(parsed.mcpServers, servers);
  }
  if (servers.size) ir.mcp_servers = [...servers.values()];

  return ir;
}

/** Serialize IR servers as the documented config.yaml LIST blocks [CT4].
 * The block schema has no `headers` field — dropped with a warning. */
function toYamlBlocks(
  servers: readonly McpServer[],
  warnings: string[],
): Record<string, unknown>[] {
  const blocks: Record<string, unknown>[] = [];
  for (const s of servers) {
    if (s.transport === 'stdio') {
      const command = Array.isArray(s.command) ? s.command[0] : s.command;
      const argv = Array.isArray(s.command) ? s.command.slice(1) : [];
      const args = [...argv, ...(s.args ?? [])];
      const block: Record<string, unknown> = {
        name: s.name,
        type: 'stdio',
        command,
      };
      if (args.length) block.args = args;
      if (s.env) block.env = s.env;
      blocks.push(block);
    } else {
      if (s.headers) {
        warnings.push(
          `mcp: config.yaml mcpServers blocks have no headers field — dropped for '${s.name}' [CT4]`,
        );
      }
      blocks.push({
        name: s.name,
        type: s.transport === 'sse' ? 'sse' : 'streamable-http',
        url: s.url,
      });
    }
  }
  return blocks;
}

/** Serialize IR servers as the foreign-format map for
 * `.continue/mcpServers/mcp.json` (auto-detected `{"mcpServers":{…}}`) [CT4]. */
function toJsonMap(servers: readonly McpServer[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const s of servers) {
    if (s.transport === 'stdio') {
      const entry: Record<string, unknown> = { command: s.command };
      if (s.args) entry.args = s.args;
      if (s.env) entry.env = s.env;
      out[s.name] = entry;
    } else {
      const entry: Record<string, unknown> = { url: s.url, type: s.transport };
      if (s.headers) entry.headers = s.headers;
      out[s.name] = entry;
    }
  }
  return out;
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
    for (const rule of ir.rules) {
      const file = join(p.rulesDir, `${rule.id}.md`);
      if (!opts.dryRun) {
        await mkdir(p.rulesDir, { recursive: true });
        const text = serializeRule(rule);
        await writeFile(file, text.endsWith('\n') ? text : `${text}\n`, 'utf8');
      }
      written.push(file);
    }
  }

  if (ir.commands?.length) {
    for (const cmd of ir.commands) {
      const fm: Record<string, unknown> = { invokable: true };
      if (cmd.description) fm.description = cmd.description;
      const file = join(p.promptsDir, `${cmd.name}.md`);
      if (!opts.dryRun) {
        await mkdir(p.promptsDir, { recursive: true });
        const text = serializeFrontmatter(fm, cmd.body);
        await writeFile(file, text.endsWith('\n') ? text : `${text}\n`, 'utf8');
      }
      written.push(file);
    }
  }

  if (ir.mcp_servers?.length) {
    if (existsSync(p.configFile)) {
      // Key-scoped merge: foreign top-level blocks survive [CT1].
      const target = p.configFile;
      if (!opts.dryRun) {
        const merged = mergeYamlKeys(await readFile(target, 'utf8'), {
          mcpServers: toYamlBlocks(ir.mcp_servers, warnings),
        });
        await writeFile(target, merged, 'utf8');
      } else {
        toYamlBlocks(ir.mcp_servers, warnings);
      }
      written.push(target);
    } else if (scope === 'user') {
      // ~/.continue/config.yaml with its required top-level keys [CT1].
      if (!opts.dryRun) {
        await mkdir(dirname(p.configFile), { recursive: true });
        await writeFile(
          p.configFile,
          dump(
            {
              name: 'agent-forge',
              version: '0.0.1',
              schema: 'v1',
              mcpServers: toYamlBlocks(ir.mcp_servers, warnings),
            },
            { lineWidth: 100, noRefs: true },
          ),
          'utf8',
        );
      } else {
        toYamlBlocks(ir.mcp_servers, warnings);
      }
      written.push(p.configFile);
    } else {
      // No project config.yaml surface is documented [CT1] — use the
      // foreign-format auto-detect home [CT4].
      if (!opts.dryRun) {
        await mkdir(dirname(p.mcpJsonFile), { recursive: true });
        await writeFile(
          p.mcpJsonFile,
          `${JSON.stringify({ mcpServers: toJsonMap(ir.mcp_servers) }, null, 2)}\n`,
          'utf8',
        );
      }
      written.push(p.mcpJsonFile);
    }
  }

  for (const [field, label] of [
    ['hooks', 'hooks'],
    ['skills', 'skills'],
    ['agents', 'agents'],
  ] as const) {
    const items = ir[field];
    if (items?.length) {
      warnings.push(
        `${label}: Continue has no ${label} support (${items.length} skipped)`,
      );
      for (const i of items) {
        const id =
          (i as { name?: string; id?: string }).name ??
          (i as { id?: string }).id ??
          '?';
        skipped.push({ path: `${label}/${id}`, reason: 'unsupported' });
      }
    }
  }

  return { written, skipped, warnings };
}

export const continueAdapter: Adapter = {
  id: 'continue',
  capabilities,
  async detect(scope: Scope, cwd: string): Promise<boolean> {
    return existsSync(paths(scope, cwd).continueDir);
  },
  read: readImpl,
  write: writeImpl,
};
export default continueAdapter;
