import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import TOML from '@iarna/toml';
import {
  type Hook,
  type IR,
  type McpServer,
  type Scope,
  type WriteOpts,
  type WriteReport,
  serializeCommand,
  serializeSkill,
} from '../../core/index.js';
import { canonicalToCodex } from './events.js';
import { paths } from './paths.js';

export async function writeCodex(
  ir: IR,
  scope: Scope,
  cwd: string,
  opts: WriteOpts = {},
): Promise<WriteReport> {
  const p = paths(scope, cwd);
  const written: string[] = [];
  const skipped: { path: string; reason: string }[] = [];
  const warnings: string[] = [];

  // Rules → AGENTS.md
  if (ir.rules?.length) {
    const body = ir.rules.map((r: { body: string }) => r.body).join('\n\n');
    if (!opts.dryRun) {
      await mkdir(dirname(p.rulesFile), { recursive: true });
      await writeFile(p.rulesFile, `${body}\n`, 'utf8');
    }
    written.push(p.rulesFile);
  }

  // Config TOML — collect hooks/mcp into a single file. `permissions`/`env`
  // are NEVER written here: Codex's real surfaces are `approval_policy` /
  // `sandbox_mode` (permissions) and `shell_environment_policy` (env) — a
  // generic {allow,deny,ask} table or flat KEY=value map is a fabricated
  // shape with no Codex reader, so the loss is named and dropped, not
  // emitted [CX6].
  const config: Record<string, unknown> = {};
  if (ir.hooks?.length) {
    const compatible: Hook[] = ir.hooks.filter((h: Hook) =>
      h.events.some((e) => canonicalToCodex[e]),
    );
    const dropped: Hook[] = ir.hooks.filter(
      (h: Hook) => !h.events.some((e) => canonicalToCodex[e]),
    );
    for (const d of dropped) {
      warnings.push(
        `hook '${d.id ?? '?'}': no Codex equivalent for events ${d.events.join(',')}`,
      );
      skipped.push({
        path: `hooks/${d.id ?? '?'}.yaml`,
        reason: 'unsupported by Codex 7-event subset',
      });
    }
    if (compatible.length > 0) {
      // Warn about Bash-only matcher limitation for tool.use.* events
      for (const h of compatible) {
        if (
          h.events.some(
            (e: string) => e === 'tool.use.pre' || e === 'tool.use.post',
          ) &&
          h.matcher &&
          h.matcher !== 'Bash'
        ) {
          warnings.push(
            `hook '${h.id ?? '?'}': Codex hooks fire only for Bash; matcher '${h.matcher}' is ineffective`,
          );
        }
      }
      // No `[features] codex_hooks` gate: undocumented/fabricated [CX4].
      config.hooks = serializeCodexHooks(compatible);
    }
  }
  if (ir.mcp_servers?.length) {
    const mcp = serializeMcp(ir.mcp_servers, warnings);
    if (Object.keys(mcp).length > 0) config.mcp_servers = mcp;
  }
  if (ir.permissions) {
    warnings.push(
      "permissions: Codex's documented surface is approval_policy/sandbox_mode, not a generic {allow,deny,ask} table — dropped [CX6]",
    );
    skipped.push({
      path: 'config.toml#permissions',
      reason: 'no documented Codex TOML shape [CX6]',
    });
  }
  if (ir.env) {
    warnings.push(
      "env: Codex's documented surface is shell_environment_policy, not a flat KEY=value table — dropped [CX6]",
    );
    skipped.push({
      path: 'config.toml#env',
      reason: 'no documented Codex TOML shape [CX6]',
    });
  }

  if (Object.keys(config).length > 0) {
    if (!opts.dryRun) {
      await mkdir(dirname(p.configFile), { recursive: true });
      await writeFile(
        p.configFile,
        TOML.stringify(config as TOML.JsonMap),
        'utf8',
      );
    }
    written.push(p.configFile);
  }

  // Commands → prompts/<name>.md
  if (ir.commands?.length) {
    if (!opts.dryRun) await mkdir(p.promptsDir, { recursive: true });
    for (const cmd of ir.commands) {
      const path = join(p.promptsDir, `${cmd.name}.md`);
      if (!opts.dryRun) await writeFile(path, serializeCommand(cmd), 'utf8');
      written.push(path);
    }
  }

  // Agents → agents/<name>.toml — documented fields only: name, description,
  // developer_instructions, model [CX1]. `tools`/`color` have no documented
  // Codex agent-TOML field; carrying them would be fabrication, so they are
  // dropped with a named warning rather than emitted.
  if (ir.agents?.length) {
    if (!opts.dryRun) await mkdir(p.agentsDir, { recursive: true });
    for (const agent of ir.agents) {
      const path = join(p.agentsDir, `${agent.name}.toml`);
      const obj: Record<string, unknown> = {
        name: agent.name,
        developer_instructions: agent.body,
      };
      if (agent.description) obj.description = agent.description;
      if (agent.model) obj.model = agent.model;
      if (agent.tools) {
        warnings.push(
          `agent '${agent.name}': tools has no documented Codex agent-TOML field — dropped [CX1] (target: codex)`,
        );
      }
      if (agent.color) {
        warnings.push(
          `agent '${agent.name}': color has no documented Codex agent-TOML field — dropped [CX1] (target: codex)`,
        );
      }
      if (!opts.dryRun)
        await writeFile(path, TOML.stringify(obj as TOML.JsonMap), 'utf8');
      written.push(path);
    }
  }

  // Skills → .agents/skills/<name>/SKILL.md — NOT .codex/skills/ [CX2].
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

  return { written, skipped, warnings };
}

