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
  parseAgent,
  parseRule,
  parseSkill,
} from '../../core/index.js';
import { geminiToCanonical } from './events.js';
import { paths } from './paths.js';

interface SettingsFile {
  hooks?: Record<
    string,
    Array<{
      matcher?: string;
      hooks?: Array<{
        type: string;
        command: string;
        timeout?: number;
        id?: string;
      }>;
    }>
  >;
  mcpServers?: Record<string, McpEntry>;
  // No `permissions`/`env` fields — settings.json has no documented shape
  // for either [GM1]; a fabricated-shape import must NOT lift them (E1.S3).
}

interface McpEntry {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string; // SSE [GM1]
  httpUrl?: string; // streamable HTTP [GM1][S11]
  headers?: Record<string, string>;
}

export async function readGemini(
  scope: Scope,
  cwd: string,
): Promise<Partial<IR>> {
  const p = paths(scope, cwd);
  const ir: Partial<IR> = {};

  if (existsSync(p.rulesFile)) {
    const text = await readFile(p.rulesFile, 'utf8');
    ir.rules = [parseRule(text, 'main')];
  }

  if (existsSync(p.settingsFile)) {
    const settings = JSON.parse(
      await readFile(p.settingsFile, 'utf8'),
    ) as SettingsFile;
    if (settings.hooks) {
      const hooks = parseGeminiHooks(settings.hooks);
      if (hooks.length) ir.hooks = hooks;
    }
    if (settings.mcpServers) ir.mcp_servers = parseMcp(settings.mcpServers);
  }

  if (existsSync(p.agentsDir)) {
    const agents = await readMarkdownDir<Agent>(p.agentsDir, parseAgent);
    if (agents.length) ir.agents = agents;
  }

  if (existsSync(p.skillsDir)) {
    const skills = await readSkillsDir(p.skillsDir);
    if (skills.length) ir.skills = skills;
  }

  if (existsSync(p.commandsDir)) {
    const commands = await readCommandsDir(p.commandsDir);
    if (commands.length) ir.commands = commands;
  }

  return ir;
}

function parseGeminiHooks(hooks: NonNullable<SettingsFile['hooks']>): Hook[] {
  const out: Hook[] = [];
  let counter = 0;
  for (const [eventName, entries] of Object.entries(hooks)) {
    const canonical = geminiToCanonical[eventName];
    if (!canonical) continue;
    for (const entry of entries) {
      for (const h of entry.hooks ?? []) {
        if (h.type !== 'command') continue;
        const hook: Hook = {
          // Prefer the embedded agent-forge id (write-side preservation, E3.S2).
          id: h.id ?? `${eventName.toLowerCase()}-${counter++}`,
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

function parseMcp(servers: Record<string, McpEntry>): McpServer[] {
  const out: McpServer[] = [];
  for (const [name, s] of Object.entries(servers)) {
    if (s.httpUrl) {
      const server = { name, transport: 'http', url: s.httpUrl } as McpServer;
      if (s.headers)
        (server as { headers?: Record<string, string> }).headers = s.headers;
      out.push(server);
    } else if (s.url) {
      // `url` is SSE-only in the documented dialect [GM1][S11].
      const server = { name, transport: 'sse', url: s.url } as McpServer;
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

/** `.gemini/commands/*.toml` — required `prompt`, optional `description`
 * [GM5]; no namespaced-subdir scan (write side is flat, matching the IR's
 * flat `Command.name`). */
async function readCommandsDir(dir: string): Promise<Command[]> {
  const entries = await readdir(dir);
  const out: Command[] = [];
  for (const entry of entries.sort()) {
    if (!entry.endsWith('.toml')) continue;
    const name = basename(entry, '.toml');
    const text = await readFile(join(dir, entry), 'utf8');
    const parsed = TOML.parse(text) as {
      prompt?: string;
      description?: string;
    };
    if (typeof parsed.prompt !== 'string') continue; // malformed: no required key
    const cmd: Command = { name, body: parsed.prompt };
    if (parsed.description) cmd.description = parsed.description;
    out.push(cmd);
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
