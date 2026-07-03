import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { dump } from 'js-yaml';
import {
  type Agent,
  type Hook,
  type IR,
  type McpServer,
  type Rule,
  type Scope,
  type WriteOpts,
  type WriteReport,
  mergeJsonKeys,
  serializeFrontmatter,
  serializeSkill,
} from '../../core/index.js';
import { canonicalToKilo } from './events.js';
import { paths } from './paths.js';

/**
 * Plugin emitter for hooks: Kilo has no native hook config surface — delivery
 * is a generated plugin artifact against `@kilocode/plugin` lifecycle hooks
 * [KL6], mirroring opencode's `writeOpencodeHooks` shim pattern (same runtime
 * lineage — RETURN §0). Registered as `pluginEmitters.hooks`.
 */
export async function writeKiloHooks(
  ir: IR,
  scope: Scope,
  cwd: string,
  opts: WriteOpts = {},
): Promise<WriteReport> {
  const p = paths(scope, cwd);
  const written: string[] = [];
  const skipped: { path: string; reason: string }[] = [];
  const warnings: string[] = [];

  const compatible: Hook[] = [];
  for (const hook of ir.hooks ?? []) {
    const unsupported = hook.events.filter((e) => !canonicalToKilo[e]);
    if (unsupported.length === hook.events.length) {
      warnings.push(
        `hook '${hook.id ?? '?'}': no kilo plugin-event equivalent for events ${unsupported.join(',')}`,
      );
      skipped.push({
        path: `hooks/${hook.id ?? '?'}.yaml`,
        reason: `no kilo mapping for events: ${unsupported.join(',')}`,
      });
      continue;
    }
    if (unsupported.length > 0) {
      warnings.push(
        `hook '${hook.id ?? '?'}': partial mapping; events ${unsupported.join(',')} dropped`,
      );
    }
    compatible.push(hook);
  }

  if (compatible.length > 0) {
    if (!opts.dryRun) {
      await mkdir(p.pluginsDir, { recursive: true });
      await writeFile(
        p.hooksManifestFile,
        dump({ hooks: compatible }, { lineWidth: 100, noRefs: true }),
        'utf8',
      );
      await writeFile(p.hooksShimFile, generateShim(compatible), 'utf8');
    }
    written.push(p.hooksManifestFile, p.hooksShimFile);
  }

  return { written, skipped, warnings };
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

function mcpEntry(s: McpServer): KiloMcpEntry {
  if (s.transport === 'stdio') {
    const head = Array.isArray(s.command) ? s.command : [s.command];
    const command = [...head, ...(s.args ?? [])] as [string, ...string[]];
    const entry: KiloMcpEntry = { type: 'local', command };
    if (s.env) entry.environment = s.env;
    if (s.disabled) entry.enabled = false;
    return entry;
  }
  // Kilo's "remote" type carries no sse/http distinction, same as opencode's
  // own analogous shape [KL5].
  const entry: KiloMcpEntry = { type: 'remote', url: s.url };
  if (s.headers) entry.headers = s.headers;
  if (s.disabled) entry.enabled = false;
  return entry;
}

/** `.kilo/rules/<id>.md` — plain body only. The docs name an `instructions`
 * glob-activation mechanism alongside the rules dir [KL2][KL4], but its
 * frontmatter shape is unconfirmed in the ledger; a glob-scoped rule is
 * warned + written body-only rather than fabricating a key. */
function serializeKiloRule(rule: Rule): string {
  return `${rule.body}\n`;
}

/** `.kilo/commands/<name>.md` — plain body only. The one confirmed dialect
 * key is `subtask:` [KL7], which has no IR analog; IR command frontmatter
 * (description/argument_hint/model/allowed_tools) has no confirmed Kilo
 * equivalent, so it is dropped rather than fabricated (cline precedent). */
function serializeKiloCommand(body: string): string {
  return `${body}\n`;
}

/** `.kilo/agents/*.md` documented frontmatter is description/mode/permission/
 * model/color/temperature [KL1] — `name` comes from the filename, `permission`
 * (ordered glob rules) has no IR analog and is never fabricated. An unset
 * `mode` defaults to `subagent` (Kilo requires the field; IR agents are
 * subagent definitions by contract), disclosed via a warning, same discipline
 * as opencode's `serializeOpencodeAgent`. */
function serializeKiloAgent(agent: Agent): string {
  const fm: Record<string, unknown> = {};
  if (agent.description) fm.description = agent.description;
  fm.mode = agent.mode ?? 'subagent';
  if (agent.model) fm.model = agent.model;
  if (agent.color) fm.color = agent.color;
  if (agent.temperature !== undefined) fm.temperature = agent.temperature;
  return serializeFrontmatter(fm, agent.body);
}

/** IR agent fields with no Kilo frontmatter equivalent [KL1] — dropped with a
 * named warning, never fabricated (mirrors opencode's AGENT_UNSUPPORTED_FIELDS). */
const AGENT_UNSUPPORTED_FIELDS = [
  'tools',
  'permission_mode',
  'max_turns',
  'memory',
  'effort',
] as const;

export async function writeKilo(
  ir: IR,
  scope: Scope,
  cwd: string,
  opts: WriteOpts = {},
): Promise<WriteReport> {
  const p = paths(scope, cwd);
  const written: string[] = [];
  const skipped: { path: string; reason: string }[] = [];
  const warnings: string[] = [];

  // Rules — one file per rule under `.kilo/rules/` [KL2][KL4]. Never the
  // legacy `.kilocode/rules/` tree, which is read-only foreign territory.
  if (ir.rules?.length) {
    if (!opts.dryRun) await mkdir(p.rulesDir, { recursive: true });
    const droppedGlobs = ir.rules.some((r) => r.globs?.length || r.activation);
    for (const rule of ir.rules) {
      const path = join(p.rulesDir, `${rule.id}.md`);
      if (!opts.dryRun) {
        await writeFile(path, serializeKiloRule(rule), 'utf8');
      }
      written.push(path);
    }
    if (droppedGlobs) {
      warnings.push(
        "rules: kilo's per-file rule frontmatter is unconfirmed in the ledger — glob/activation metadata dropped, body written plain [KL2][KL4]",
      );
    }
  }

  // Skills — `.kilo/skills/<name>/SKILL.md` [KL3]; allowed_tools honoring is
  // unconfirmed, same judgment call as opencode/cline.
  if (ir.skills?.length) {
    for (const skill of ir.skills) {
      if (skill.allowed_tools && skill.allowed_tools.length > 0) {
        warnings.push(
          `skill '${skill.name}': kilo's allowed_tools support is unconfirmed; field will be present in SKILL.md but may be unused`,
        );
      }
      const skillDir = join(p.skillsDir, skill.name);
      const skillFile = join(skillDir, 'SKILL.md');
      if (!opts.dryRun) {
        await mkdir(skillDir, { recursive: true });
        await writeFile(skillFile, serializeSkill(skill), 'utf8');
      }
      written.push(skillFile);
    }
  }

  // Agents — `.kilo/agents/*.md`, `mode` frontmatter required [KL1].
  if (ir.agents?.length) {
    const dropped = new Set<string>();
    for (const agent of ir.agents) {
      if (!agent.mode) {
        warnings.push(
          `agents: '${agent.name}' has no IR mode; defaulting to 'subagent' for kilo's required frontmatter field [KL1]`,
        );
      }
      const agentFile = join(p.agentsDir, `${agent.name}.md`);
      if (!opts.dryRun) {
        await mkdir(p.agentsDir, { recursive: true });
        await writeFile(agentFile, serializeKiloAgent(agent), 'utf8');
      }
      written.push(agentFile);
      for (const f of AGENT_UNSUPPORTED_FIELDS) {
        if ((agent as unknown as Record<string, unknown>)[f] !== undefined) {
          dropped.add(f);
        }
      }
    }
    if (dropped.size) {
      warnings.push(
        `agents: kilo's documented frontmatter is description/mode/permission/model/color/temperature — dropping ${[...dropped].join(', ')} [KL1]`,
      );
    }
  }

  // Commands — `.kilo/commands/*.md` [KL7]; plain body only.
  if (ir.commands?.length) {
    const dropped = new Set<string>();
    for (const command of ir.commands) {
      const commandFile = join(p.commandsDir, `${command.name}.md`);
      if (!opts.dryRun) {
        await mkdir(p.commandsDir, { recursive: true });
        await writeFile(
          commandFile,
          serializeKiloCommand(command.body),
          'utf8',
        );
      }
      written.push(commandFile);
      for (const f of [
        'description',
        'argument_hint',
        'model',
        'allowed_tools',
      ] as const) {
        if (command[f] !== undefined) dropped.add(f);
      }
    }
    if (dropped.size) {
      warnings.push(
        `commands: .kilo/commands/*.md's one confirmed frontmatter key is 'subtask:' (no IR analog) — dropping ${[...dropped].join(', ')} [KL7]`,
      );
    }
  }

  // Hooks are delivered via Kilo's plugin system (capability `plugin`); when
  // compiled through the engine they route to `writeKiloHooks` directly and
  // never reach this function. Direct `write` calls still deliver them here.
  if (ir.hooks?.length) {
    const hooksReport = await writeKiloHooks(ir, scope, cwd, opts);
    written.push(...hooksReport.written);
    skipped.push(...hooksReport.skipped);
    warnings.push(...hooksReport.warnings);
  }

  // MCP — the ONE config home, `kilo.jsonc` under `.kilo/` [KL5]. Foreign
  // keys survive (key-scoped merge).
  if (ir.mcp_servers?.length) {
    const mcp: Record<string, KiloMcpEntry> = {};
    for (const s of ir.mcp_servers) mcp[s.name] = mcpEntry(s);
    if (!opts.dryRun) {
      let existing: string | undefined;
      if (existsSync(p.configFile)) {
        existing = await readFile(p.configFile, 'utf8');
      } else if (p.rootConfigFile && existsSync(p.rootConfigFile)) {
        existing = await readFile(p.rootConfigFile, 'utf8');
      }
      await mkdir(p.kiloDir, { recursive: true });
      await writeFile(p.configFile, mergeJsonKeys(existing, { mcp }), 'utf8');
    }
    written.push(p.configFile);
  }

  // Permissions/env — no documented standalone config surface [KL1]:
  // `permission` is a per-agent frontmatter field (ordered glob rules), not a
  // project-wide list the IR `Permissions` shape models; never fabricated.
  if (ir.permissions) {
    warnings.push(
      "permissions: kilo's only documented permission surface is a per-agent frontmatter field (ordered glob rules), not a project-wide config — not emitted [KL1]",
    );
    skipped.push({ path: 'permissions', reason: 'unsupported' });
  }
  if (ir.env && Object.keys(ir.env).length > 0) {
    warnings.push(
      'env: kilo has no documented env config surface — env skipped [KL1]',
    );
    skipped.push({
      path: 'env',
      reason: 'no-native-surface: kilo has no env config key [KL1]',
    });
  }

  return { written, skipped, warnings };
}

function generateShim(hooks: Hook[]): string {
  const lines = [
    '// AUTO-GENERATED by agent-forge; do not edit by hand.',
    '// Source of truth: ./agent-forge-hooks.yaml',
    "import { spawnSync } from 'node:child_process';",
    '',
    'function runHook(command, payload) {',
    "  spawnSync('sh', ['-c', command], {",
    '    input: JSON.stringify(payload),',
    "    stdio: ['pipe', 'inherit', 'inherit'],",
    '  });',
    '}',
    '',
    'export const AgentForgeHooks = async () => {',
    '  return {',
  ];

  const byEvent = new Map<string, Hook[]>();
  for (const hook of hooks) {
    for (const e of hook.events) {
      const native = canonicalToKilo[e];
      if (!native) continue;
      const list = byEvent.get(native) ?? [];
      list.push(hook);
      byEvent.set(native, list);
    }
  }

  for (const [nativeEvent, list] of byEvent) {
    lines.push(`    '${nativeEvent}': async (input) => {`);
    for (const hook of list) {
      const matcherCheck = hook.matcher
        ? `if (!matcherMatches(${JSON.stringify(hook.matcher)}, input)) return;`
        : '';
      const meta = JSON.stringify({
        id: hook.id,
        canonicalEvent: hook.events[0],
        matcher: hook.matcher,
      });
      if (matcherCheck) lines.push(`      ${matcherCheck}`);
      lines.push(
        `      runHook(${JSON.stringify(hook.command)}, { ...input, _agentForge: ${meta} });`,
      );
    }
    lines.push('    },');
  }

  lines.push('  };');
  lines.push('};');
  lines.push('');
  lines.push('function matcherMatches(pattern, input) {');
  lines.push('  const target = input?.tool?.name ?? input?.path ?? "";');
  lines.push(
    '  return new RegExp(pattern.replace(/\\*/g, ".*")).test(target);',
  );
  lines.push('}');
  return lines.join('\n');
}