function serializeCodexHooks(hooks: Hook[]): Record<
  string,
  Array<{
    matcher?: string;
    hooks: Array<{ type: 'command'; command: string; timeout?: number }>;
  }>
> {
  const out: Record<
    string,
    Array<{
      matcher?: string;
      hooks: Array<{ type: 'command'; command: string; timeout?: number }>;
    }>
  > = {};
  for (const hook of hooks) {
    for (const event of hook.events) {
      const codexEvent = canonicalToCodex[event];
      if (!codexEvent) continue;
      const cmd: { type: 'command'; command: string; timeout?: number } = {
        type: 'command',
        command: hook.command,
      };
      if (hook.timeout !== undefined) cmd.timeout = hook.timeout;
      const entry: {
        matcher?: string;
        hooks: Array<{ type: 'command'; command: string; timeout?: number }>;
      } = {
        hooks: [cmd],
      };
      if (hook.matcher) entry.matcher = hook.matcher;
      out[codexEvent] ??= [];
      out[codexEvent].push(entry);
    }
  }
  return out;
}

/**
 * `[mcp_servers.<name>]` per [CX7]: stdio {command,args,env}; remote
 * {url, bearer_token_env_var?, http_headers?} — no `type` key. SSE has no
 * documented Codex shape at all: inexpressible, so it is warned and dropped
 * rather than silently emitted under a fabricated shape.
 */
function serializeMcp(
  servers: McpServer[],
  warnings: string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const s of servers) {
    if (s.transport === 'stdio') {
      const entry: Record<string, unknown> = { command: s.command };
      if (s.args) entry.args = s.args;
      if (s.env) entry.env = s.env;
      out[s.name] = entry;
    } else if (s.transport === 'sse') {
      warnings.push(
        `mcp server '${s.name}': SSE transport is inexpressible in the Codex dialect (no 'type' key, no SSE support) — dropped [CX7]`,
      );
    } else {
      const entry: Record<string, unknown> = { url: s.url };
      if (s.bearer_token_env_var)
        entry.bearer_token_env_var = s.bearer_token_env_var;
      // Codex's own field name is http_headers — no generic `headers` key
      // exists in the dialect [CX7]; a codex-specific http_headers override
      // wins, else the portable `headers` field is the source (E4.S1).
      const headers = s.http_headers ?? s.headers;
      if (headers) entry.http_headers = headers;
      out[s.name] = entry;
    }
  }
  return out;
}
