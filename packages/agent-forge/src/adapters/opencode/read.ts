import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { load } from 'js-yaml';
import {
  type Agent,
  type Command,
  type Hook,
  type IR,
  type McpServer,
  type Permissions,
  type Scope,
  type Skill,
  parseAgent,
  parseCommand,
  parseRule,
  parseSkill,
} from '../../core/index.js';
import { paths } from './paths.js';

export async function readOpencode(
  scope: Scope,
  cwd: string,
): Promise<Partial<IR>> {
  const p = paths(scope, cwd);
  const ir: Partial<IR> = {};

  // Rules — AGENTS.md [OC3].
  if (existsSync(p.rulesFile)) {
    const text = await readFile(p.rulesFile, 'utf8');
    ir.rules = [parseRule(text, 'main')];
  }

  // Hooks — read the canonical sidecar YAML if present (plugin delivery).
  if (existsSync(p.hooksManifestFile)) {
    const text = await readFile(p.hooksManifestFile, 'utf8');
    const parsed = (load(text) ?? {}) as { hooks?: Hook[] };
    if (parsed.hooks?.length) ir.hooks = parsed.hooks;
  }

  // Skills — .opencode/skills/<n>/SKILL.md [OC6].
  if (existsSync(p.skillsDir)) {
    const skills = await readSkillsDir(p.skillsDir);
    if (skills.length) ir.skills = skills;
  }

  // Agents — .opencode/agents/*.md, filename = id [OC2].
  if (existsSync(p.agentsDir)) {
    const agents = await readMarkdownDir<Agent>(p.agentsDir, parseAgent);
    if (agents.length) ir.agents = agents;
  }

  // Commands — .opencode/commands/*.md, filename = id [OC4].
  if (existsSync(p.commandsDir)) {
    const commands = await readMarkdownDir<Command>(
      p.commandsDir,
      parseCommand,
    );
    if (commands.length) ir.commands = commands;
  }

  // MCP + permissions — the ONE config home, opencode.json [OC7][OC8]. The
  // fabricated sidecars (.opencode/{mcp,permissions,env}.json) are never
  // consulted — reading them would lift phantom resources.
  if (existsSync(p.configFile)) {
    const text = await readFile(p.configFile, 'utf8');
    const config = JSON.parse(text) as {
      mcp?: Record<string, OpencodeMcpEntry>;
      permission?: Record<string, OpencodePermissionValue>;
    };
    if (config.mcp) {
      const servers = parseMcpServers(config.mcp);
      if (servers.length) ir.mcp_servers = servers;
    }
    if (config.permission) {
      const permissions = permissionsFromOpencode(config.permission);
      if (Object.keys(permissions).length) ir.permissions = permissions;
    }
  }

  // No env surface: {env:VAR} substitution only, never a standalone config
  // key or file [OC1] — nothing to lift.

  return ir;
}

type OpencodeMcpEntry =
  | {
      type: 'local';
      command: [string, ...string[]];
      enabled?: boolean;
      environment?: Record<string, string>;
      cwd?: string;
    }
  | {
      type: 'remote';
      url: string;
      headers?: Record<string, string>;
      enabled?: boolean;
      oauth?: unknown;
    };

function parseMcpServers(
  servers: Record<string, OpencodeMcpEntry>,
): McpServer[] {
  const out: McpServer[] = [];
  for (const [name, s] of Object.entries(servers)) {
    if (s.type === 'remote') {
      const server = { name, transport: 'http', url: s.url } as McpServer;
      if (s.headers)
        (server as { headers?: Record<string, string> }).headers = s.headers;
      if (s.enabled === false)
        (server as { disabled?: boolean }).disabled = true;
      out.push(server);
    } else if (s.type === 'local') {
      const [command, ...args] = s.command;
      const server = {
        name,
        transport: 'stdio',
        command,
      } as McpServer;
      if (args.length) (server as { args?: string[] }).args = args;
      if (s.environment)
        (server as { env?: Record<string, string> }).env = s.environment;
      if (s.enabled === false)
        (server as { disabled?: boolean }).disabled = true;
      out.push(server);
    }
  }
  return out;
}

type OpencodePermissionValue =
  | 'allow'
  | 'ask'
  | 'deny'
  | Record<string, 'allow' | 'ask' | 'deny'>;

const ACTIONS = ['allow', 'ask', 'deny'] as const;

/** opencode `permission` DSL → IR permissions [OC8]. Best-effort: a bare
 * action becomes a `Tool(*)` pattern; a nested glob becomes `Tool(glob)`. */
function permissionsFromOpencode(
  perm: Record<string, OpencodePermissionValue>,
): Permissions {
  const buckets: Record<(typeof ACTIONS)[number], string[]> = {
    allow: [],
    ask: [],
    deny: [],
  };
  for (const [tool, value] of Object.entries(perm)) {
    const Tool = tool.charAt(0).toUpperCase() + tool.slice(1);
    if (typeof value === 'string') {
      if ((ACTIONS as readonly string[]).includes(value)) {
        buckets[value].push(`${Tool}(*)`);
      }
      continue;
    }
    for (const [glob, action] of Object.entries(value)) {
      if ((ACTIONS as readonly string[]).includes(action)) {
        buckets[action].push(`${Tool}(${glob})`);
      }
    }
  }
  const out: Permissions = {};
  if (buckets.allow.length) out.allow = buckets.allow;
  if (buckets.deny.length) out.deny = buckets.deny;
  if (buckets.ask.length) out.ask = buckets.ask;
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

/** Flat `<dir>/*.md` scan shared by agents + commands (filename = id). */
async function readMarkdownDir<T>(
  dir: string,
  parse: (text: string, defaultName: string) => T,
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
