import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import TOML from '@iarna/toml';
import {
  type Agent,
  type Command,
  type Hook,
  type IR,
  type McpServer,
  type Scope,
  type Skill,
  parseCommand,
  parseRule,
  parseSkill,
} from '../../core/index.js';
import { codexToCanonical } from './events.js';
import { paths } from './paths.js';

interface CodexConfig {
  hooks?: Record<
    string,
    Array<{
      matcher?: string;
      hooks?: Array<{ type: string; command: string; timeout?: number }>;
    }>
  >;
  mcp_servers?: Record<string, McpEntry>;
}

interface McpEntry {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  bearer_token_env_var?: string;
  http_headers?: Record<string, string>;
}

export async function readCodex(
  scope: Scope,
  cwd: string,
): Promise<Partial<IR>> {
  const p = paths(scope, cwd);
  const ir: Partial<IR> = {};

  // Rules — AGENTS.override.md lifts over AGENTS.md [CX3].
  if (existsSync(p.overrideRulesFile)) {
    const text = await readFile(p.overrideRulesFile, 'utf8');
    ir.rules = [parseRule(text, 'main')];
  } else if (existsSync(p.rulesFile)) {
    const text = await readFile(p.rulesFile, 'utf8');
    ir.rules = [parseRule(text, 'main')];
  }

  // Config TOML — hooks + mcp only. `permissions`/`env` tables are never a
  // genuine Codex artifact (real surfaces are approval_policy/sandbox_mode +
  // shell_environment_policy [CX6]), so a fabricated-shape table — whether
  // hand-written or left by an older agent-forge — lifts zero phantom
  // resources rather than being trusted at face value.
  if (existsSync(p.configFile)) {
    const text = await readFile(p.configFile, 'utf8');
    const cfg = TOML.parse(text) as unknown as CodexConfig;
    if (cfg.hooks) {
      const hooks = parseCodexHooks(cfg.hooks);
      if (hooks.length) ir.hooks = hooks;
    }
    if (cfg.mcp_servers) {
      ir.mcp_servers = parseMcp(cfg.mcp_servers);
    }
  }

  // Prompts (commands)
  if (existsSync(p.promptsDir)) {
    const commands = await readMarkdownDir<Command>(p.promptsDir, parseCommand);
    if (commands.length) ir.commands = commands;
  }

  // Agents
  if (existsSync(p.agentsDir)) {
    const agents = await readCodexAgentsDir(p.agentsDir);
    if (agents.length) ir.agents = agents;
  }

  // Skills — .agents/skills/, NOT .codex/skills/ [CX2].
  if (existsSync(p.skillsDir)) {
    const skills = await readSkillsDir(p.skillsDir);
    if (skills.length) ir.skills = skills;
  }

  return ir;
}

function parseCodexHooks(hooks: NonNullable<CodexConfig['hooks']>): Hook[] {
  const out: Hook[] = [];
  let counter = 0;
  for (const [eventName, entries] of Object.entries(hooks)) {
    const canonical = codexToCanonical[eventName];
    if (!canonical) continue;
    for (const entry of entries) {
      for (const h of entry.hooks ?? []) {
        if (h.type !== 'command') continue;
        const hook: Hook = {
          id: `${eventName.toLowerCase()}-${counter++}`,
          events: [canonical],
          command: h.command,
        };
        if (entry.matcher) hook.matcher = entry.matcher;
        if (h.timeout !== undefined) hook.timeout = h.timeout;
        out.push(hook);
      }
    }
  }
  return out;
}

/**
 * `[mcp_servers.<name>]` per [CX7]: stdio {command,args,env}; remote
 * {url, bearer_token_env_var?, http_headers?} — no `type` key is documented,
 * so none is consulted; any `url` entry is Codex's one remote shape (http).
 */
function parseMcp(servers: Record<string, McpEntry>): McpServer[] {
  const out: McpServer[] = [];
  for (const [name, s] of Object.entries(servers)) {
    if (s.url) {
      const server = {
        name,
        transport: 'http',
        url: s.url,
      } as McpServer;
      if (s.bearer_token_env_var)
        (server as { bearer_token_env_var?: string }).bearer_token_env_var =
          s.bearer_token_env_var;
      if (s.http_headers) {
        // Preserve the codex-native spelling AND lift into the portable
        // `headers` field so a generic-authored IR round-trips (E4.S1) —
        // codex's dialect has no separate `headers` key of its own [CX7].
        (server as { http_headers?: Record<string, string> }).http_headers =
          s.http_headers;
        (server as { headers?: Record<string, string> }).headers =
          s.http_headers;
      }
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
  return out;
}

async function readMarkdownDir<T>(
  dir: string,
  parse: (text: string, name: string) => T,
): Promise<T[]> {
  const entries = await readdir(dir);
  const out: T[] = [];
  for (const entry of entries.sort()) {
    if (!entry.endsWith('.md')) continue;
    const name = basename(entry, '.md');
    const text = await readFile(join(dir, entry), 'utf8');
    out.push(parse(text, name));
  }
  return out;
}

/** `agents/<name>.toml` — documented fields only: name, description,
 * developer_instructions, model [CX1]. No `system_prompt`/`tools`/`color`:
 * those are fabricated-shape leftovers, never lifted as if genuine. */
async function readCodexAgentsDir(dir: string): Promise<Agent[]> {
  const entries = await readdir(dir);
  const out: Agent[] = [];
  for (const entry of entries.sort()) {
    if (!entry.endsWith('.toml')) continue;
    const text = await readFile(join(dir, entry), 'utf8');
    const parsed = TOML.parse(text) as unknown as {
      name?: string;
      description?: string;
      model?: string;
      developer_instructions?: string;
    };
    const name = parsed.name ?? basename(entry, '.toml');
    const agent: Agent = {
      name,
      body: parsed.developer_instructions ?? '',
    };
    if (parsed.description) agent.description = parsed.description;
    if (parsed.model) agent.model = parsed.model;
    out.push(agent);
  }
  return out;
}

async function readSkillsDir(dir: string): Promise<Skill[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: Skill[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    const skillFile = join(dir, entry.name, 'SKILL.md');
    if (!existsSync(skillFile)) continue;
    const text = await readFile(skillFile, 'utf8');
    out.push(parseSkill(text, entry.name));
  }
  return out;
}
