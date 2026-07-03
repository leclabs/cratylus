import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
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
} from '../../core/index.js';
import { copilotToCanonical } from './events.js';
import { paths } from './paths.js';

interface HooksEnvelope {
  version?: number;
  hooks?: Record<
    string,
    Array<{
      type?: string;
      bash?: string;
      powershell?: string;
      timeoutSec?: number;
    }>
  >;
}

interface McpEntry {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  type?: 'stdio' | 'http' | 'sse';
}

export async function readCopilot(
  scope: Scope,
  cwd: string,
): Promise<Partial<IR>> {
  const p = paths(scope, cwd);
  const ir: Partial<IR> = {};

  // Rules — root AGENTS.md [CP3] and Copilot's own always-on instructions
  // tier [CP3][CP8] are both documented; at user scope they resolve to the
  // same file, so only read it once. Glob-activated instructions [S57] add
  // further Rule entries.
  const rules: Rule[] = [];
  if (existsSync(p.rulesFile)) {
    rules.push(parseRule(await readFile(p.rulesFile, 'utf8'), 'main'));
  }
  if (p.instructionsFile !== p.rulesFile && existsSync(p.instructionsFile)) {
    rules.push(
      parseRule(
        await readFile(p.instructionsFile, 'utf8'),
        'copilot-instructions',
      ),
    );
  }
  if (p.instructionsDir && existsSync(p.instructionsDir)) {
    rules.push(...(await readInstructionsDir(p.instructionsDir)));
  }
  if (rules.length) ir.rules = rules;

  // Skills
  if (existsSync(p.skillsDir)) {
    const skills = await readSkillsDir(p.skillsDir);
    if (skills.length) ir.skills = skills;
  }

  // Agents — GA custom agents [CP1][CP8].
  if (existsSync(p.agentsDir)) {
    const agents = await readAgentsDir(p.agentsDir);
    if (agents.length) ir.agents = agents;
  }

  // Commands — prompt files [CP5].
  if (p.promptsDir && existsSync(p.promptsDir)) {
    const commands = await readPromptsDir(p.promptsDir);
    if (commands.length) ir.commands = commands;
  }

  // Hooks — Copilot's own dialect, `.github/hooks/*.json` /
  // `~/.copilot/hooks/*.json`, documented `{"version":1}` camelCase
  // envelope [CP4].
  if (existsSync(p.hooksDir)) {
    const hooks = await readHooksDir(p.hooksDir);
    if (hooks.length) ir.hooks = hooks;
  }

  // MCP
  if (existsSync(p.mcpFile)) {
    const text = await readFile(p.mcpFile, 'utf8');
    const parsed = JSON.parse(text) as {
      servers?: Record<string, McpEntry>;
      mcpServers?: Record<string, McpEntry>;
    };
    const servers = parsed.servers ?? parsed.mcpServers;
    if (servers) ir.mcp_servers = parseMcp(servers);
  }

  return ir;
}

async function readInstructionsDir(dir: string): Promise<Rule[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: Rule[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isFile() || !entry.name.endsWith('.instructions.md')) continue;
    const id = entry.name.slice(0, -'.instructions.md'.length);
    const text = await readFile(join(dir, entry.name), 'utf8');
    const { frontmatter, body } =
      parseFrontmatter<Record<string, unknown>>(text);
    const rule: Rule = { id, body, activation: 'glob' };
    if (typeof frontmatter.applyTo === 'string') {
      rule.globs = frontmatter.applyTo
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean);
    }
    if (typeof frontmatter.description === 'string')
      rule.description = frontmatter.description;
    out.push(rule);
  }
  return out;
}

async function readAgentsDir(dir: string): Promise<Agent[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: Agent[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isFile() || !entry.name.endsWith('.agent.md')) continue;
    const name = entry.name.slice(0, -'.agent.md'.length);
    const text = await readFile(join(dir, entry.name), 'utf8');
    out.push(parseAgent(text, name));
  }
  return out;
}

async function readPromptsDir(dir: string): Promise<Command[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: Command[] = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isFile() || !entry.name.endsWith('.prompt.md')) continue;
    const name = entry.name.slice(0, -'.prompt.md'.length);
    const text = await readFile(join(dir, entry.name), 'utf8');
    out.push(parseCommand(text, name));
  }
  return out;
}

async function readHooksDir(dir: string): Promise<Hook[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: Hook[] = [];
  let counter = 0;
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const text = await readFile(join(dir, entry.name), 'utf8');
    let envelope: HooksEnvelope;
    try {
      envelope = JSON.parse(text) as HooksEnvelope;
    } catch {
      continue;
    }
    if (!envelope.hooks) continue;
    for (const [eventName, entriesForEvent] of Object.entries(envelope.hooks)) {
      const canonical = copilotToCanonical[eventName];
      if (!canonical) continue;
      for (const h of entriesForEvent) {
        if (h.type !== 'command') continue;
        const command = h.bash ?? h.powershell;
        if (!command) continue;
        const hook: Hook = {
          id: `${eventName}-${counter++}`,
          events: [canonical],
          command,
        };
        if (h.timeoutSec !== undefined) hook.timeout = h.timeoutSec;
        out.push(hook);
      }
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
