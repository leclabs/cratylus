import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import {
  type CanonicalEvent,
  type Command,
  type Hook,
  type IR,
  type McpServer,
  type Rule,
  type Scope,
  type Skill,
  parseCommand,
  parseFrontmatter,
  parseRule,
  parseSkill,
} from '../../core/index.js';
import { CLINE_HOOK_ID_MARKER, clineToCanonical } from './events.js';
import { paths } from './paths.js';

interface McpEntry {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  type?: 'streamableHttp' | string;
  headers?: Record<string, string>;
}

/** `paths:` frontmatter → IR `globs` — Cline's dialect key, never `globs` */
function parseClineRuleFile(text: string, defaultId: string): Rule {
  const { frontmatter, body } = parseFrontmatter<Record<string, unknown>>(text);
  const rule: Rule = { id: defaultId, body };
  if (Array.isArray(frontmatter.paths)) {
    rule.globs = frontmatter.paths as string[];
  }
  return rule;
}

async function readRulesDir(dir: string): Promise<Rule[]> {
  const entries = await readdir(dir);
  const out: Rule[] = [];
  for (const entry of entries.sort()) {
    if (!entry.endsWith('.md')) continue;
    const id = basename(entry, '.md');
    const text = await readFile(join(dir, entry), 'utf8');
    out.push(parseClineRuleFile(text, id));
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
    out.push(parseSkill(await readFile(skillFile, 'utf8'), entry.name));
  }
  return out;
}

async function readWorkflowsDir(dir: string): Promise<Command[]> {
  const entries = await readdir(dir);
  const out: Command[] = [];
  for (const entry of entries.sort()) {
    if (!entry.endsWith('.md')) continue;
    const name = basename(entry, '.md');
    const text = await readFile(join(dir, entry), 'utf8');
    out.push(parseCommand(text, name));
  }
  return out;
}

/** One `.clinerules/hooks/<EventName>` executable script → 0+ Hooks, keyed
 * off the `# agent-forge:<id>` marker lines this adapter's own writer
 * embeds (id preserved across reimport; a hand-authored script with no
 * marker lifts as zero hooks — its content isn't ours to parse). */
function parseHookScript(
  text: string,
  event: CanonicalEvent,
  nextId: () => string,
): Hook[] {
  const lines = text.split('\n');
  const out: Hook[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as string;
    if (!line.startsWith(CLINE_HOOK_ID_MARKER)) continue;
    const embedded = line.slice(CLINE_HOOK_ID_MARKER.length);
    const command = lines[i + 1] ?? '';
    out.push({ id: embedded || nextId(), events: [event], command });
    i++;
  }
  return out;
}

async function readHooksDir(dir: string): Promise<Hook[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: Hook[] = [];
  let counter = 0;
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isFile()) continue;
    const canonical = clineToCanonical[entry.name];
    if (!canonical) continue;
    const text = await readFile(join(dir, entry.name), 'utf8');
    out.push(
      ...parseHookScript(
        text,
        canonical,
        () => `${entry.name.toLowerCase()}-${counter++}`,
      ),
    );
  }
  return out;
}

function parseMcp(servers: Record<string, McpEntry>): McpServer[] {
  const out: McpServer[] = [];
  for (const [name, s] of Object.entries(servers)) {
    if (s.url) {
      // `type: streamableHttp` present ⇒ http; absent ⇒ legacy SSE [CL6].
      // Headers dropped on read (documented tracked gap, matches
      // codex/copilot/gemini's same remote-mcp divergence).
      out.push({
        name,
        transport: s.type === 'streamableHttp' ? 'http' : 'sse',
        url: s.url,
      } as McpServer);
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

export async function readCline(
  scope: Scope,
  cwd: string,
): Promise<Partial<IR>> {
  const p = paths(scope, cwd);
  const ir: Partial<IR> = {};

  const rules: Rule[] = [];
  if (scope === 'user') {
    // Every global rule — plain or glob — lives in the one directory [CL1].
    if (existsSync(p.rulesDir)) rules.push(...(await readRulesDir(p.rulesDir)));
  } else {
    // Plain/concatenated root [S22]; glob-activated individual files [CL1].
    if (existsSync(p.rulesFile)) {
      rules.push(parseRule(await readFile(p.rulesFile, 'utf8'), 'main'));
    }
    if (existsSync(p.rulesDir)) rules.push(...(await readRulesDir(p.rulesDir)));
  }
  if (rules.length) ir.rules = rules;

  if (existsSync(p.skillsDir)) {
    const skills = await readSkillsDir(p.skillsDir);
    if (skills.length) ir.skills = skills;
  }

  if (existsSync(p.workflowsDir)) {
    const commands = await readWorkflowsDir(p.workflowsDir);
    if (commands.length) ir.commands = commands;
  }

  if (existsSync(p.hooksDir)) {
    const hooks = await readHooksDir(p.hooksDir);
    if (hooks.length) ir.hooks = hooks;
  }

  // MCP: real only for the CLI at USER scope [CL6] — the fabricated
  // project-scope `.cline/mcp.json` (and the extension's globalStorage path,
  // unreachable generically) are never consulted, so no phantom import.
  if (scope === 'user' && existsSync(p.mcpFile)) {
    const parsed = JSON.parse(await readFile(p.mcpFile, 'utf8')) as {
      mcpServers?: Record<string, McpEntry>;
    };
    if (parsed.mcpServers) {
      const mcp = parseMcp(parsed.mcpServers);
      if (mcp.length) ir.mcp_servers = mcp;
    }
  }

  return ir;
}
