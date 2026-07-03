import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import {
  type Adapter,
  type AdapterCapabilities,
  type CanonicalEvent,
  type Command,
  type Hook,
  type IR,
  type McpServer,
  type Rule,
  type Scope,
  type Skill,
  type WriteOpts,
  type WriteReport,
  parseFrontmatter,
  parseSkill,
  serializeFrontmatter,
} from '../../core/index.js';

/**
 * Windsurf / Devin Desktop adapter. Ground truth:
 * harness-landscape-research.RETURN.md §2 "Windsurf / Devin Desktop"
 * ([WS1]–[WS8]). Canonical id `devin` (Windsurf became Devin Desktop
 * 2026-06-02 [WS7]); `windsurf` is accepted at construction only — roster
 * alias/status metadata is out of scope here (E10.S5).
 *
 * - rules:     project `.devin/rules/*.md` (preferred) / `.windsurf/rules/`
 *              (legacy, read-side); `trigger:` 4-mode frontmatter; 12,000
 *              chars/file; user `~/.codeium/windsurf/memories/global_rules.md`
 *              (6,000 chars) [WS1][WS7]
 * - workflows: `.windsurf/workflows/*.md` → `/name`, manual-only; user
 *              `~/.codeium/windsurf/global_workflows/` [WS4]
 * - skills:    `.windsurf/skills/<name>/SKILL.md`; user
 *              `~/.codeium/windsurf/skills/` [WS3]
 * - hooks:     `.windsurf/hooks.json` (ws) / `~/.codeium/windsurf/hooks.json`
 *              (user); `{"hooks":{"<event>":[{command,…}]}}`; 12 snake_case
 *              events; exit 2 blocks (pre only) [WS2]
 * - mcp:       `~/.codeium/windsurf/mcp_config.json` (user-global only);
 *              stdio `{command,args,env}`, remote `serverUrl`(+`headers`);
 *              100-tool cap [WS5]
 */

interface DevinPaths {
  rulesDir: string | null; // project per-rule dir; null at user scope
  legacyRulesDir: string | null; // .windsurf/rules read-side [WS1]
  globalRulesFile: string | null; // user single-file memories [WS1]
  workflowsDir: string;
  skillsDir: string;
  hooksFile: string;
  mcpFile: string; // user-global regardless of scope [WS5]
}

function paths(scope: Scope, cwd: string): DevinPaths {
  const base = join(homedir(), '.codeium', 'windsurf');
  if (scope === 'user') {
    return {
      rulesDir: null,
      legacyRulesDir: null,
      globalRulesFile: join(base, 'memories', 'global_rules.md'),
      workflowsDir: join(base, 'global_workflows'),
      skillsDir: join(base, 'skills'),
      hooksFile: join(base, 'hooks.json'),
      mcpFile: join(base, 'mcp_config.json'),
    };
  }
  return {
    rulesDir: join(cwd, '.devin', 'rules'),
    legacyRulesDir: join(cwd, '.windsurf', 'rules'),
    globalRulesFile: null,
    workflowsDir: join(cwd, '.windsurf', 'workflows'),
    skillsDir: join(cwd, '.windsurf', 'skills'),
    hooksFile: join(cwd, '.windsurf', 'hooks.json'),
    mcpFile: join(base, 'mcp_config.json'),
  };
}

/** Per-file char caps [WS1][WS4]. */
const RULE_FILE_CAP = 12_000;
const GLOBAL_RULES_CAP = 6_000;
const WORKFLOW_FILE_CAP = 12_000;

/** Canonical activation → Windsurf `trigger:` mode [WS1]. */
const ACTIVATION_TO_TRIGGER: Record<NonNullable<Rule['activation']>, string> = {
  always: 'always_on',
  auto: 'model_decision',
  glob: 'glob',
  manual: 'manual',
};

const TRIGGER_TO_ACTIVATION: Record<string, Rule['activation']> = {
  always_on: 'always',
  model_decision: 'auto',
  glob: 'glob',
  manual: 'manual',
};

/**
 * Canonical event → Windsurf native event. The 12-event snake_case dialect
 * [WS2]; the four natives with no canonical equivalent (post_read_code,
 * pre_write_code, post_cascade_response_with_transcript, post_setup_worktree)
 * are read-side-ignored. Injective over the supported set.
 */
