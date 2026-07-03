import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  type Hook,
  type IR,
  type McpServer,
  type Rule,
  type Scope,
  type WriteOpts,
  type WriteReport,
  serializeAgent,
  serializeCommand,
  serializeFrontmatter,
  serializeSkill,
} from '../../core/index.js';
import { canonicalToCopilot } from './events.js';
import { paths } from './paths.js';

/** A rule with glob-scoped activation compiles to `.github/instructions/` [S57], not AGENTS.md (R6). */
function isGlobRule(r: Rule): boolean {
  return r.activation === 'glob' || Boolean(r.globs?.length);
}

export async function writeCopilot(
  ir: IR,
  scope: Scope,
  cwd: string,
  opts: WriteOpts = {},
): Promise<WriteReport> {
  const p = paths(scope, cwd);
  const written: string[] = [];
  const skipped: { path: string; reason: string }[] = [];
  const warnings: string[] = [];

  // Rules — plain rules concatenate into the shared AGENTS.md-class root
  // [CP3]; glob-activated rules compile individually to the documented
  // applyTo tier [S57].
  if (ir.rules?.length) {
    const concatRules = ir.rules.filter((r) => !isGlobRule(r));
    const globRules = ir.rules.filter((r) => isGlobRule(r));

    if (concatRules.length) {
      const body = concatRules.map((r) => r.body).join('\n\n');
      if (!opts.dryRun) {
        await mkdir(dirname(p.rulesFile), { recursive: true });
        await writeFile(p.rulesFile, `${body}\n`, 'utf8');
      }
      written.push(p.rulesFile);
    }

    if (globRules.length) {
      if (p.instructionsDir) {
        const instructionsDir = p.instructionsDir;
        for (const rule of globRules) {
          const file = join(instructionsDir, `${rule.id}.instructions.md`);
          const fm: Record<string, unknown> = {
            applyTo: (rule.globs ?? []).join(','),
          };
          if (rule.description !== undefined) fm.description = rule.description;
          if (!opts.dryRun) {
            await mkdir(instructionsDir, { recursive: true });
            await writeFile(file, serializeFrontmatter(fm, rule.body), 'utf8');
          }
          written.push(file);
        }
      } else {
        warnings.push(
          `rules: glob-activated instructions have no documented personal-scope surface (${globRules.length} skipped)`,
        );
        for (const rule of globRules)
          skipped.push({
            path: `instructions/${rule.id}.instructions.md`,
            reason: 'no documented user-scope instructions surface',
          });
      }
    }
  }

  // Skills — Agent Skills spec directory [CP2][CP8].
  if (ir.skills?.length) {
    for (const skill of ir.skills) {
      const skillDir = join(p.skillsDir, skill.name);
      const skillFile = join(skillDir, 'SKILL.md');
      if (!opts.dryRun) {
        await mkdir(skillDir, { recursive: true });
        await writeFile(skillFile, serializeSkill(skill), 'utf8');
      }
      written.push(skillFile);
    }
  }

  // Agents — GA custom agents [CP1][CP8].
  if (ir.agents?.length) {
    if (!opts.dryRun) await mkdir(p.agentsDir, { recursive: true });
    for (const agent of ir.agents) {
      const file = join(p.agentsDir, `${agent.name}.agent.md`);
      if (!opts.dryRun) await writeFile(file, serializeAgent(agent), 'utf8');
      written.push(file);
    }
  }

  // Commands — prompt files → /name (VS Code) [CP5]. No documented
  // personal-scope prompts surface.
  if (ir.commands?.length) {
    if (p.promptsDir) {
      const promptsDir = p.promptsDir;
      if (!opts.dryRun) await mkdir(promptsDir, { recursive: true });
      for (const cmd of ir.commands) {
        const file = join(promptsDir, `${cmd.name}.prompt.md`);
        if (!opts.dryRun) await writeFile(file, serializeCommand(cmd), 'utf8');
        written.push(file);
      }
    } else {
      warnings.push(
        `commands: prompt files have no documented personal-scope surface (${ir.commands.length} skipped)`,
      );
      for (const c of ir.commands)
        skipped.push({
          path: `prompts/${c.name}.prompt.md`,
          reason: 'no documented user-scope prompts surface',
        });
    }
  }

  // Hooks — Copilot's own dialect: `.github/hooks/*.json` (repo) /
  // `~/.copilot/hooks/*.json` (CLI), documented `{"version":1}` camelCase
  // envelope, `bash`/`powershell` command fields [CP4].
  if (ir.hooks?.length) {
    const compatibleHooks = ir.hooks.filter((h) =>
      h.events.some((e) => canonicalToCopilot[e]),
    );
    const droppedHooks = ir.hooks.filter(
      (h) => !h.events.some((e) => canonicalToCopilot[e]),
    );
    for (const dropped of droppedHooks) {
      warnings.push(
        `hook '${dropped.id ?? '?'}': no Copilot equivalent for events ${dropped.events.join(',')}`,
      );
      skipped.push({
        path: `hooks/${dropped.id ?? '?'}.json`,
        reason: 'unsupported by Copilot documented event set',
      });
    }
    if (compatibleHooks.length > 0) {
      const file = join(p.hooksDir, 'agent-forge.json');
      const envelope = {
        version: 1,
        hooks: serializeHooksCopilotShape(compatibleHooks),
      };
      if (!opts.dryRun) {
        await mkdir(p.hooksDir, { recursive: true });
        await writeFile(file, `${JSON.stringify(envelope, null, 2)}\n`, 'utf8');
      }
      written.push(file);
    }
  }

  // MCP
  if (ir.mcp_servers?.length) {
    if (!opts.dryRun) {
      await mkdir(dirname(p.mcpFile), { recursive: true });
      const body =
        scope === 'user'
          ? { mcpServers: serializeMcp(ir.mcp_servers) }
          : { servers: serializeMcp(ir.mcp_servers) };
      await writeFile(p.mcpFile, `${JSON.stringify(body, null, 2)}\n`, 'utf8');
    }
    written.push(p.mcpFile);
  }

  if (ir.permissions) {
    warnings.push(
      'permissions: Copilot permissions live in VS Code settings; not emitted',
    );
  }
  if (ir.env) {
    warnings.push(
      'env: Copilot coding-agent env lives in .github/workflows/copilot-setup-steps.yml [CP13]; not emitted',
    );
  }

  return { written, skipped, warnings };
}

function serializeHooksCopilotShape(
  hooks: Hook[],
): Record<
  string,
  Array<{ type: 'command'; bash: string; timeoutSec?: number }>
> {
  const out: Record<
    string,
    Array<{ type: 'command'; bash: string; timeoutSec?: number }>
  > = {};
  for (const hook of hooks) {
    for (const event of hook.events) {
      const copilotEvent = canonicalToCopilot[event];
      if (!copilotEvent) continue;
      const entry: { type: 'command'; bash: string; timeoutSec?: number } = {
        type: 'command',
        bash: hook.command,
      };
      if (hook.timeout !== undefined) entry.timeoutSec = hook.timeout;
      out[copilotEvent] ??= [];
      out[copilotEvent].push(entry);
    }
  }
  return out;
}

function serializeMcp(servers: McpServer[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const s of servers) {
    if (s.transport === 'stdio') {
      const entry: Record<string, unknown> = { command: s.command };
      if (s.args) entry.args = s.args;
      if (s.env) entry.env = s.env;
      out[s.name] = entry;
    } else {
      const entry: Record<string, unknown> = { url: s.url, type: s.transport };
      if (s.headers) entry.headers = s.headers;
      out[s.name] = entry;
    }
  }
  return out;
}
