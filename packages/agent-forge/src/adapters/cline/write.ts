import { chmod, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  type Hook,
  type IR,
  type Rule,
  type Scope,
  type WriteOpts,
  type WriteReport,
  serializeFrontmatter,
  serializeSkill,
} from '../../core/index.js';
import { CLINE_HOOK_ID_MARKER, canonicalToCline } from './events.js';
import { paths } from './paths.js';

/** A rule with glob-scoped activation compiles to `.clinerules/<id>.md`
 * [CL1][S22]; everything else concatenates into the shared AGENTS.md-class
 * root (R6). */
function isGlobRule(r: Rule): boolean {
  return r.activation === 'glob' || Boolean(r.globs?.length);
}

/** `.clinerules/<id>.md` (project glob rules) and every global-scope rule
 * file (`~/Documents/Cline/Rules/<id>.md`) share ONE dialect: plain body,
 * `paths:` frontmatter carrying `globs` when present [CL1] — Cline's own key
 * is `paths`, never the IR's `globs`. */
function serializeClineRuleFile(rule: Rule): string {
  const fm: Record<string, unknown> = {};
  if (rule.globs !== undefined) fm.paths = rule.globs;
  return serializeFrontmatter(fm, rule.body);
}

/** One executable script per native event, `# agent-forge:<id>` + command
 * pairs so multiple IR hooks sharing an event — and a reimport recovering
 * each `id` — both survive [CL2][CL3]. No matcher/timeout fields: Cline's
 * hook contract has neither. */
function serializeHookScript(hooks: readonly Hook[]): string {
  const lines = ['#!/bin/sh'];
  for (const hook of hooks) {
    lines.push(`${CLINE_HOOK_ID_MARKER}${hook.id ?? ''}`, hook.command);
  }
  return `${lines.join('\n')}\n`;
}

