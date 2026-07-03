import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import {
  type Agent,
  type Command,
  type Hook,
  type IR,
  type McpServer,
  type Rule,
  type Scope,
  type Skill,
  parseAgent,
  parseCommand,
  parseRule,
  parseSkill,
} from '../../core/index.js';
import { claudeToCanonical } from './events.js';
import { paths } from './paths.js';

interface ClaudeSettings {
  hooks?: Record<string, ClaudeHookEvent[]>;
  permissions?: { allow?: string[]; deny?: string[]; ask?: string[] };
  env?: Record<string, string>;
}

interface ClaudeHookEvent {
  matcher?: string;
  hooks?: { type: string; command: string; timeout?: number; id?: string }[];
}

interface ClaudeMcpEntry {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  type?: 'stdio' | 'http' | 'sse';
}

export async function readClaude(
  scope: Scope,
  cwd: string,
): Promise<Partial<IR>> {
  const p = paths(scope, cwd);
  const ir: Partial<IR> = {};

  // Rules — single file CLAUDE.md
  if (p.rulesFile && existsSync(p.rulesFile)) {
    const text = await readFile(p.rulesFile, 'utf8');
    ir.rules = [parseRule(text, 'main')];
  }

  // Settings (hooks, permissions, env) — policy keys only [CC8]. A
  // `mcpServers` key in settings.json is not a documented surface and never
  // lifts (no phantom servers from a fabricated shape).
  if (existsSync(p.settingsFile)) {
    const text = await readFile(p.settingsFile, 'utf8');
    const settings = JSON.parse(text) as ClaudeSettings;
    const hooks = settings.hooks ? parseClaudeHooks(settings.hooks) : [];
    if (hooks.length) ir.hooks = hooks;
    if (settings.permissions) ir.permissions = settings.permissions;
    if (settings.env) ir.env = settings.env;
  }

  // MCP servers from the documented home per scope [CC7]: project `.mcp.json`;
  // user `~/.claude.json` (top-level mcpServers); local `~/.claude.json`
  // under projects[<cwd>].
  if (p.mcpFile && existsSync(p.mcpFile)) {
    const text = await readFile(p.mcpFile, 'utf8');
    const parsed = JSON.parse(text) as {
      mcpServers?: Record<string, ClaudeMcpEntry>;
      projects?: Record<
        string,
        { mcpServers?: Record<string, ClaudeMcpEntry> }
      >;
    };
    const block =
      scope === 'local'
        ? parsed.projects?.[cwd]?.mcpServers
        : parsed.mcpServers;
    if (block) {
      const servers = parseClaudeMcp(block);
      if (servers.length) ir.mcp_servers = servers;
    }
  }

  // Commands
  if (p.commandsDir) {
    const commands = await readMarkdownDir<Command>(
      p.commandsDir,
      parseCommand,
    );
    if (commands.length) ir.commands = commands;
  }

  // Agents
  if (p.agentsDir) {
    const agents = await readMarkdownDir<Agent>(p.agentsDir, parseAgent);
    if (agents.length) ir.agents = agents;
  }

  // Skills
  if (p.skillsDir) {
    const skills = await readSkillsDir(p.skillsDir);
    if (skills.length) ir.skills = skills;
  }

  return ir;
}

function parseClaudeHooks(hooks: Record<string, ClaudeHookEvent[]>): Hook[] {
  const out: Hook[] = [];
  let counter = 0;
  for (const [claudeEvent, entries] of Object.entries(hooks)) {
    const canonical = claudeToCanonical[claudeEvent];
    if (!canonical) continue; // unknown Claude event → skip
    for (const entry of entries) {
      for (const h of entry.hooks ?? []) {
        if (h.type !== 'command' || typeof h.command !== 'string') continue;
        // Prefer the embedded agent-forge id (write-side preservation, E3.S2);
        // derive one only for hooks authored natively without it.
        const id = h.id ?? `${claudeEvent.toLowerCase()}-${counter++}`;
        const hook: Hook = {
          id,
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

function parseClaudeMcp(servers: Record<string, ClaudeMcpEntry>): McpServer[] {
  const out: McpServer[] = [];
  for (const [name, s] of Object.entries(servers)) {
    if (s.url) {
      const transport = s.type === 'sse' ? 'sse' : 'http';
      const server = {
        name,
        transport: transport as 'http' | 'sse',
        url: s.url,
      } as McpServer;
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
  return out;
}

async function readMarkdownDir<T>(
  dir: string,
  parse: (text: string, name: string) => T,
): Promise<T[]> {
  if (!existsSync(dir)) return [];
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

async function readSkillsDir(dir: string): Promise<Skill[]> {
  if (!existsSync(dir)) return [];
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