export const canonicalToDevin: Partial<Record<CanonicalEvent, string>> = {
  'prompt.submit': 'pre_user_prompt',
  'turn.end': 'post_cascade_response',
  'file.read.pre': 'pre_read_code',
  'file.edit.post': 'post_write_code',
  'shell.exec.pre': 'pre_run_command',
  'shell.exec.post': 'post_run_command',
  'mcp.exec.pre': 'pre_mcp_tool_use',
  'mcp.exec.post': 'post_mcp_tool_use',
};

export const devinToCanonical: Record<string, CanonicalEvent> =
  Object.fromEntries(
    Object.entries(canonicalToDevin).map(([canonical, native]) => [
      native,
      canonical as CanonicalEvent,
    ]),
  );

const capabilities: AdapterCapabilities = {
  resources: {
    rules: 'partial', // trigger modes carried; char caps + enterprise dirs unmodeled [WS1]
    skills: 'partial', // .windsurf/skills only; shared std paths are engine surface [WS3]
    commands: 'partial', // workflows are manual-only /name; model/tools fields dropped [WS4]
    agents: 'none', // Devin Local subagents announcement-level; file config unverified [WS7]
    hooks: 'partial', // 8 of 28 canonical events reach the 12-event dialect [WS2]
    mcp: 'partial', // single user-global mcp_config.json; 100-tool cap unmodeled [WS5]
    permissions: 'none', // no native permission surface [WS5]
    env: 'none', // ${env:VAR} substitution inside mcp_config only [WS5]
  },
  hooks: {
    supported: Object.keys(canonicalToDevin) as CanonicalEvent[],
    matchers: 'none', // hook entries fire per event; no matcher field [WS2]
    payload: 'native', // JSON stdin, native shape; cannot modify inputs [WS2]
  },
  scopes: ['user', 'project'],
};

/** Native hook entry [WS2]. */
interface DevinHookEntry {
  command?: string;
  powershell?: string;
  show_output?: boolean;
  working_directory?: string;
}

interface DevinHooksFile {
  hooks?: Record<string, DevinHookEntry[]>;
}

/** Spec-form SKILL.md (Agent Skills frontmatter, dashed keys) [WS3]. */
function serializeDevinSkill(skill: Skill): string {
  const fm: Record<string, unknown> = {
    name: skill.name,
    description: skill.description,
  };
  if (skill.allowed_tools) fm['allowed-tools'] = skill.allowed_tools;
  if (skill.license !== undefined) fm.license = skill.license;
  if (skill.compatibility !== undefined) fm.compatibility = skill.compatibility;
  if (skill.metadata !== undefined) fm.metadata = skill.metadata;
  if (skill.disable_model_invocation !== undefined)
    fm['disable-model-invocation'] = skill.disable_model_invocation;
  return serializeFrontmatter(fm, skill.body);
}

/** Skill fields with no Windsurf/spec frontmatter home — dropped loudly. */
const LOSSY_SKILL_FIELDS = ['files', 'paths', 'user_invocable'] as const;

/** Command fields with no workflow frontmatter home — dropped loudly [WS4]. */
const LOSSY_COMMAND_FIELDS = [
  'argument_hint',
  'model',
  'allowed_tools',
] as const;

function serializeDevinRule(rule: Rule, body: string): string {
  const fm: Record<string, unknown> = {
    trigger: ACTIVATION_TO_TRIGGER[rule.activation ?? 'always'],
  };
  if (rule.description !== undefined) fm.description = rule.description;
  if (rule.globs !== undefined) fm.globs = rule.globs;
  return serializeFrontmatter(fm, body);
}

/**
 * Split a rule body so every emitted file (frontmatter + body) fits the
 * 12,000-char cap [WS1]. Returns 1 chunk when the whole file fits.
 */
function splitRuleBody(rule: Rule, cap: number): string[] {
  const whole = serializeDevinRule(rule, rule.body);
  if (whole.length <= cap) return [rule.body];
  const overhead = whole.length - rule.body.length;
  const room = Math.max(cap - overhead, 1);
  const chunks: string[] = [];
  for (let i = 0; i < rule.body.length; i += room) {
    chunks.push(rule.body.slice(i, i + room));
  }
  return chunks;
}

