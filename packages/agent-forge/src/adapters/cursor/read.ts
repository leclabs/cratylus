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
import { cursorToCanonical } from './events.js';
import { paths } from './paths.js';

interface CursorHooksFile {
  hooks?: Record<
    string,
    Array<{ matcher?: string; command: string; timeout?: number; id?: string }>
  >;
}

interface McpEntry {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  auth?: Record<string, unknown>;
  type?: 'stdio' | 'http' | 'sse';
}

export async function readCursor(
  scope: Scope,
  cwd: string,
): Promise<Partial<IR>> {
  const p = paths(scope, cwd);
  const ir: Partial<IR> = {};

  const rules: Rule[] = [];
  // Plain/concatenated rules — AGENTS.md, no frontmatter [CU1]. Project scope
  // only: `~/.cursor/AGENTS.md` has no documented file surface for User
  // Rules (settings UI, plain text) — write never targets it (E8.S5) and
  // read must not lift it as a phantom rule either (E1.S3, convergence-
  // graduation 2026-07).
  if (scope === 'project' && existsSync(p.rulesFile)) {
    const text = await readFile(p.rulesFile, 'utf8');
    rules.push(parseRule(text, 'main'));
  }
  // The primary rules surface — .cursor/rules/*.mdc, frontmatter
  // description/globs/alwaysApply; `.md` in this dir is never consumed by a
  // stock Cursor and must not be read as a rule [CU1].
  if (existsSync(p.rulesDir)) {
    rules.push(...(await readMdcRulesDir(p.rulesDir)));
  }
  if (rules.length) ir.rules = rules;

  if (existsSync(p.skillsDir)) {
    const skills = await readSkillsDir(p.skillsDir);
    if (skills.length) ir.skills = skills;
  }

  if (existsSync(p.agentsDir)) {
    const agents = await readMarkdownDir<Agent>(p.agentsDir, parseAgent);
    if (agents.length) ir.agents = agents;
  }

  if (existsSync(p.commandsDir)) {
    const commands = await readMarkdownDir<Command>(
      p.commandsDir,
      parseCommand,
    );
    if (commands.length) ir.commands = commands;
  }

  if (existsSync(p.hooksFile)) {
    const text = await readFile(p.hooksFile, 'utf8');
    const parsed = JSON.parse(text) as CursorHooksFile;
    if (parsed.hooks) {
      const hooks = parseCursorHooks(parsed.hooks);
      if (hooks.length) ir.hooks = hooks;
    }
  }

  if (existsSync(p.mcpFile)) {
    const text = await readFile(p.mcpFile, 'utf8');
    const parsed = JSON.parse(text) as {
      mcpServers?: Record<string, McpEntry>;
    };
    if (parsed.mcpServers) ir.mcp_servers = parseMcp(parsed.mcpServers);
  }

  return ir;
}

/** `.cursor/rules/*.mdc` — `.md` files in this dir are never read [CU1]. */
async function readMdcRulesDir(dir: string): Promise<Rule[]> {
  const entries = await readdir(dir);
  const out: Rule[] = [];
  for (const entry of entries.sort()) {
    if (!entry.endsWith('.mdc')) continue;
    const id = basename(entry, '.mdc');
    const text = await readFile(join(dir, entry), 'utf8');
    out.push(normalizeGlobs(parseRule(text, id)));
  }
  return out;
}

/**
 * The documented `.mdc` dialect allows `globs` as a comma-separated string
 * [CU1], but the IR schema requires an array — coerce here rather than
 * fail validation on a real-world fixture.
 */
function normalizeGlobs(rule: Rule): Rule {
  const raw = (rule as unknown as { globs?: unknown }).globs;
  if (typeof raw === 'string') {
    rule.globs = raw
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);
  }
  return rule;
}

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

function parseCursorHooks(
  hooks: NonNullable<CursorHooksFile['hooks']>,
): Hook[] {
  const out: Hook[] = [];
  let counter = 0;
  for (const [eventName, entries] of Object.entries(hooks)) {
    const canonical = cursorToCanonical[eventName];
    if (!canonical) continue;
    for (const entry of entries) {
      const hook: Hook = {
        // Prefer the embedded agent-forge id (write-side preservation, E3.S2).
        id: entry.id ?? `${eventName.toLowerCase()}-${counter++}`,
        events: [canonical],
        command: entry.command,
      };
      if (entry.matcher) hook.matcher = entry.matcher;
      if (entry.timeout !== undefined) hook.timeout = entry.timeout;
      out.push(hook);
    }
  }
  return out;
}

function parseMcp(servers: Record<string, McpEntry>): McpServer[] {
  const out: McpServer[] = [];
  for (const [name, s] of Object.entries(servers)) {
    if (s.url) {
      const server = {
        name,
        transport: s.type === 'sse' ? 'sse' : 'http',
        url: s.url,
      } as McpServer;
      if (s.headers)
        (server as { headers?: Record<string, string> }).headers = s.headers;
      if (s.auth) (server as { auth?: Record<string, unknown> }).auth = s.auth;
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
