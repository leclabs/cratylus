import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { dump } from 'js-yaml';
import {
  type Agent,
  type Hook,
  type IR,
  type McpServer,
  type Permissions,
  type Scope,
  type WriteOpts,
  type WriteReport,
  mergeJsonKeys,
  serializeCommand,
  serializeFrontmatter,
  serializeSkill,
} from '../../core/index.js';
import { canonicalToOpencode } from './events.js';
import { paths } from './paths.js';

/**
 * Plugin emitter for hooks: opencode has no native hook surface — delivery is
 * a generated plugin shim (`.opencode/plugins/`) + its YAML manifest, i.e.
 * capability `plugin` [OC5]. Registered as `pluginEmitters.hooks`; the engine
 * routes IR hooks here at compile time.
 */
export async function writeOpencodeHooks(
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
    const unsupported = hook.events.filter((e) => !canonicalToOpencode[e]);
    if (unsupported.length === hook.events.length) {
      warnings.push(
        `hook '${hook.id ?? '?'}': no opencode equivalent for events ${unsupported.join(',')}`,
      );
      skipped.push({
        path: `hooks/${hook.id ?? '?'}.yaml`,
        reason: `no opencode mapping for events: ${unsupported.join(',')}`,
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

type OpencodeMcpEntry =
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

function mcpEntry(s: McpServer): OpencodeMcpEntry {
  if (s.transport === 'stdio') {
    const head = Array.isArray(s.command) ? s.command : [s.command];
    const command = [...head, ...(s.args ?? [])] as [string, ...string[]];
    const entry: OpencodeMcpEntry = { type: 'local', command };
    if (s.env) entry.environment = s.env;
    if (s.disabled) entry.enabled = false;
    return entry;
  }
  // opencode's "remote" type carries no sse/http distinction [OC7].
  const entry: OpencodeMcpEntry = { type: 'remote', url: s.url };
  if (s.headers) entry.headers = s.headers;
  if (s.disabled) entry.enabled = false;
  return entry;
}

type OpencodePermissionValue =
  | 'allow'
  | 'ask'
  | 'deny'
  | Record<string, 'allow' | 'ask' | 'deny'>;

/** Parse a `Tool(arg)` / bare `Tool` IR permission pattern. */
function splitPattern(pattern: string): { tool: string; arg?: string } {
  const m = /^([A-Za-z_][\w]*)\((.*)\)$/.exec(pattern);
  const tool = m?.[1];
  if (!m || tool === undefined) return { tool: pattern.toLowerCase() };
  return { tool: tool.toLowerCase(), arg: m[2] ?? '' };
}

/** IR permissions → opencode's `permission` DSL [OC8]. Best-effort: a bare
 * `Tool(*)`/`Tool` pattern becomes a flat action; a scoped `Tool(glob)`
 * nests under the tool key. Applied allow → ask → deny so a same-key
 * collision resolves to the more restrictive action. */
function buildPermission(
  permissions: Permissions,
): Record<string, OpencodePermissionValue> {
  const out: Record<string, OpencodePermissionValue> = {};
  const apply = (
    patterns: string[] | undefined,
    action: 'allow' | 'ask' | 'deny',
  ) => {
    for (const pattern of patterns ?? []) {
      const { tool, arg } = splitPattern(pattern);
      if (!arg || arg === '*') {
        out[tool] = action;
        continue;
      }
      const existing = out[tool];
      const nested = existing && typeof existing === 'object' ? existing : {};
      out[tool] = { ...nested, [arg]: action };
    }
  };
  apply(permissions.allow, 'allow');
  apply(permissions.ask, 'ask');
  apply(permissions.deny, 'deny');
  return out;
}

/** `.opencode/agents/*.md` documented frontmatter is description/mode/model/
 * temperature/tools/permission [OC2] — `name` comes from the filename. An
 * unset `mode` defaults to `subagent` (opencode requires the field; IR
 * agents are subagent definitions by contract) and is disclosed via a
 * warning at the call site, never silently fabricated. */
function serializeOpencodeAgent(agent: Agent): string {
  const fm: Record<string, unknown> = {};
  if (agent.description) fm.description = agent.description;
  fm.mode = agent.mode ?? 'subagent';
  if (agent.model) fm.model = agent.model;
  if (agent.temperature !== undefined) fm.temperature = agent.temperature;
  if (agent.tools) fm.tools = agent.tools;
  return serializeFrontmatter(fm, agent.body);
}

/** IR agent fields with no opencode frontmatter equivalent [OC2] — dropped
 * with a named warning, same discipline as codex's `color` / cursor's
 * broader drop set, never fabricated into the file. */
const AGENT_UNSUPPORTED_FIELDS = [
  'color',
  'permission_mode',
  'max_turns',
  'memory',
  'effort',
] as const;

export async function writeOpencode(
  ir: IR,
  scope: Scope,
  cwd: string,
  opts: WriteOpts = {},
): Promise<WriteReport> {
  const p = paths(scope, cwd);
  const written: string[] = [];
  const skipped: { path: string; reason: string }[] = [];
  const warnings: string[] = [];

  // Rules → AGENTS.md [OC3]
  if (ir.rules?.length) {
    const body = ir.rules.map((r) => r.body).join('\n\n');
    if (!opts.dryRun) {
      await mkdir(dirname(p.rulesFile), { recursive: true });
      await writeFile(p.rulesFile, `${body}\n`, 'utf8');
    }
    written.push(p.rulesFile);
  }

  // Hooks are delivered via opencode's plugin system (capability `plugin`);
  // when compiled through the engine they route to `writeOpencodeHooks`
  // directly and never reach this function. Direct `write` calls (tests,
  // embedders) still deliver them here for backward compatibility.
  if (ir.hooks?.length) {
    const hooksReport = await writeOpencodeHooks(ir, scope, cwd, opts);
    written.push(...hooksReport.written);
    skipped.push(...hooksReport.skipped);
    warnings.push(...hooksReport.warnings);
  }

  // Skills (one directory per skill); allowed_tools field is dropped — opencode
  // does not honor it.
  if (ir.skills?.length) {
    for (const skill of ir.skills) {
      if (skill.allowed_tools && skill.allowed_tools.length > 0) {
        warnings.push(
          `skill '${skill.name}': opencode ignores 'allowed_tools'; field will be present in SKILL.md but unused`,
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

  // Agents — .opencode/agents/*.md, `mode` field required [OC2].
  if (ir.agents?.length) {
    const dropped = new Set<string>();
    for (const agent of ir.agents) {
      if (!agent.mode) {
        warnings.push(
          `agents: '${agent.name}' has no IR mode; defaulting to 'subagent' for opencode's required frontmatter field [OC2]`,
        );
      }
      const agentFile = join(p.agentsDir, `${agent.name}.md`);
      if (!opts.dryRun) {
        await mkdir(p.agentsDir, { recursive: true });
        await writeFile(agentFile, serializeOpencodeAgent(agent), 'utf8');
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
        `agents: opencode's documented frontmatter is description/mode/model/temperature/tools/permission — dropping ${[...dropped].join(', ')} [OC2]`,
      );
    }
  }

  // Commands — .opencode/commands/*.md [OC4].
  if (ir.commands?.length) {
    for (const command of ir.commands) {
      const commandFile = join(p.commandsDir, `${command.name}.md`);
      if (!opts.dryRun) {
        await mkdir(p.commandsDir, { recursive: true });
        await writeFile(commandFile, serializeCommand(command), 'utf8');
      }
      written.push(commandFile);
    }
  }

  // MCP + permissions: keys of the ONE documented config home, opencode.json
  // — foreign keys survive (key-scoped merge) [OC7][OC8].
  const owned: Record<string, unknown> = {};

  if (ir.mcp_servers?.length) {
    const mcp: Record<string, OpencodeMcpEntry> = {};
    for (const s of ir.mcp_servers) mcp[s.name] = mcpEntry(s);
    owned.mcp = mcp;
  }

  if (ir.permissions) {
    owned.permission = buildPermission(ir.permissions);
  }

  if (Object.keys(owned).length) {
    if (!opts.dryRun) {
      const existing = existsSync(p.configFile)
        ? await readFile(p.configFile, 'utf8')
        : undefined;
      await mkdir(dirname(p.configFile), { recursive: true });
      await writeFile(p.configFile, mergeJsonKeys(existing, owned), 'utf8');
    }
    written.push(p.configFile);
  }

  // Env — no documented standalone surface; {env:VAR} substitution inside
  // other keys only [OC1]. Never fabricate an env.json.
  if (ir.env && Object.keys(ir.env).length > 0) {
    warnings.push(
      'env: opencode has no documented env config surface ({env:VAR} substitution only) — env skipped [OC1]',
    );
    skipped.push({
      path: 'env',
      reason: 'no-native-surface: opencode has no env config key [OC1]',
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
      const oc = canonicalToOpencode[e];
      if (!oc) continue;
      const list = byEvent.get(oc) ?? [];
      list.push(hook);
      byEvent.set(oc, list);
    }
  }

  for (const [ocEvent, list] of byEvent) {
    lines.push(`    '${ocEvent}': async (input) => {`);
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