async function readJson<T>(file: string): Promise<T | null> {
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(await readFile(file, 'utf8')) as T;
  } catch {
    return null; // malformed — best-effort read only
  }
}

async function readImpl(scope: Scope, cwd: string): Promise<Partial<IR>> {
  const p = paths(scope, cwd);
  const ir: Partial<IR> = {};

  // Rules: preferred .devin/rules, legacy .windsurf/rules; user global file.
  const rules: Rule[] = [];
  if (scope === 'user') {
    if (p.globalRulesFile && existsSync(p.globalRulesFile)) {
      rules.push({
        id: 'global_rules',
        body: (await readFile(p.globalRulesFile, 'utf8')).trimEnd(),
      });
    }
  } else {
    const dir =
      p.rulesDir && existsSync(p.rulesDir)
        ? p.rulesDir
        : p.legacyRulesDir && existsSync(p.legacyRulesDir)
          ? p.legacyRulesDir
          : null;
    if (dir) {
      for (const f of (await readdir(dir)).filter((f) => f.endsWith('.md'))) {
        const { frontmatter, body } = parseFrontmatter<Record<string, unknown>>(
          await readFile(join(dir, f), 'utf8'),
        );
        const rule: Rule = { id: basename(f, '.md'), body };
        const trigger = frontmatter.trigger;
        if (typeof trigger === 'string' && TRIGGER_TO_ACTIVATION[trigger])
          rule.activation = TRIGGER_TO_ACTIVATION[trigger];
        if (typeof frontmatter.description === 'string')
          rule.description = frontmatter.description;
        if (Array.isArray(frontmatter.globs))
          rule.globs = frontmatter.globs as string[];
        rules.push(rule);
      }
    }
  }
  if (rules.length) ir.rules = rules;

  // Workflows → commands [WS4].
  if (existsSync(p.workflowsDir)) {
    const commands: Command[] = [];
    for (const f of (await readdir(p.workflowsDir))
      .filter((f) => f.endsWith('.md'))
      .sort()) {
      const { frontmatter, body } = parseFrontmatter<Record<string, unknown>>(
        await readFile(join(p.workflowsDir, f), 'utf8'),
      );
      const cmd: Command = { name: basename(f, '.md'), body };
      if (typeof frontmatter.description === 'string')
        cmd.description = frontmatter.description;
      commands.push(cmd);
    }
    if (commands.length) ir.commands = commands;
  }

  // Skills [WS3].
  if (existsSync(p.skillsDir)) {
    const skills: Skill[] = [];
    const entries = await readdir(p.skillsDir, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory()) continue;
      const f = join(p.skillsDir, entry.name, 'SKILL.md');
      if (!existsSync(f)) continue;
      skills.push(parseSkill(await readFile(f, 'utf8'), entry.name));
    }
    if (skills.length) ir.skills = skills;
  }

  // Hooks: reverse-map known natives; unknown natives are not liftable [WS2].
  const hooksFile = await readJson<DevinHooksFile>(p.hooksFile);
  if (hooksFile?.hooks) {
    const hooks: Hook[] = [];
    for (const [native, entries] of Object.entries(hooksFile.hooks)) {
      const canonical = devinToCanonical[native];
      if (!canonical || !Array.isArray(entries)) continue;
      for (const entry of entries) {
        if (!entry.command) continue;
        hooks.push({
          id: `${native}-${hooks.length}`,
          events: [canonical],
          command: entry.command,
        });
      }
    }
    if (hooks.length) ir.hooks = hooks;
  }

  // MCP: user-global mcp_config.json [WS5].
  if (scope === 'user') {
    const mcp = await readJson<{
      mcpServers?: Record<string, Record<string, unknown>>;
    }>(p.mcpFile);
    if (mcp?.mcpServers && !Array.isArray(mcp.mcpServers)) {
      const out: McpServer[] = [];
      for (const [name, s] of Object.entries(mcp.mcpServers)) {
        if (typeof s.serverUrl === 'string') {
          const server = {
            name,
            transport: 'http',
            url: s.serverUrl,
          } as McpServer;
          if (s.headers)
            (server as { headers?: Record<string, string> }).headers =
              s.headers as Record<string, string>;
          out.push(server);
        } else if (typeof s.command === 'string') {
          const server = {
            name,
            transport: 'stdio',
            command: s.command,
          } as McpServer;
          if (s.args) (server as { args?: string[] }).args = s.args as string[];
          if (s.env)
            (server as { env?: Record<string, string> }).env = s.env as Record<
              string,
              string
            >;
          out.push(server);
        }
      }
      if (out.length) ir.mcp_servers = out;
    }
  }

  return ir;
}

