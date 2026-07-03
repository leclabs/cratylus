import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  type Agent,
  type Hook,
  type IR,
  type McpServer,
  type Rule,
  type Scope,
  type WriteOpts,
  type WriteReport,
  serializeFrontmatter,
  serializeSkill,
} from '../../core/index.js';
import { canonicalToCursor } from './events.js';
import { paths } from './paths.js';

/** A rule that cannot be losslessly folded into the concatenated AGENTS.md
 * body: an explicit non-concat directive, or any activation metadata that
 * only `.mdc` frontmatter can carry [CU1]. */
function needsMdc(rule: Rule): boolean {
  return (
    rule.concat === false ||
    rule.globs !== undefined ||
    rule.alwaysApply !== undefined ||
    rule.activation !== undefined ||
    rule.description !== undefined
  );
}

/** `.cursor/rules/<id>.mdc` frontmatter is exactly description/globs/
 * alwaysApply [CU1] — never the IR's internal routing fields (concat/order/
 * targets/excludes). */
function serializeMdcRule(rule: Rule): string {
  const fm: Record<string, unknown> = {};
  if (rule.description !== undefined) fm.description = rule.description;
  if (rule.globs !== undefined) fm.globs = rule.globs;
  if (rule.alwaysApply !== undefined) fm.alwaysApply = rule.alwaysApply;
  return serializeFrontmatter(fm, rule.body);
}

/** `.cursor/agents/*.md` documented frontmatter is name/description/model
 * (+readonly/is_background, unmodeled in the IR) [CU3] — `name` comes from
 * the filename, matching the convention already used by gemini/opencode. */
function serializeCursorAgent(agent: Agent): string {
  const fm: Record<string, unknown> = {};
  if (agent.description) fm.description = agent.description;
  if (agent.model) fm.model = agent.model;
  return serializeFrontmatter(fm, agent.body);
}

const AGENT_UNSUPPORTED_FIELDS = [
  'tools',
  'color',
  'permission_mode',
  'max_turns',
  'temperature',
  'mode',
  'memory',
  'effort',
] as const;

const COMMAND_UNSUPPORTED_FIELDS = [
  'description',
  'argument_hint',
  'model',
  'allowed_tools',
] as const;

