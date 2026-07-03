import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import type { IR, McpServer, Scope, Skill } from '../../core/index.js';
import { parseRule } from '../../core/index.js';
import { type AmpMcpEntry, parseMcpEntry } from './mcp.js';
import { paths } from './paths.js';
import { readAmpAgents, readAmpCommands, readAmpHooks } from './plugins.js';
import { parseAmpSkill } from './skills.js';

async function readSettings(
  file: string,
): Promise<Record<string, unknown> | null> {
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(await readFile(file, 'utf8')) as Record<string, unknown>;
  } catch {
    return null; // amp settings.json(c) may carry comments — best-effort read only.
  }
}

export async function readAmp(scope: Scope, cwd: string): Promise<Partial<IR>> {
  const p = paths(scope, cwd);
  const ir: Partial<IR> = {};

  // Rules — single AGENTS.md at the resolved scope root [AM1].
  if (existsSync(p.rulesFile)) {
    const text = await readFile(p.rulesFile, 'utf8');
    ir.rules = [parseRule(text, 'main')];
  }

  // Cells — the shared, natively-read Agent Skills dir [AM4].
  if (existsSync(p.skillsDir)) {
    const entries = await readdir(p.skillsDir, { withFileTypes: true });
    const cells: Skill[] = [];
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory()) continue;
      const f = `${p.skillsDir}/${entry.name}/SKILL.md`;
      if (!existsSync(f)) continue;
      cells.push(parseAmpSkill(await readFile(f, 'utf8'), entry.name));
    }
    if (cells.length) ir.skills = cells;
  }

  // MCP — flat amp.mcpServers key [AM1].
  const settings = await readSettings(p.settingsFile);
  const servers = settings?.['amp.mcpServers'] as
    | Record<string, AmpMcpEntry>
    | undefined;
  if (servers && typeof servers === 'object' && !Array.isArray(servers)) {
    const out: McpServer[] = [];
    for (const [name, s] of Object.entries(servers)) {
      const parsed = parseMcpEntry(name, s);
      if (parsed) out.push(parsed);
    }
    if (out.length) ir.mcp_servers = out;
  }

  // Agents/commands/hooks — the YAML sidecar our own plugin emitters keep as
  // source of truth (the generated `.ts` is Amp's artifact, not ours to
  // reparse) [AM2][AM9].
  const agents = await readAmpAgents(scope, cwd);
  if (agents) ir.agents = agents;
  const commands = await readAmpCommands(scope, cwd);
  if (commands) ir.commands = commands;
  const hooks = await readAmpHooks(scope, cwd);
  if (hooks) ir.hooks = hooks;

  return ir;
}
