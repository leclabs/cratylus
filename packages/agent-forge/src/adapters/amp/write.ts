import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { IR, Scope, WriteOpts, WriteReport } from '../../core/index.js';
import { mergeJsonKeys } from '../../core/index.js';
import { mcpEntry } from './mcp.js';
import { paths } from './paths.js';
import { writeAmpAgents, writeAmpCommands, writeAmpHooks } from './plugins.js';
import { AMP_LOSSY_FIELDS, serializeAmpSkill } from './skills.js';

export async function writeAmp(
  ir: IR,
  scope: Scope,
  cwd: string,
  opts: WriteOpts = {},
): Promise<WriteReport> {
  const p = paths(scope, cwd);
  const written: string[] = [];
  const skipped: { path: string; reason: string }[] = [];
  const warnings: string[] = [];

  // Rules — single concatenated AGENTS.md, cwd (project) or the user tier
  // home; per-rule metadata is lost, same 'partial' shape as the shared
  // AGENTS.md-native adapters [AM1].
  if (ir.rules?.length) {
    const body = ir.rules.map((r) => r.body).join('\n\n');
    if (!opts.dryRun) {
      await mkdir(dirname(p.rulesFile), { recursive: true });
      await writeFile(p.rulesFile, `${body}\n`, 'utf8');
    }
    written.push(p.rulesFile);
  }

  // Cells — the shared, natively-read Agent Skills dir; no bespoke amp dir
  // [AM4].
  if (ir.skills?.length) {
    for (const cell of ir.skills) {
      const cellFile = `${p.skillsDir}/${cell.name}/SKILL.md`;
      for (const field of AMP_LOSSY_FIELDS) {
        if (cell[field] !== undefined) {
          warnings.push(
            `skills/${cell.name}: '${field}' has no Amp frontmatter equivalent (dropped) [AM4]`,
          );
        }
      }
      if (!opts.dryRun) {
        await mkdir(dirname(cellFile), { recursive: true });
        await writeFile(cellFile, serializeAmpSkill(cell), 'utf8');
      }
      written.push(cellFile);
    }
  }

  // MCP — flat `amp.mcpServers` key in the ONE settings.json home [AM1].
  if (ir.mcp_servers?.length) {
    const existingText = existsSync(p.settingsFile)
      ? await readFile(p.settingsFile, 'utf8')
      : undefined;
    let existingMcp: Record<string, unknown> = {};
    if (existingText) {
      try {
        const parsed = JSON.parse(existingText) as Record<string, unknown>;
        existingMcp =
          (parsed['amp.mcpServers'] as Record<string, unknown>) ?? {};
      } catch {
        existingMcp = {}; // amp settings.json(c) may carry comments — best-effort merge only.
      }
    }
    for (const s of ir.mcp_servers) existingMcp[s.name] = mcpEntry(s);
    if (!opts.dryRun) {
      await mkdir(dirname(p.settingsFile), { recursive: true });
      await writeFile(
        p.settingsFile,
        mergeJsonKeys(existingText, { 'amp.mcpServers': existingMcp }),
        'utf8',
      );
    }
    written.push(p.settingsFile);
  }

  // Agents/commands/hooks are delivered via Amp's Plugin API (capability
  // `plugin`); compiled through the engine they route directly to their own
  // emitters and never reach this function. Direct `write` calls (tests,
  // embedders) still deliver them here for correctness.
  if (ir.agents?.length) {
    const r = await writeAmpAgents(ir, scope, cwd, opts);
    written.push(...r.written);
    skipped.push(...r.skipped);
    warnings.push(...r.warnings);
  }
  if (ir.commands?.length) {
    const r = await writeAmpCommands(ir, scope, cwd, opts);
    written.push(...r.written);
    skipped.push(...r.skipped);
    warnings.push(...r.warnings);
  }
  if (ir.hooks?.length) {
    const r = await writeAmpHooks(ir, scope, cwd, opts);
    written.push(...r.written);
    skipped.push(...r.skipped);
    warnings.push(...r.warnings);
  }

  if (ir.permissions) {
    warnings.push(
      'permissions: Amp has no general permission-DSL surface — per-tool-call decisions live in plugin handlers, not a config file (dropped) [AM8]',
    );
    skipped.push({ path: 'permissions', reason: 'unsupported' });
  }
  if (ir.env && Object.keys(ir.env).length) {
    warnings.push(
      'env: Amp has no documented global env surface (dropped) [AM1]',
    );
    skipped.push({ path: 'env', reason: 'unsupported' });
  }

  return { written, skipped, warnings };
}