export async function writeCursor(
  ir: IR,
  scope: Scope,
  cwd: string,
  opts: WriteOpts = {},
): Promise<WriteReport> {
  const p = paths(scope, cwd);
  const written: string[] = [];
  const skipped: { path: string; reason: string }[] = [];
  const warnings: string[] = [];

  if (ir.rules?.length) {
    const individual = ir.rules.filter(needsMdc);
    const concatenated = ir.rules.filter((r) => !needsMdc(r));

    if (individual.length > 0) {
      if (!opts.dryRun) await mkdir(p.rulesDir, { recursive: true });
      for (const rule of individual) {
        const path = join(p.rulesDir, `${rule.id}.mdc`);
        if (!opts.dryRun) {
          await writeFile(path, serializeMdcRule(rule), 'utf8');
        }
        written.push(path);
      }
    }

    if (concatenated.length > 0) {
      if (scope === 'user') {
        // No documented file surface for User Rules (settings UI, plain
        // text) [CU1] — a user-scope plain rule has nowhere honest to land.
        warnings.push(
          'rules: no documented user-scope rules file (Cursor User Rules live in settings UI) — skipped',
        );
        for (const r of concatenated)
          skipped.push({ path: `rules/${r.id}`, reason: 'unsupported' });
      } else {
        const body = concatenated.map((r) => r.body).join('\n\n');
        if (!opts.dryRun) {
          await mkdir(dirname(p.rulesFile), { recursive: true });
          await writeFile(p.rulesFile, `${body}\n`, 'utf8');
        }
        written.push(p.rulesFile);
      }
    }
  }

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

  if (ir.agents?.length) {
    if (!opts.dryRun) await mkdir(p.agentsDir, { recursive: true });
    const dropped = new Set<string>();
    for (const agent of ir.agents) {
      const path = join(p.agentsDir, `${agent.name}.md`);
      if (!opts.dryRun) {
        await writeFile(path, serializeCursorAgent(agent), 'utf8');
      }
      written.push(path);
      for (const f of AGENT_UNSUPPORTED_FIELDS) {
        if ((agent as unknown as Record<string, unknown>)[f] !== undefined) {
          dropped.add(f);
        }
      }
    }
    if (dropped.size) {
      warnings.push(
        `agents: cursor's documented frontmatter is name/description/model (+readonly/is_background, unmodeled) — dropping ${[...dropped].join(', ')} [CU3]`,
      );
    }
  }

  if (ir.commands?.length) {
    if (!opts.dryRun) await mkdir(p.commandsDir, { recursive: true });
    const dropped = new Set<string>();
    for (const cmd of ir.commands) {
      const path = join(p.commandsDir, `${cmd.name}.md`);
      if (!opts.dryRun) {
        await writeFile(path, `${cmd.body}\n`, 'utf8');
      }
      written.push(path);
      for (const f of COMMAND_UNSUPPORTED_FIELDS) {
        if ((cmd as unknown as Record<string, unknown>)[f] !== undefined) {
          dropped.add(f);
        }
      }
    }
    if (dropped.size) {
      warnings.push(
        `commands: .cursor/commands/*.md carries no frontmatter (plain body = prompt) — dropping ${[...dropped].join(', ')} [CU6]`,
      );
    }
  }

  if (ir.hooks?.length) {
    const compatible: Hook[] = ir.hooks.filter((h: Hook) =>
      h.events.some((e) => canonicalToCursor[e]),
    );
    const dropped: Hook[] = ir.hooks.filter(
      (h: Hook) => !h.events.some((e) => canonicalToCursor[e]),
    );
    for (const d of dropped) {
      warnings.push(
        `hook '${d.id ?? '?'}': no Cursor equivalent for events ${d.events.join(',')}`,
      );
      skipped.push({
        path: `hooks/${d.id ?? '?'}.yaml`,
        reason: 'unsupported',
      });
    }
    if (compatible.length > 0) {
      const obj: {
        version: 1;
        hooks: Record<
          string,
          Array<{
            matcher?: string;
            command: string;
            timeout?: number;
            id?: string;
          }>
        >;
      } = { version: 1, hooks: {} };
      for (const hook of compatible) {
        for (const e of hook.events) {
          const cursorEvent = canonicalToCursor[e];
          if (!cursorEvent) continue;
          const entry: {
            matcher?: string;
            command: string;
            timeout?: number;
            id?: string;
          } = { command: hook.command };
          if (hook.matcher) entry.matcher = hook.matcher;
          if (hook.timeout !== undefined) entry.timeout = hook.timeout;
          if (hook.id !== undefined) entry.id = hook.id; // stable across reimport
          obj.hooks[cursorEvent] ??= [];
          obj.hooks[cursorEvent].push(entry);
        }
      }
      if (!opts.dryRun) {
        await mkdir(dirname(p.hooksFile), { recursive: true });
        await writeFile(
          p.hooksFile,
          `${JSON.stringify(obj, null, 2)}\n`,
          'utf8',
        );
      }
      written.push(p.hooksFile);
    }
  }

  if (ir.mcp_servers?.length) {
    if (!opts.dryRun) {
      await mkdir(dirname(p.mcpFile), { recursive: true });
      await writeFile(
        p.mcpFile,
        `${JSON.stringify({ mcpServers: serializeMcp(ir.mcp_servers) }, null, 2)}\n`,
        'utf8',
      );
    }
    written.push(p.mcpFile);
  }

  if (ir.permissions) {
    warnings.push(
      'permissions: Cursor uses MCP-server-level allowlist; not directly emitted',
    );
  }
  if (ir.env) {
    warnings.push(
      'env: Cursor env lives in VS Code-style settings; not emitted',
    );
  }

  return { written, skipped, warnings };
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
      // Remote entry: exactly {url, headers?, auth?} — the adapter's prior
      // `type` key is undocumented for remote servers [CU5][S45].
      const entry: Record<string, unknown> = { url: s.url };
      if (s.headers) entry.headers = s.headers;
      if (s.auth) entry.auth = s.auth;
      out[s.name] = entry;
    }
  }
  return out;
}
