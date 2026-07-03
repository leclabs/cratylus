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
  type Rule,
  type Scope,
  type Skill,
  parseAgent,
  parseCommand,
  parseRule,
  parseSkill,
} from '../../core/index.js';
import { paths } from './paths.js';

/** kilo.jsonc is JSONC (line comments only, per the harness's own docs);
 * strip them before parsing — no block-comment support is documented. */
function parseJsonc(text: string): Record<string, unknown> {
  const stripped = text.replace(/^\s*\/\/.*$/gm, '');
  return JSON.parse(stripped) as Record<string, unknown>;
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

async function readRulesDir(dir: string): Promise<Rule[]> {
  return readMarkdownDir<Rule>(dir, parseRule);
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

export async function readKilo(
  scope: Scope,
  cwd: string,
): Promise<Partial<IR>> {
  const p = paths(scope, cwd);
  const ir: Partial<IR> = {};

  // Rules: native `.kilo/rules/*.md` plus, at project scope, the legacy
  // read-only `.kilocode/rules/*.md` tree [KL1][KL2] — recognized, never
  // written.
  const rules: Rule[] = [];
  if (existsSync(p.rulesDir)) rules.push(...(await readRulesDir(p.rulesDir)));
  if (p.legacyRulesDir && existsSync(p.legacyRulesDir)) {
    rules.push(...(await readRulesDir(p.legacyRulesDir)));
  }
  if (rules.length) ir.rules = rules;

  // Skills — `.kilo/skills/<name>/SKILL.md` [KL3].
  if (existsSync(p.skillsDir)) {
    const skills = await readSkillsDir(p.skillsDir);
    if (skills.length) ir.skills = skills;
  }

  // Agents — `.kilo/agents/*.md`, filename = id, `mode:` frontmatter [KL1].
  if (existsSync(p.agentsDir)) {
    const agents = await readMarkdownDir<Agent>(p.agentsDir, parseAgent);
    if (agents.length) ir.agents = agents;
  }

  // Commands — `.kilo/commands/*.md` [KL7].
  if (existsSync(p.commandsDir)) {
    const commands = await readMarkdownDir<Command>(
      p.commandsDir,
      parseCommand,
    );
    if (commands.length) ir.commands = commands;
  }

  // Hooks — read back the canonical sidecar YAML this adapter's own plugin
  // emitter writes (plugin delivery has no other read-back source of truth).
  if (existsSync(p.hooksManifestFile)) {
    const text = await readFile(p.hooksManifestFile, 'utf8');
    const parsed = (load(text) ?? {}) as { hooks?: Hook[] };
    if (parsed.hooks?.length) ir.hooks = parsed.hooks;
  }

  // MCP — the ONE config home, `kilo.jsonc` (`.kilo/` variant wins; root
  // fallback followed if that alone exists) [KL5]. No fabricated sidecar is
  // ever consulted.
  const configPath = existsSync(p.configFile)
    ? p.configFile
    : p.rootConfigFile && existsSync(p.rootConfigFile)
      ? p.rootConfigFile
      : undefined;
  if (configPath) {
    const config = parseJsonc(await readFile(configPath, 'utf8'));
    const mcp = config.mcp as Record<string, KiloMcpEntry> | undefined;
    if (mcp) {
      const servers = parseMcpServers(mcp);
      if (servers.length) ir.mcp_servers = servers;
    }
  }

  // Permissions/env: no documented standalone config surface — `permission`
  // is a per-agent frontmatter field (ordered glob rules), not a project-wide
  // list the IR `Permissions` shape models; nothing to lift [KL1].

  return ir;
}

type KiloMcpEntry =
  | {
      type: 'local';
      command: [string, ...string[]];
      enabled?: boolean;
      environment?: Record<string, string>;
    }
  | {
      type: 'remote';
      url: string;
      headers?: Record<string, string>;
      enabled?: boolean;
    };

function parseMcpServers(servers: Record<string, KiloMcpEntry>): McpServer[] {
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
      const server = { name, transport: 'stdio', command } as McpServer;
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
