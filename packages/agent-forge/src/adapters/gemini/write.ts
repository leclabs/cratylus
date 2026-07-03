import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import TOML from '@iarna/toml';
import {
  type Command,
  type Hook,
  type IR,
  type McpServer,
  type Scope,
  type WriteOpts,
  type WriteReport,
  serializeAgent,
  serializeSkill,
} from '../../core/index.js';
import { canonicalToGemini } from './events.js';
import { paths } from './paths.js';

export async function writeGemini(
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

  // Agents (subagent .md files)
  if (ir.agents?.length) {
    if (!opts.dryRun) await mkdir(p.agentsDir, { recursive: true });
    for (const agent of ir.agents) {
      const path = join(p.agentsDir, `${agent.name}.md`);
      if (!opts.dryRun) await writeFile(path, serializeAgent(agent), 'utf8');
      written.push(path);
    }
  }

  // Skills
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

  // settings.json: hooks + mcp (permissions/env have no documented key, below)
  const settings: Record<string, unknown> = {};
  if (ir.hooks?.length) {
    const compatible: Hook[] = ir.hooks.filter((h: Hook) =>
      h.events.some((e) => canonicalToGemini[e]),
    );
    const dropped: Hook[] = ir.hooks.filter(
      (h: Hook) => !h.events.some((e) => canonicalToGemini[e]),
    );
    for (const d of dropped) {
      warnings.push(
        `hook '${d.id ?? '?'}': no Gemini equivalent for events ${d.events.join(',')}`,
      );
      skipped.push({
        path: `hooks/${d.id ?? '?'}.yaml`,
        reason: 'unsupported by Gemini event surface',
      });
    }
    if (compatible.length > 0)
      settings.hooks = serializeGeminiHooks(compatible);
  }
  if (ir.mcp_servers?.length)
    settings.mcpServers = serializeMcp(ir.mcp_servers);
  // No documented settings.json `permissions`/`env` key [GM1] — the real
  // write-side controls are tools.core/excludeTools (+ MCP includeTools/
  // excludeTools) and .env file loading respectively. Emitting either
  // verbatim would be a fabricated shape a stock install cannot honor.
  if (ir.permissions) {
    warnings.push(
      'permissions: no documented Gemini settings.json permissions key; real controls are tools.core/excludeTools and MCP includeTools/excludeTools [GM1]',
    );
    skipped.push({
      path: 'settings.json#permissions',
      reason: 'no documented Gemini permissions surface [GM1]',
    });
  }
  if (ir.env) {
    warnings.push(
      'env: no documented Gemini settings.json env key; real env delivery is .env file loading [GM1]',
    );
    skipped.push({
      path: 'settings.json#env',
      reason: 'no documented Gemini env surface [GM1]',
    });
  }

  if (Object.keys(settings).length > 0) {
    if (!opts.dryRun) {
      await mkdir(dirname(p.settingsFile), { recursive: true });
      await writeFile(
        p.settingsFile,
        `${JSON.stringify(settings, null, 2)}\n`,
        'utf8',
      );
    }
    written.push(p.settingsFile);
  }

  // Commands → .gemini/commands/*.toml, required `prompt` key [GM5].
  if (ir.commands?.length) {
    if (!opts.dryRun) await mkdir(p.commandsDir, { recursive: true });
    for (const cmd of ir.commands) {
      const path = join(p.commandsDir, `${cmd.name}.toml`);
      const toml: { prompt: string; description?: string } = {
        prompt: cmd.body,
      };
      if (cmd.description) toml.description = cmd.description;
      for (const [field, val] of dropFields(cmd)) {
        if (val !== undefined) {
          warnings.push(
            `command '${cmd.name}': ${field} has no documented Gemini TOML field — dropped [GM5]`,
          );
        }
      }
      if (!opts.dryRun)
        await writeFile(path, TOML.stringify(toml as TOML.JsonMap), 'utf8');
      written.push(path);
    }
  }

  return { written, skipped, warnings };
}

/** Command fields with no documented Gemini TOML counterpart (`prompt` +
 * `description` are the only real keys [GM5]). */
function dropFields(
  cmd: Command,
): Array<[string, string | string[] | undefined]> {
  return [
    ['argument_hint', cmd.argument_hint],
    ['model', cmd.model],
    ['allowed_tools', cmd.allowed_tools],
  ];
}

type GeminiHookCmd = {
  type: 'command';
  command: string;
  timeout?: number;
  /** agent-forge hook id, embedded so reimport preserves it (E3.S2). */
  id?: string;
};

function serializeGeminiHooks(hooks: Hook[]): Record<
  string,
  Array<{
    matcher?: string;
    hooks: GeminiHookCmd[];
  }>
> {
  const out: Record<
    string,
    Array<{
      matcher?: string;
      hooks: GeminiHookCmd[];
    }>
  > = {};
  for (const hook of hooks) {
    for (const event of hook.events) {
      const geminiEvent = canonicalToGemini[event];
      if (!geminiEvent) continue;
      const cmd: GeminiHookCmd = {
        type: 'command',
        command: hook.command,
      };
      if (hook.timeout !== undefined) cmd.timeout = hook.timeout;
      if (hook.id !== undefined) cmd.id = hook.id; // stable across reimport
      const entry: {
        matcher?: string;
        hooks: GeminiHookCmd[];
      } = {
        hooks: [cmd],
      };
      if (hook.matcher) entry.matcher = hook.matcher;
      out[geminiEvent] ??= [];
      out[geminiEvent].push(entry);
    }
  }
  return out;
}

function serializeMcp(servers: McpServer[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const s of servers) {
    if (s.transport === 'stdio') {
      const entry: Record<string, unknown> = { command: s.command };
      if (s.args) entry.args = s.args;
      if (s.env) entry.env = s.env;
      out[s.name] = entry;
    } else if (s.transport === 'http') {
      // Streamable-HTTP → `httpUrl`, never `url` [GM1][S11].
      const entry: Record<string, unknown> = { httpUrl: s.url };
      if (s.headers) entry.headers = s.headers;
      out[s.name] = entry;
    } else {
      // SSE → `url`, no fabricated `type` key [GM1].
      const entry: Record<string, unknown> = { url: s.url };
      if (s.headers) entry.headers = s.headers;
      out[s.name] = entry;
    }
  }
  return out;
}
