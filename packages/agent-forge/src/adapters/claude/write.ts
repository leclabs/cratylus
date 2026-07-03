import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  type Hook,
  type IR,
  type McpServer,
  type Scope,
  type WriteOpts,
  type WriteReport,
  mergeJsonKeys,
  serializeAgent,
  serializeCommand,
  serializeSkill,
} from '../../core/index.js';
import { canonicalToClaude } from './events.js';
import { paths } from './paths.js';

export async function writeClaude(
  ir: IR,
  scope: Scope,
  cwd: string,
  opts: WriteOpts = {},
): Promise<WriteReport> {
  const p = paths(scope, cwd);
  const written: string[] = [];
  const skipped: { path: string; reason: string }[] = [];
  const warnings: string[] = [];

  // Rules → CLAUDE.md (concatenated)
  if (ir.rules?.length) {
    if (!p.rulesFile) {
      warnings.push(
        `scope '${scope}' does not support rules; skipping ${ir.rules.length} rule(s)`,
      );
    } else {
      const body = ir.rules.map((r) => r.body).join('\n\n');
      if (!opts.dryRun) {
        await mkdir(dirname(p.rulesFile), { recursive: true });
        await writeFile(p.rulesFile, `${body}\n`, 'utf8');
      }
      written.push(p.rulesFile);
    }
  }

  // Settings.json: hooks + permissions + env — policy keys ONLY [CC8].
  // `mcpServers` is NOT a settings.json key at any scope; server definitions
  // live in the per-scope MCP home (below) [CC7]. Writes are key-scoped
  // merges: foreign keys in an existing settings file survive untouched.
  const settings: Record<string, unknown> = {};
  if (ir.hooks?.length) {
    const claudeHooks = serializeClaudeHooks(ir.hooks, warnings, skipped);
    if (Object.keys(claudeHooks).length > 0) settings.hooks = claudeHooks;
  }
  if (ir.permissions) settings.permissions = ir.permissions;
  if (ir.env) settings.env = ir.env;

  if (Object.keys(settings).length > 0) {
    if (!opts.dryRun) {
      await mkdir(dirname(p.settingsFile), { recursive: true });
      const existing = existsSync(p.settingsFile)
        ? await readFile(p.settingsFile, 'utf8')
        : undefined;
      await writeFile(
        p.settingsFile,
        mergeJsonKeys(existing, settings),
        'utf8',
      );
    }
    written.push(p.settingsFile);
  }

  // MCP servers → the documented home per scope [CC7]: project `.mcp.json`
  // (root key mcpServers); user `~/.claude.json` (top-level mcpServers);
  // local `~/.claude.json` under projects[<cwd>]. Foreign top-level keys AND
  // foreign server entries survive — forge upserts per server name.
  if (ir.mcp_servers?.length && p.mcpFile) {
    if (!opts.dryRun) {
      await mkdir(dirname(p.mcpFile), { recursive: true });
      const existing = existsSync(p.mcpFile)
        ? await readFile(p.mcpFile, 'utf8')
        : undefined;
      await writeFile(
        p.mcpFile,
        mergeJsonKeys(
          existing,
          mcpOwnedKeys(existing, ir.mcp_servers, scope, cwd),
        ),
        'utf8',
      );
    }
    written.push(p.mcpFile);
  }

  // Commands
  if (ir.commands?.length) {
    if (!p.commandsDir) {
      warnings.push(
        `scope '${scope}' does not support commands; skipping ${ir.commands.length}`,
      );
    } else {
      if (!opts.dryRun) await mkdir(p.commandsDir, { recursive: true });
      for (const cmd of ir.commands) {
        const path = join(p.commandsDir, `${cmd.name}.md`);
        if (!opts.dryRun) await writeFile(path, serializeCommand(cmd), 'utf8');
        written.push(path);
      }
    }
  }

  // Agents
  if (ir.agents?.length) {
    if (!p.agentsDir) {
      warnings.push(
        `scope '${scope}' does not support agents; skipping ${ir.agents.length}`,
      );
    } else {
      if (!opts.dryRun) await mkdir(p.agentsDir, { recursive: true });
      for (const agent of ir.agents) {
        const path = join(p.agentsDir, `${agent.name}.md`);
        if (!opts.dryRun) await writeFile(path, serializeAgent(agent), 'utf8');
        written.push(path);
      }
    }
  }

  // Skills (one directory per skill)
  if (ir.skills?.length) {
    if (!p.skillsDir) {
      warnings.push(
        `scope '${scope}' does not support skills; skipping ${ir.skills.length}`,
      );
    } else {
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
  }

  return { written, skipped, warnings };
}

/** The Claude `settings.json` `hooks` block shape: native-event → entries, each
 *  entry an optional matcher + one-or-more command hooks. */
export type ClaudeHooksBlock = Record<
  string,
  Array<{
    matcher?: string;
    hooks: Array<{
      type: 'command';
      command: string;
      timeout?: number;
      /** agent-forge hook id, embedded so reimport preserves it (E3.S2). */
      id?: string;
    }>;
  }>
>;

/** Serialize agent-forge `Hook` IR into the Claude `settings.json` `hooks` block,
 *  collecting per-event losses. The standalone (no caller-allocated arrays)
 *  public entry used by agent-anatomy's hook projector; `writeClaude` uses the
 *  array-threaded internal `serializeClaudeHooks` directly. */
export function serializeClaudeHooksReport(hooks: Hook[]): {
  hooks: ClaudeHooksBlock;
  warnings: string[];
  skipped: { path: string; reason: string }[];
} {
  const warnings: string[] = [];
  const skipped: { path: string; reason: string }[] = [];
  const block = serializeClaudeHooks(hooks, warnings, skipped);
  return { hooks: block, warnings, skipped };
}

function serializeClaudeHooks(
  hooks: Hook[],
  warnings: string[],
  skipped: { path: string; reason: string }[],
): ClaudeHooksBlock {
  const out: ClaudeHooksBlock = {};
  for (const hook of hooks) {
    for (const event of hook.events) {
      const claudeEvent = canonicalToClaude[event];
      if (!claudeEvent) {
        warnings.push(
          `hook '${hook.id ?? '?'}': canonical event '${event}' has no Claude equivalent`,
        );
        skipped.push({
          path: `hooks/${hook.id ?? '?'}.yaml`,
          reason: `no Claude mapping for ${event}`,
        });
        continue;
      }
      const cmd: {
        type: 'command';
        command: string;
        timeout?: number;
        id?: string;
      } = {
        type: 'command',
        command: hook.command,
      };
      if (hook.timeout !== undefined) cmd.timeout = hook.timeout;
      if (hook.id !== undefined) cmd.id = hook.id; // stable across reimport
      const entry: ClaudeHooksBlock[string][number] = {
        hooks: [cmd],
      };
      if (hook.matcher) entry.matcher = hook.matcher;
      out[claudeEvent] ??= [];
      out[claudeEvent].push(entry);
    }
  }
  return out;
}

/**
 * The owned top-level key(s) for an MCP emission into `existing` [CC7]:
 * user/project → `mcpServers` (per-server upsert over any existing block);
 * local → `projects` with only this cwd's `mcpServers` touched.
 */
function mcpOwnedKeys(
  existing: string | undefined,
  servers: McpServer[],
  scope: Scope,
  cwd: string,
): Record<string, unknown> {
  const base: Record<string, unknown> =
    existing === undefined || existing.trim() === ''
      ? {}
      : (JSON.parse(existing) as Record<string, unknown>);
  const serialized = serializeClaudeMcp(servers);
  if (scope === 'local') {
    const projects = (base.projects ?? {}) as Record<string, unknown>;
    const project = (projects[cwd] ?? {}) as Record<string, unknown>;
    const block = (project.mcpServers ?? {}) as Record<string, unknown>;
    return {
      projects: {
        ...projects,
        [cwd]: { ...project, mcpServers: { ...block, ...serialized } },
      },
    };
  }
  const block = (base.mcpServers ?? {}) as Record<string, unknown>;
  return { mcpServers: { ...block, ...serialized } };
}

function serializeClaudeMcp(servers: McpServer[]): Record<string, unknown> {
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
