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
  parseFrontmatter,
  parseRule,
  parseSkill,
  readManagedRegion,
} from '../../core/index.js';
import { claudeToCanonical } from './events.js';
import { paths } from './paths.js';

interface ClaudeSettings {
  hooks?: Record<string, ClaudeHookEvent[]>;
  permissions?: { allow?: string[]; deny?: string[]; ask?: string[] };
  env?: Record<string, string>;
}

interface ClaudeHookCommand {
  type: string;
  /** Present on `type: command`. */
  command?: string;
  /** Present on `type: prompt` [CC6]. */
  prompt?: string;
  timeout?: number;
  id?: string;
  env?: Record<string, string>;
}

interface ClaudeHookEvent {
  matcher?: string;
  /** Permission-rule filter (v2.1.85+) [CC6]. */
  if?: string;
  hooks?: ClaudeHookCommand[];
}

/**
 * Adapter-private Hook extension fields — never part of the canonical IR
 * schema, carried only so a read→write round trip inside THIS adapter stays
 * lossless for Claude-specific hook shape ([CC6]: `if` filter, per-command
 * `env`, non-command `type`s like `prompt`). A cross-adapter consumer sees a
 * plain `Hook` (structurally compatible; the extra keys are simply ignored).
 */
export interface ClaudeHook extends Hook {
  if?: string;
  env?: Record<string, string>;
  /** Native hook `type` when not `'command'` (e.g. `'prompt'`) [CC6]. */
  kind?: string;
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

  // Rules — the primary file (CLAUDE.md / CLAUDE.local.md), else the
  // documented `.claude/CLAUDE.md` alt location [CC1]; each is read through
  // its marker-delimited managed region when one exists (write's own
  // convention), falling back to the whole file for a hand-authored source
  // with no markers. Non-concat rules additionally live in `.claude/rules/*.md`
  // with optional `paths:` frontmatter [CC1].
  const rules: Rule[] = [];
  if (p.rulesFile && existsSync(p.rulesFile)) {
    rules.push(await parseManagedRuleFile(p.rulesFile));
  } else if (existsSync(p.altRulesFile)) {
    rules.push(await parseManagedRuleFile(p.altRulesFile));
  }
  if (existsSync(p.rulesDir)) {
    rules.push(...(await readClaudeRulesDir(p.rulesDir)));
  }
  if (rules.length) ir.rules = rules;

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
  const out: ClaudeHook[] = [];
  let counter = 0;
  for (const [claudeEvent, entries] of Object.entries(hooks)) {
    const canonical = claudeToCanonical[claudeEvent];
    if (!canonical) continue; // unknown Claude event → skip
    for (const entry of entries) {
      for (const h of entry.hooks ?? []) {
        // Non-command types (prompt/http/agent/mcp_tool) are LIFTED, not
        // silently dropped [CC6]: the firing text becomes the Hook's
        // `command` (the canonical IR's one required action field), and the
        // native `type` is preserved as a private `kind` so a same-adapter
        // write can round-trip the original shape.
        const isCommand = h.type === 'command';
        const command = isCommand ? h.command : (h.prompt ?? h.command);
        if (typeof command !== 'string') continue; // nothing usable to lift
        // Prefer the embedded agent-forge id (write-side preservation, E3.S2);
        // derive one only for hooks authored natively without it.
        const id = h.id ?? `${claudeEvent.toLowerCase()}-${counter++}`;
        const hook: ClaudeHook = {
          id,
          events: [canonical],
          command,
        };
        if (entry.matcher) hook.matcher = entry.matcher;
        if (entry.if !== undefined) hook.if = entry.if;
        if (h.timeout !== undefined) hook.timeout = h.timeout;
        if (h.env !== undefined) hook.env = h.env;
        if (!isCommand) hook.kind = h.type;
        out.push(hook);
      }
    }
  }
  return out;
}

/**
 * Parse a primary rules file (CLAUDE.md / CLAUDE.local.md / the `.claude/
 * CLAUDE.md` alt location) into one `main` Rule. When the file carries
 * write's marker-delimited managed region, ONLY that region's content
 * becomes the rule body (the surrounding hand-maintained content is forge's
 * to leave alone, never to re-absorb as if it were rule source); a
 * hand-authored file with no markers is read whole, unchanged from before.
 */
async function parseManagedRuleFile(path: string): Promise<Rule> {
  const text = await readFile(path, 'utf8');
  const region = readManagedRegion(text);
  return parseRule(region ?? text, 'main');
}

/** `paths:` frontmatter → IR `globs` — Claude's own dialect key for
 *  `.claude/rules/*.md`, never `globs` [CC1] (mirrors the cline adapter's
 *  identical `.clinerules paths:` convention). Each file is a non-concat
 *  rule (`concat: false`) so a same-adapter write routes it back here. */
function parseClaudeRuleFile(text: string, defaultId: string): Rule {
  const { frontmatter, body } = parseFrontmatter<Record<string, unknown>>(text);
  const rule: Rule = { id: defaultId, body, concat: false };
  if (Array.isArray(frontmatter.paths)) {
    rule.globs = frontmatter.paths as string[];
  }
  return rule;
}

async function readClaudeRulesDir(dir: string): Promise<Rule[]> {
  const entries = await readdir(dir);
  const out: Rule[] = [];
  for (const entry of entries.sort()) {
    if (!entry.endsWith('.md')) continue;
    const id = basename(entry, '.md');
    const text = await readFile(join(dir, entry), 'utf8');
    out.push(parseClaudeRuleFile(text, id));
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
