import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  type Hook,
  type IR,
  type McpServer,
  type Rule,
  type Scope,
  type WriteOpts,
  type WriteReport,
  mergeJsonKeys,
  serializeAgent,
  serializeCommand,
  serializeFrontmatter,
  serializeSkill,
  upsertManagedRegion,
} from '../../core/index.js';
import { canonicalToClaude } from './events.js';
import { paths } from './paths.js';
import type { ClaudeHook } from './read.js';

/** The claude-documented shim: CLAUDE.md's managed region imports the
 *  shared, tool-agnostic rules surface rather than duplicating rule bodies
 *  [S7] — Anthropic's own recommended pattern (Claude Code does not read
 *  AGENTS.md natively; `@AGENTS.md` — or a symlink — is the shim). This
 *  adapter never writes AGENTS.md itself (E7.S10): authoring it is a
 *  separate concern (hand-maintained, or another AGENTS.md-native target in
 *  the same compile) — surfaced as a warning below, never silently assumed. */
const AGENTS_MD_IMPORT = '@AGENTS.md';

/** A rule with `concat: false` compiles to its own `.claude/rules/<id>.md`
 *  file [CC1]; everything else concatenates into the shared primary rules
 *  file's managed region. */
function isNonConcatRule(r: Rule): boolean {
  return r.concat === false;
}

/** `.claude/rules/<id>.md` dialect: plain body, `paths:` frontmatter
 *  carrying `globs` when present [CC1] — Claude's own key is `paths`, never
 *  the IR's `globs` (mirrors the cline adapter's identical convention). */
function serializeClaudeRuleFile(rule: Rule): string {
  const fm: Record<string, unknown> = {};
  if (rule.globs !== undefined) fm.paths = rule.globs;
  return serializeFrontmatter(fm, rule.body);
}

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

  // Rules: non-concat → .claude/rules/<id>.md [CC1]; concat → the primary
  // rules file's marker-delimited managed region (E9.S4/E3.S5 read-merge
  // discipline — hand-maintained content outside the region survives).
  if (ir.rules?.length) {
    const nonConcat = ir.rules.filter(isNonConcatRule);
    const concatRules = ir.rules.filter((r) => !isNonConcatRule(r));

    if (nonConcat.length) {
      if (!opts.dryRun) await mkdir(p.rulesDir, { recursive: true });
      for (const rule of nonConcat) {
        const path = join(p.rulesDir, `${rule.id}.md`);
        if (!opts.dryRun) {
          await writeFile(path, serializeClaudeRuleFile(rule), 'utf8');
        }
        written.push(path);
      }
    }

    if (concatRules.length) {
      if (!p.rulesFile) {
        warnings.push(
          `scope '${scope}' does not support rules; skipping ${concatRules.length} rule(s)`,
        );
      } else {
        // CLAUDE.local.md has no AGENTS.md-shim equivalent (it is the
        // personal, never-committed local tier) — its managed region carries
        // the concatenated bodies literally, same as before this shard.
        const isLocal = scope === 'local';
        const regionContent = isLocal
          ? concatRules.map((r) => r.body).join('\n\n')
          : AGENTS_MD_IMPORT;
        const existing = existsSync(p.rulesFile)
          ? await readFile(p.rulesFile, 'utf8')
          : undefined;
        const merged = upsertManagedRegion(existing, regionContent);
        if (!opts.dryRun) {
          await mkdir(dirname(p.rulesFile), { recursive: true });
          await writeFile(p.rulesFile, merged, 'utf8');
        }
        written.push(p.rulesFile);
        if (!isLocal) {
          warnings.push(
            `claude: CLAUDE.md's managed region imports ${AGENTS_MD_IMPORT} — rule bodies are not duplicated there [S7]; author/emit AGENTS.md separately (hand-maintained, or an AGENTS.md-native target in this compile) so the import resolves`,
          );
        }
      }
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
 *  entry an optional matcher + `if` filter + one-or-more hook commands
 *  (`command`, or a lifted non-command type such as `prompt`) [CC6]. */
export type ClaudeHooksBlock = Record<
  string,
  Array<{
    matcher?: string;
    /** Permission-rule filter (v2.1.85+) [CC6]. */
    if?: string;
    hooks: Array<{
      type: 'command' | string;
      command?: string;
      /** Present when `type !== 'command'` (e.g. `type: 'prompt'`) [CC6]. */
      prompt?: string;
      timeout?: number;
      /** agent-forge hook id, embedded so reimport preserves it (E3.S2). */
      id?: string;
      env?: Record<string, string>;
    }>;
  }>
>;

/** Serialize agent-forge `Hook` IR into the Claude `settings.json` `hooks` block,
 *  collecting per-event losses. The standalone (no caller-allocated arrays)
 *  public entry used by agent-canon's hook projector; `writeClaude` uses the
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
    const ch = hook as ClaudeHook;
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
      // A hook lifted from a non-command native type (e.g. `prompt` [CC6])
      // carries its adapter-private `kind`; round-trip it to the SAME native
      // shape rather than misrepresenting it as `type: command`.
      const isPrompt = ch.kind !== undefined && ch.kind !== 'command';
      const cmd: ClaudeHooksBlock[string][number]['hooks'][number] = isPrompt
        ? { type: ch.kind as string, prompt: hook.command }
        : { type: 'command', command: hook.command };
      if (hook.timeout !== undefined) cmd.timeout = hook.timeout;
      if (hook.id !== undefined) cmd.id = hook.id; // stable across reimport
      if (ch.env !== undefined) cmd.env = ch.env;
      const entry: ClaudeHooksBlock[string][number] = {
        hooks: [cmd],
      };
      if (hook.matcher) entry.matcher = hook.matcher;
      if (ch.if !== undefined) entry.if = ch.if;
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

/** Public so the plugin-bundle emitter (`plugin.ts`, E5.S5) can reuse the
 *  exact same `.mcp.json` server shape without re-deriving it. */
export function serializeClaudeMcp(
  servers: McpServer[],
): Record<string, unknown> {
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