export async function writeCline(
  ir: IR,
  scope: Scope,
  cwd: string,
  opts: WriteOpts = {},
): Promise<WriteReport> {
  const p = paths(scope, cwd);
  const written: string[] = [];
  const skipped: { path: string; reason: string }[] = [];
  const warnings: string[] = [];

  // Rules.
  if (ir.rules?.length) {
    if (scope === 'user') {
      // Global rules: ~/Documents/Cline/Rules, one file per rule — never
      // ~/.cline/rules [CL1]. No AGENTS.md-equivalent is documented at this
      // scope, so plain and glob rules share the one directory.
      if (!opts.dryRun) await mkdir(p.rulesDir, { recursive: true });
      for (const rule of ir.rules) {
        const path = join(p.rulesDir, `${rule.id}.md`);
        if (!opts.dryRun) {
          await writeFile(path, serializeClineRuleFile(rule), 'utf8');
        }
        written.push(path);
      }
    } else {
      const globRules = ir.rules.filter(isGlobRule);
      const plainRules = ir.rules.filter((r) => !isGlobRule(r));

      if (plainRules.length) {
        const body = plainRules.map((r) => r.body).join('\n\n');
        if (!opts.dryRun) {
          await mkdir(dirname(p.rulesFile), { recursive: true });
          await writeFile(p.rulesFile, `${body}\n`, 'utf8');
        }
        written.push(p.rulesFile);
      }

      if (globRules.length) {
        if (!opts.dryRun) await mkdir(p.rulesDir, { recursive: true });
        for (const rule of globRules) {
          const path = join(p.rulesDir, `${rule.id}.md`);
          if (!opts.dryRun) {
            await writeFile(path, serializeClineRuleFile(rule), 'utf8');
          }
          written.push(path);
        }
      }
    }
  }

  // Skills — native SKILL.md discovery [CL5].
  if (ir.skills?.length) {
    for (const skill of ir.skills) {
      const skillFile = join(p.skillsDir, skill.name, 'SKILL.md');
      if (!opts.dryRun) {
        await mkdir(dirname(skillFile), { recursive: true });
        await writeFile(skillFile, serializeSkill(skill), 'utf8');
      }
      written.push(skillFile);
    }
  }

  // Commands → workflows `.clinerules/workflows/*.md` [CL4]. Plain body
  // only — the dialect carries no frontmatter, so description/argument_hint/
  // model/allowed_tools are dropped (capability declared 'partial').
  if (ir.commands?.length) {
    if (!opts.dryRun) await mkdir(p.workflowsDir, { recursive: true });
    const dropped = new Set<string>();
    for (const cmd of ir.commands) {
      const path = join(p.workflowsDir, `${cmd.name}.md`);
      if (!opts.dryRun) await writeFile(path, `${cmd.body}\n`, 'utf8');
      written.push(path);
      for (const f of [
        'description',
        'argument_hint',
        'model',
        'allowed_tools',
      ] as const) {
        if (cmd[f] !== undefined) dropped.add(f);
      }
    }
    if (dropped.size) {
      warnings.push(
        `commands: .clinerules/workflows/*.md carries no frontmatter (plain body only) — dropping ${[...dropped].join(', ')} [CL4]`,
      );
    }
  }

  // Agents — native subagents are a read-only tool, not file-config [CL7].
  if (ir.agents?.length) {
    warnings.push(
      `agents: Cline's native subagents are a tool, not file-config (${ir.agents.length} skipped) [CL7]`,
    );
    for (const a of ir.agents) {
      skipped.push({ path: `agents/${a.name}`, reason: 'unsupported' });
    }
  }

  // Hooks — per-event executable scripts in `.clinerules/hooks/` (project) /
  // `~/Documents/Cline/Rules/Hooks/` (user) [CL2][CL3]. No matcher concept,
  // no documented timeout field — both are surfaced, never silently applied.
  if (ir.hooks?.length) {
    const byNativeEvent = new Map<string, Hook[]>();
    for (const hook of ir.hooks) {
      const compatibleEvents = hook.events.filter((e) => canonicalToCline[e]);
      if (compatibleEvents.length === 0) {
        warnings.push(
          `hook '${hook.id ?? '?'}': no Cline equivalent for events ${hook.events.join(',')}`,
        );
        skipped.push({
          path: `hooks/${hook.id ?? '?'}.yaml`,
          reason: 'unsupported',
        });
        continue;
      }
      if (hook.matcher) {
        warnings.push(
          `hook '${hook.id ?? '?'}': Cline hooks have no matcher concept — matcher-unsupported, applies to every invocation of its event(s) [CL2]`,
        );
      }
      if (hook.timeout !== undefined) {
        warnings.push(
          `hook '${hook.id ?? '?'}': Cline hook scripts have no documented timeout field — dropped [CL2]`,
        );
      }
      for (const e of compatibleEvents) {
        const native = canonicalToCline[e];
        if (!native) continue;
        const list = byNativeEvent.get(native) ?? [];
        list.push(hook);
        byNativeEvent.set(native, list);
      }
    }

    if (byNativeEvent.size > 0) {
      if (!opts.dryRun) await mkdir(p.hooksDir, { recursive: true });
      for (const [native, hooks] of byNativeEvent) {
        const scriptPath = join(p.hooksDir, native);
        if (!opts.dryRun) {
          await writeFile(scriptPath, serializeHookScript(hooks), 'utf8');
          await chmod(scriptPath, 0o755);
        }
        written.push(scriptPath);
      }
    }
  }

  // MCP.
  if (ir.mcp_servers?.length) {
    if (scope === 'user') {
      // Real only for the CLI at this scope [CL6].
      const out: Record<string, unknown> = {};
      for (const s of ir.mcp_servers) {
        if (s.transport === 'stdio') {
          const entry: Record<string, unknown> = { command: s.command };
          if (s.args) entry.args = s.args;
          if (s.env) entry.env = s.env;
          out[s.name] = entry;
        } else {
          // `type` present ⇒ streamable HTTP; ABSENT ⇒ legacy SSE — never
          // fabricate a `type` for an sse-transport server [CL6].
          const entry: Record<string, unknown> = { url: s.url };
          if (s.transport === 'http') entry.type = 'streamableHttp';
          if (s.headers) entry.headers = s.headers;
          out[s.name] = entry;
        }
      }
      if (!opts.dryRun) {
        await mkdir(dirname(p.mcpFile), { recursive: true });
        await writeFile(
          p.mcpFile,
          `${JSON.stringify({ mcpServers: out }, null, 2)}\n`,
          'utf8',
        );
      }
      written.push(p.mcpFile);
    } else {
      // No documented project-scope surface: the extension reads VS Code
      // globalStorage `cline_mcp_settings.json`, not any `.cline/mcp.json`
      // in the repo — never fabricate the file [CL6].
      warnings.push(
        `mcp: no documented project-scope MCP surface — the extension reads VS Code globalStorage (cline_mcp_settings.json), not .cline/mcp.json; the CLI's user-scope override is the only documented file (${ir.mcp_servers.length} server(s) skipped) [CL6]`,
      );
      for (const s of ir.mcp_servers) {
        skipped.push({ path: `mcp/${s.name}`, reason: 'unsupported' });
      }
    }
  }

  // Permissions / env — no documented config-file surface [CL2][CL1].
  if (ir.permissions) {
    warnings.push(
      'permissions: Cline has no permission config file — hook decisions/UI toggles only [CL2]; not emitted',
    );
    skipped.push({ path: 'permissions', reason: 'unsupported' });
  }
  if (ir.env && Object.keys(ir.env).length) {
    warnings.push('env: Cline documents no env surface [CL1]; not emitted');
    skipped.push({ path: 'env', reason: 'unsupported' });
  }

  return { written, skipped, warnings };
}
