// Claude plugin as a BUNDLING TARGET (E5.S5) — one full IR compiles to a
// distributable Claude plugin tree: `.claude-plugin/plugin.json` (`name`
// required [CC4]) + `skills/` + `agents/` + `hooks/hooks.json` + `.mcp.json`,
// matching the documented component layout [CC4][CC5]. Distinct from
// `writeClaude`'s ordinary per-scope `.claude/` tree: this is the plugin
// architecture used as a CARRIER, reachable via `compile --as-plugin <name>`
// (`src/cli/commands/compile.ts`) or directly, as here.
//
// Named `bundle.ts`, not `plugin.ts`: `src/core/engine/plugin.ts` already
// owns the (unrelated) per-resource `Support: 'plugin'` routing concept —
// distinct concepts, avoiding a same-word collision across the two areas.

import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  type IR,
  type WriteReport,
  mergeJsonKeys,
  serializeAgent,
  serializeSkill,
} from '../../core/index.js';
import {
  type ClaudeHooksBlock,
  serializeClaudeHooksReport,
  serializeClaudeMcp,
} from './write.js';

/** The documented intra-plugin path substitution [CC4][CC5]: a plugin may
 *  install anywhere, so bundled hook commands run relative to the plugin's
 *  own root rather than assuming a fixed install location. */
const CLAUDE_PLUGIN_ROOT = '${CLAUDE_PLUGIN_ROOT}';

/**
 * Compile a full IR into a distributable Claude plugin directory at `cwd`.
 * `pluginName` becomes `plugin.json`'s required `name` [CC4]. Only four
 * bundlable resource kinds are consumed — agents, hooks, mcp_servers, and
 * the Agent Skills corpus — since rules/commands/permissions/env have no
 * documented component in this tree (a `.claude-plugin/plugin.json`
 * documents no such fields); they are silently out of scope for this mode.
 */
export async function writeClaudePlugin(
  ir: IR,
  cwd: string,
  pluginName: string,
): Promise<WriteReport> {
  const written: string[] = [];
  const skipped: { path: string; reason: string }[] = [];
  const warnings: string[] = [];

  const manifestDir = join(cwd, '.claude-plugin');
  const manifestPath = join(manifestDir, 'plugin.json');
  await mkdir(manifestDir, { recursive: true });
  await writeFile(
    manifestPath,
    `${JSON.stringify({ name: pluginName }, null, 2)}\n`,
    'utf8',
  );
  written.push(manifestPath);

  if (ir.skills?.length) {
    for (const skill of ir.skills) {
      const skillDir = join(cwd, 'skills', skill.name);
      const skillFile = join(skillDir, 'SKILL.md');
      await mkdir(skillDir, { recursive: true });
      await writeFile(skillFile, serializeSkill(skill), 'utf8');
      written.push(skillFile);
    }
  }

  if (ir.agents?.length) {
    const agentsDir = join(cwd, 'agents');
    await mkdir(agentsDir, { recursive: true });
    for (const agent of ir.agents) {
      const agentFile = join(agentsDir, `${agent.name}.md`);
      await writeFile(agentFile, serializeAgent(agent), 'utf8');
      written.push(agentFile);
    }
  }

  if (ir.hooks?.length) {
    const report = serializeClaudeHooksReport(ir.hooks);
    warnings.push(...report.warnings);
    skipped.push(...report.skipped);
    const hooksDir = join(cwd, 'hooks');
    const hooksFile = join(hooksDir, 'hooks.json');
    await mkdir(hooksDir, { recursive: true });
    await writeFile(
      hooksFile,
      `${JSON.stringify({ hooks: rootHookCommands(report.hooks) }, null, 2)}\n`,
      'utf8',
    );
    written.push(hooksFile);
  }

  if (ir.mcp_servers?.length) {
    const mcpFile = join(cwd, '.mcp.json');
    const existing = existsSync(mcpFile)
      ? await readFile(mcpFile, 'utf8')
      : undefined;
    await writeFile(
      mcpFile,
      mergeJsonKeys(existing, {
        mcpServers: serializeClaudeMcp(ir.mcp_servers),
      }),
      'utf8',
    );
    written.push(mcpFile);
  }

  return { written, skipped, warnings };
}

/**
 * Every bundled hook command runs `cd`-relative to the plugin root [CC4][CC5]
 * — the documented `${CLAUDE_PLUGIN_ROOT}` substitution applied uniformly,
 * since the IR hook's `command` doesn't distinguish "a script this plugin
 * ships" from "an arbitrary shell command"; rebasing the working directory
 * makes any relative intra-plugin reference resolve regardless of install
 * location, without fabricating a script file the IR never declared.
 */
function rootHookCommands(block: ClaudeHooksBlock): ClaudeHooksBlock {
  const out: ClaudeHooksBlock = {};
  for (const [event, entries] of Object.entries(block)) {
    out[event] = entries.map((entry) => ({
      ...entry,
      hooks: entry.hooks.map((h) => ({
        ...h,
        ...(h.command !== undefined
          ? { command: `cd "${CLAUDE_PLUGIN_ROOT}" && ${h.command}` }
          : {}),
      })),
    }));
  }
  return out;
}