async function writeImpl(
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
    if (scope === 'user' && p.globalRulesFile) {
      const body = ir.rules.map((r) => r.body).join('\n\n');
      if (body.length > GLOBAL_RULES_CAP) {
        warnings.push(
          `rules: global_rules.md exceeds the ${GLOBAL_RULES_CAP}-char cap (${body.length}); Windsurf truncates overflow [WS1]`,
        );
      }
      if (!opts.dryRun) {
        await mkdir(dirname(p.globalRulesFile), { recursive: true });
        await writeFile(p.globalRulesFile, `${body}\n`, 'utf8');
      }
      written.push(p.globalRulesFile);
    } else if (p.rulesDir) {
      for (const rule of ir.rules) {
        const chunks = splitRuleBody(rule, RULE_FILE_CAP);
        if (chunks.length > 1) {
          warnings.push(
            `rules/${rule.id}: body exceeds the ${RULE_FILE_CAP}-char/file cap — split into ${chunks.length} files [WS1]`,
          );
        }
        for (const [i, chunk] of chunks.entries()) {
          const file = join(
            p.rulesDir,
            i === 0 ? `${rule.id}.md` : `${rule.id}.${i + 1}.md`,
          );
          if (!opts.dryRun) {
            await mkdir(p.rulesDir, { recursive: true });
            await writeFile(file, serializeDevinRule(rule, chunk), 'utf8');
          }
          written.push(file);
        }
      }
    }
  }

  if (ir.commands?.length) {
    for (const cmd of ir.commands) {
      for (const field of LOSSY_COMMAND_FIELDS) {
        if (cmd[field] !== undefined) {
          warnings.push(
            `commands/${cmd.name}: '${field}' has no workflow frontmatter equivalent (dropped) [WS4]`,
          );
        }
      }
      const fm: Record<string, unknown> = {};
      if (cmd.description !== undefined) fm.description = cmd.description;
      const content = serializeFrontmatter(fm, cmd.body);
      if (content.length > WORKFLOW_FILE_CAP) {
        warnings.push(
          `commands/${cmd.name}: workflow exceeds the ${WORKFLOW_FILE_CAP}-char/file cap [WS4]`,
        );
      }
      const file = join(p.workflowsDir, `${cmd.name}.md`);
      if (!opts.dryRun) {
        await mkdir(p.workflowsDir, { recursive: true });
        await writeFile(file, content, 'utf8');
      }
      written.push(file);
    }
  }

  if (ir.skills?.length) {
    for (const skill of ir.skills) {
      for (const field of LOSSY_SKILL_FIELDS) {
        if (skill[field] !== undefined) {
          warnings.push(
            `skills/${skill.name}: '${field}' has no Windsurf frontmatter equivalent (dropped) [WS3]`,
          );
        }
      }
      const file = join(p.skillsDir, skill.name, 'SKILL.md');
      if (!opts.dryRun) {
        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, serializeDevinSkill(skill), 'utf8');
      }
      written.push(file);
    }
  }

  if (ir.hooks?.length) {
    const existing = (await readJson<DevinHooksFile>(p.hooksFile)) ?? {};
    const native: Record<string, DevinHookEntry[]> = existing.hooks ?? {};
    let mapped = false;
    for (const hook of ir.hooks) {
      for (const event of hook.events) {
        const nativeEvent = canonicalToDevin[event];
        if (!nativeEvent) {
          warnings.push(
            `hooks/${hook.id ?? event}: no Windsurf event for ${event} (12-event dialect) [WS2]`,
          );
          skipped.push({
            path: `hooks/${hook.id ?? event}`,
            reason: `no Windsurf equivalent for ${event} [WS2]`,
          });
          continue;
        }
        if (hook.matcher !== undefined) {
          warnings.push(
            `hooks/${hook.id ?? event}: matcher has no Windsurf equivalent (entries fire per event) [WS2]`,
          );
        }
        const entry: DevinHookEntry = { command: hook.command };
        if (!native[nativeEvent]) native[nativeEvent] = [];
        native[nativeEvent].push(entry);
        mapped = true;
      }
    }
    if (mapped) {
      existing.hooks = native;
      if (!opts.dryRun) {
        await mkdir(dirname(p.hooksFile), { recursive: true });
        await writeFile(
          p.hooksFile,
          `${JSON.stringify(existing, null, 2)}\n`,
          'utf8',
        );
      }
      written.push(p.hooksFile);
    }
  }

  if (ir.mcp_servers?.length) {
    if (scope !== 'user') {
      warnings.push(
        `mcp: Windsurf MCP config is user-global only (~/.codeium/windsurf/mcp_config.json); not written at ${scope} scope [WS5]`,
      );
      for (const s of ir.mcp_servers)
        skipped.push({ path: `mcp/${s.name}`, reason: 'user-global-only' });
    } else {
      const existing =
        (await readJson<{ mcpServers?: Record<string, unknown> }>(p.mcpFile)) ??
        {};
      const servers =
        existing.mcpServers && !Array.isArray(existing.mcpServers)
          ? (existing.mcpServers as Record<string, unknown>)
          : {};
      for (const s of ir.mcp_servers) {
        if (s.transport === 'stdio') {
          const entry: Record<string, unknown> = { command: s.command };
          if (s.args) entry.args = s.args;
          if (s.env) entry.env = s.env;
          servers[s.name] = entry;
        } else {
          const entry: Record<string, unknown> = { serverUrl: s.url };
          if (s.headers) entry.headers = s.headers;
          servers[s.name] = entry;
        }
      }
      existing.mcpServers = servers;
      if (!opts.dryRun) {
        await mkdir(dirname(p.mcpFile), { recursive: true });
        await writeFile(
          p.mcpFile,
          `${JSON.stringify(existing, null, 2)}\n`,
          'utf8',
        );
      }
      written.push(p.mcpFile);
    }
  }

  if (ir.agents?.length) {
    warnings.push(
      `agents: Devin Local subagents are announcement-level; no verified file config (${ir.agents.length} skipped) [WS7]`,
    );
    for (const a of ir.agents)
      skipped.push({ path: `agents/${a.name}`, reason: 'unsupported' });
  }
  if (ir.permissions) {
    warnings.push(
      'permissions: Windsurf has no native permission surface (dropped) [WS5]',
    );
    skipped.push({ path: 'permissions', reason: 'unsupported' });
  }
  if (ir.env && Object.keys(ir.env).length) {
    warnings.push(
      'env: Windsurf has no global env surface (${env:VAR} substitution lives inside mcp_config) [WS5]',
    );
    skipped.push({ path: 'env', reason: 'unsupported' });
  }

  return { written, skipped, warnings };
}

/**
 * Construct the adapter. `windsurf` is accepted as a construction-time id for
 * pre-rename callers. `devin` is the field-canonical id (Windsurf → Devin
 * Desktop, 2026-06-02 [WS7]); `windsurf` resolves to the identical adapter
 * object via the exported singleton's `status.aliases` (E10.S5) — this
 * factory's own `windsurf`-id branch exists only for a caller that wants a
 * standalone instance under the legacy id.
 */
export function createDevinAdapter(
  id: 'devin' | 'windsurf' = 'devin',
): Adapter {
  return {
    id,
    status:
      id === 'devin'
        ? { kind: 'renamed', aliases: ['windsurf'] }
        : { kind: 'renamed', canonicalId: 'devin' },
    capabilities,
    eventMap: canonicalToDevin,
    async detect(scope: Scope, cwd: string): Promise<boolean> {
      const p = paths(scope, cwd);
      if (scope === 'user')
        return existsSync(join(homedir(), '.codeium', 'windsurf'));
      return (
        existsSync(join(cwd, '.devin')) || existsSync(join(cwd, '.windsurf'))
      );
    },
    read: readImpl,
    write: writeImpl,
  };
}

export const devinAdapter: Adapter = createDevinAdapter();
export default devinAdapter;
