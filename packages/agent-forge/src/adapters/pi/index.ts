import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import {
  type Adapter,
  type AdapterCapabilities,
  type Agent,
  type CanonicalEvent,
  type Command,
  type EventMap,
  type Hook,
  type IR,
  type Scope,
  type Skill,
  type WriteOpts,
  type WriteReport,
  parseFrontmatter,
  parseRule,
  parseSkill,
  serializeFrontmatter,
} from '../../core/index.js';

/**
 * Pi adapter (earendil-works/pi coding agent). Ground truth:
 * plans/interop-hardening/completed/pi-harness-research.RETURN.md ([PI#]).
 *
 * Natural config surfaces [PI2][PI5][PI7]:
 * - rules:    root `AGENTS.md` (native walk-up concat; `.pi/AGENTS.md` does
 *   NOT exist as a surface) · user `~/.pi/agent/AGENTS.md`;
 * - skills:   `.agents/skills/` (native discovery, cwd→ancestors) · user
 *   `~/.agents/skills/`; frontmatter constraints enforced, name = dirname
 *   spec-strict even though pi tolerates the deviation;
 * - commands: prompt templates `.pi/prompts/*.md` (description /
 *   argument-hint frontmatter; `$1`/`$ARGUMENTS` substitution is native).
 *
 * Deliberate omissions [PI2 §Philosophy]: no MCP, no permission system —
 * declared `none`, never emitted. Hooks and agents have no config-file
 * dialect; pi designates TS extensions + pi packages as the delivery path,
 * so both are code emissions (see `emitHooksCode` / `emitAgentsCode`):
 * `pi.on()` handlers for hooks [PI3], md defs + a registerTool delegate for
 * agents per the official subagent example [PI9], shipped as ONE pi package
 * (`package.json` keywords ["pi-package"] + `pi.extensions`) [PI6].
 *
 * Trust gate [PI2]: project-scope resources under `.pi/` and
 * `.agents/skills/` are inert until the user trusts the folder
 * (`~/.pi/agent/trust.json`) — every such write warns.
 */

interface PiPaths {
  /** `.pi/` (project) or `~/.pi/agent/` (user/global). */
  piDir: string;
  rulesFile: string;
  skillsDir: string;
  promptsDir: string;
  extensionsDir: string;
  agentsDir: string;
  /** Pi-package manifest home; project scope only. */
  packageFile: string | null;
}

function paths(scope: Scope, cwd: string): PiPaths {
  if (scope === 'user') {
    const piDir = join(homedir(), '.pi', 'agent');
    return {
      piDir,
      rulesFile: join(piDir, 'AGENTS.md'),
      skillsDir: join(homedir(), '.agents', 'skills'),
      promptsDir: join(piDir, 'prompts'),
      extensionsDir: join(piDir, 'extensions'),
      agentsDir: join(piDir, 'agents'),
      packageFile: null,
    };
  }
  const piDir = join(cwd, '.pi');
  return {
    piDir,
    rulesFile: join(cwd, 'AGENTS.md'),
    skillsDir: join(cwd, '.agents', 'skills'),
    promptsDir: join(piDir, 'prompts'),
    extensionsDir: join(piDir, 'extensions'),
    agentsDir: join(piDir, 'agents'),
    packageFile: join(piDir, 'package.json'),
  };
}

/**
 * Canonical → pi extension event names, [PI3]-verified only. Everything
 * else is skipped by name (E4.S4 discipline) — never guessed.
 */
const EVENT_MAP: EventMap = {
  'tool.use.pre': 'tool_call',
  'tool.use.post': 'tool_result',
  'session.start': 'session_start',
  'prompt.submit': 'input',
};

const SUPPORTED_EVENTS = Object.keys(EVENT_MAP) as CanonicalEvent[];

/** Skill frontmatter constraints [PI5]: name ≤64 of [a-z0-9-]; description required, ≤1024 chars. */
const SKILL_NAME_RE = /^[a-z0-9-]{1,64}$/;
const SKILL_DESC_MAX = 1024;

function skillConstraintViolation(skill: Skill): string | null {
  if (!SKILL_NAME_RE.test(skill.name)) {
    return `name must be ≤64 chars of [a-z0-9-], got '${skill.name}' [PI5]`;
  }
  if (!skill.description) {
    return 'description is required — an undescribed skill is not loaded by pi [PI5]';
  }
  if (skill.description.length > SKILL_DESC_MAX) {
    return `description must be ≤${SKILL_DESC_MAX} chars [PI5]`;
  }
  return null;
}

/**
 * Spec-form SKILL.md for the shared `.agents/skills/` tree: Agent Skills
 * spec fields only (dashed keys) plus pi's documented
 * `disable-model-invocation` [PI5]. Name = dirname stays spec-strict even
 * though pi tolerates the deviation. IR-only fields are dropped loudly.
 */
function serializePiSkill(skill: Skill): string {
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

/** Skill fields with no pi frontmatter home — dropped loudly. */
const LOSSY_SKILL_FIELDS = ['files', 'paths', 'user_invocable'] as const;

/** Command fields with no prompt-template frontmatter home [PI7] — dropped loudly. */
const LOSSY_COMMAND_FIELDS = ['model', 'allowed_tools'] as const;

const TRUST_WARNING =
  'trust: project-scope emissions under .pi/ and .agents/skills/ are inert ' +
  'until the folder is trusted — decisions persist in ~/.pi/agent/trust.json [PI2]';

const PACKAGE_WARNING =
  'code delivery: agents and hooks ship as ONE pi package rooted at .pi/ ' +
  '(package.json keywords ["pi-package"]) — distributable via `pi install ./.pi`; ' +
  'pi packages run with full system access — review before install [PI6]';

const capabilities: AdapterCapabilities = {
  resources: {
    rules: 'partial', // native AGENTS.md concat; per-rule metadata lost [PI2]
    skills: 'partial', // frontmatter constraints; files/paths unmodeled [PI5]
    commands: 'partial', // prompt templates; model/allowed_tools lost [PI7]
    agents: 'plugin', // no config dialect — code delivery [PI2][PI9]
    hooks: 'plugin', // no config dialect — pi.on() extension events [PI2][PI3]
    mcp: 'none', // omitted by design [PI2]
    permissions: 'none', // no permission system; containerize instead [PI2]
    env: 'none', // no env surface in settings [PI4]
  },
  hooks: {
    supported: SUPPORTED_EVENTS,
    matchers: 'literal',
    payload: 'native',
  },
  scopes: ['user', 'project'],
};

// ─── code emission: hooks → pi.on() extension [PI3] ────────────────────────

function tsQuote(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function hookHandlerBlock(hook: Hook, event: CanonicalEvent): string {
  const native = EVENT_MAP[event] as string;
  const id = hook.id ?? 'hook';
  const lines: string[] = [];
  lines.push(`  pi.on(${tsQuote(native)}, async (event) => {`);
  lines.push(`    // hook ${tsQuote(id)} ← canonical ${event}`);
  if (hook.matcher && (native === 'tool_call' || native === 'tool_result')) {
    lines.push(
      `    if (String(event?.toolName ?? '') !== ${tsQuote(hook.matcher)}) return;`,
    );
  }
  if (native === 'tool_call') {
    // Blocking route: a non-zero exit vetoes the call [PI3].
    lines.push(`    const status = runHook(${tsQuote(hook.command)}, event);`);
    lines.push('    if (status !== 0) {');
    lines.push(
      `      return { block: true, reason: \`hook ${id} (${hook.command}) exited \${status}\` };`,
    );
    lines.push('    }');
  } else {
    // Non-blocking route (tool_result may rewrite; session_start/input observe).
    lines.push(`    runHook(${tsQuote(hook.command)}, event);`);
  }
  lines.push('  });');
  return lines.join('\n');
}

function renderHooksExtension(entries: [Hook, CanonicalEvent][]): string {
  const blocks = entries.map(([h, e]) => hookHandlerBlock(h, e)).join('\n\n');
  return [
    '/**',
    ' * Generated by agent-forge. Canonical hooks delivered as a pi extension:',
    ' * blocking = tool_call veto {block, reason}; result-mutating = tool_result;',
    ' * lifecycle = session_start; prompt-submit = input [PI3].',
    ' */',
    "import { spawnSync } from 'node:child_process';",
    '',
    'type PiApi = {',
    '  on: (event: string, handler: (event: any) => unknown) => void;',
    '};',
    '',
    'const runHook = (command: string, payload: unknown): number =>',
    '  spawnSync(command, {',
    '    shell: true,',
    '    input: JSON.stringify(payload ?? {}),',
    "    stdio: ['pipe', 'inherit', 'inherit'],",
    '  }).status ?? 0;',
    '',
    'export default (pi: PiApi) => {',
    blocks,
    '};',
    '',
  ].join('\n');
}

// ─── code emission: agents → md defs + registerTool delegate [PI9] ─────────

function serializePiAgent(agent: Agent): string {
  const fm: Record<string, unknown> = { name: agent.name };
  if (agent.description !== undefined) fm.description = agent.description;
  if (agent.model !== undefined) fm.model = agent.model;
  if (agent.tools !== undefined) fm.tools = agent.tools;
  return serializeFrontmatter(fm, agent.body);
}

function renderDelegateExtension(agents: Agent[]): string {
  const names = agents.map((a) => tsQuote(a.name)).join(', ');
  return [
    '/**',
    ' * Generated by agent-forge. Subagent delegate per the official pi',
    ' * subagent example: md defs beside this package + a registerTool',
    ' * dispatcher spawning pi subprocesses [PI9].',
    ' */',
    "import { spawnSync } from 'node:child_process';",
    "import { readFileSync } from 'node:fs';",
    "import { dirname, join } from 'node:path';",
    "import { fileURLToPath } from 'node:url';",
    '',
    `const AGENT_NAMES: string[] = [${names}];`,
    '',
    'export default (pi: any) => {',
    '  pi.registerTool({',
    "    name: 'subagent',",
    "    label: 'Subagent',",
    '    description:',
    "    `Delegate a task to a configured subagent: ${AGENT_NAMES.join(', ')}`,",
    '    parameters: {',
    "      type: 'object',",
    '      properties: {',
    "        agent: { type: 'string', enum: AGENT_NAMES },",
    "        task: { type: 'string' },",
    '      },',
    "      required: ['agent', 'task'],",
    '    },',
    '    execute: async (args: { agent: string; task: string }) => {',
    '      const defDir = join(',
    '        dirname(fileURLToPath(import.meta.url)),',
    "        '..',",
    "        'agents',",
    '      );',
    "      const def = readFileSync(join(defDir, `${args.agent}.md`), 'utf8');",
    '      const prompt = `${def}\\n\\n---\\n\\nTask: ${args.task}`;',
    "      const res = spawnSync('pi', ['-p', prompt], { encoding: 'utf8' });",
    '      return { output: res.stdout ?? String(res.status) };',
    '    },',
    '  });',
    '};',
    '',
  ].join('\n');
}

// ─── the ONE pi package manifest [PI6] ──────────────────────────────────────

async function ensurePackageManifest(
  packageFile: string,
  opts: WriteOpts,
  report: WriteReport,
): Promise<void> {
  let pkg: Record<string, unknown> = {};
  if (existsSync(packageFile)) {
    try {
      pkg = JSON.parse(await readFile(packageFile, 'utf8')) as Record<
        string,
        unknown
      >;
    } catch {
      // Malformed foreign manifest: rebuilt below, loudly.
      report.warnings.push(
        `package: existing ${packageFile} is not valid JSON — rewritten [PI6]`,
      );
    }
  }
  if (typeof pkg.name !== 'string') pkg.name = 'agent-forge-pi-package';
  if (typeof pkg.version !== 'string') pkg.version = '0.0.0';
  const keywords = Array.isArray(pkg.keywords)
    ? (pkg.keywords as string[])
    : [];
  if (!keywords.includes('pi-package')) keywords.push('pi-package');
  pkg.keywords = keywords;
  const pi =
    typeof pkg.pi === 'object' && pkg.pi !== null
      ? (pkg.pi as Record<string, unknown>)
      : {};
  const extensions = Array.isArray(pi.extensions)
    ? (pi.extensions as string[])
    : [];
  if (!extensions.includes('./extensions')) extensions.push('./extensions');
  pi.extensions = extensions;
  pkg.pi = pi;
  if (!opts.dryRun) {
    await mkdir(dirname(packageFile), { recursive: true });
    await writeFile(packageFile, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
  }
  report.written.push(packageFile);
}

function pushUnique(list: string[], item: string): void {
  if (!list.includes(item)) list.push(item);
}

/** Hooks delivered as generated code (see module docs) [PI3][PI6]. */
async function emitHooksCode(
  ir: IR,
  scope: Scope,
  cwd: string,
  opts: WriteOpts,
): Promise<WriteReport> {
  const p = paths(scope, cwd);
  const report: WriteReport = { written: [], skipped: [], warnings: [] };
  const entries: [Hook, CanonicalEvent][] = [];
  for (const hook of ir.hooks ?? []) {
    for (const event of hook.events) {
      if (EVENT_MAP[event]) {
        entries.push([hook, event]);
      } else {
        report.skipped.push({
          path: `hooks/${hook.id ?? 'hook'}`,
          reason: `no [PI3]-verified pi.on() equivalent for '${event}' — skipped by name`,
        });
      }
    }
  }
  if (entries.length > 0) {
    const file = join(p.extensionsDir, 'agent-forge-hooks.ts');
    if (!opts.dryRun) {
      await mkdir(p.extensionsDir, { recursive: true });
      await writeFile(file, renderHooksExtension(entries), 'utf8');
    }
    report.written.push(file);
    if (p.packageFile) {
      await ensurePackageManifest(p.packageFile, opts, report);
      pushUnique(report.warnings, PACKAGE_WARNING);
    }
    if (scope !== 'user') pushUnique(report.warnings, TRUST_WARNING);
  }
  return report;
}

/** Agents delivered as generated code (see module docs) [PI9][PI6]. */
async function emitAgentsCode(
  ir: IR,
  scope: Scope,
  cwd: string,
  opts: WriteOpts,
): Promise<WriteReport> {
  const p = paths(scope, cwd);
  const report: WriteReport = { written: [], skipped: [], warnings: [] };
  const agents = ir.agents ?? [];
  if (agents.length === 0) return report;
  for (const agent of agents) {
    const defFile = join(p.agentsDir, `${agent.name}.md`);
    if (!opts.dryRun) {
      await mkdir(p.agentsDir, { recursive: true });
      await writeFile(defFile, serializePiAgent(agent), 'utf8');
    }
    report.written.push(defFile);
  }
  const file = join(p.extensionsDir, 'agent-forge-subagents.ts');
  if (!opts.dryRun) {
    await mkdir(p.extensionsDir, { recursive: true });
    await writeFile(file, renderDelegateExtension(agents), 'utf8');
  }
  report.written.push(file);
  if (p.packageFile) {
    await ensurePackageManifest(p.packageFile, opts, report);
    pushUnique(report.warnings, PACKAGE_WARNING);
  }
  if (scope !== 'user') pushUnique(report.warnings, TRUST_WARNING);
  return report;
}

// ─── read: config surfaces lift; generated code is write-only [PI3] ────────

async function readImpl(scope: Scope, cwd: string): Promise<Partial<IR>> {
  const p = paths(scope, cwd);
  const ir: Partial<IR> = {};
  const rules: NonNullable<IR['rules']> = [];

  // AGENTS.md or CLAUDE.md — co-equal alternative filename [PI2].
  const contextDir = scope === 'user' ? p.piDir : cwd;
  for (const [file, id] of [
    [join(contextDir, 'AGENTS.md'), 'main'],
    [join(contextDir, 'CLAUDE.md'), 'main'],
  ] as const) {
    if (existsSync(file)) {
      rules.push(parseRule(await readFile(file, 'utf8'), id));
      break;
    }
  }
  // System-prompt surfaces: SYSTEM.md (replace) / APPEND_SYSTEM.md (append),
  // at `.pi/` (project) or `~/.pi/agent/` (user) [PI2].
  const systemDir = p.piDir;
  for (const [name, id] of [
    ['SYSTEM.md', 'system'],
    ['APPEND_SYSTEM.md', 'append-system'],
  ] as const) {
    const file = join(systemDir, name);
    if (existsSync(file)) {
      rules.push(parseRule(await readFile(file, 'utf8'), id));
    }
  }
  if (rules.length) ir.rules = rules;

  if (existsSync(p.skillsDir)) {
    const entries = await readdir(p.skillsDir, { withFileTypes: true });
    const skills: Skill[] = [];
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory()) continue;
      const f = join(p.skillsDir, entry.name, 'SKILL.md');
      if (!existsSync(f)) continue;
      skills.push(parseSkill(await readFile(f, 'utf8'), entry.name));
    }
    if (skills.length) ir.skills = skills;
  }

  if (existsSync(p.promptsDir)) {
    const files = (await readdir(p.promptsDir))
      .filter((f) => f.endsWith('.md'))
      .sort();
    const commands: Command[] = [];
    for (const f of files) {
      const { frontmatter, body } = parseFrontmatter<Record<string, unknown>>(
        await readFile(join(p.promptsDir, f), 'utf8'),
      );
      const command: Command = { name: basename(f, '.md'), body };
      if (typeof frontmatter.description === 'string')
        command.description = frontmatter.description;
      if (typeof frontmatter['argument-hint'] === 'string')
        command.argument_hint = frontmatter['argument-hint'];
      commands.push(command);
    }
    if (commands.length) ir.commands = commands;
  }

  // `.pi/extensions/*.ts` is NEVER parsed as config: code emissions are
  // write-only; foreign extension files surface via the import audit's
  // unlifted-surfaces channel, not as phantom resources [PI3].
  return ir;
}

// ─── write: natural surfaces + internal code-emission routing ──────────────

function mergeInto(target: WriteReport, source: WriteReport): void {
  target.written.push(...source.written);
  target.skipped.push(...source.skipped);
  for (const w of source.warnings) pushUnique(target.warnings, w);
}

async function writeImpl(
  ir: IR,
  scope: Scope,
  cwd: string,
  opts: WriteOpts = {},
): Promise<WriteReport> {
  const p = paths(scope, cwd);
  const report: WriteReport = { written: [], skipped: [], warnings: [] };
  let trustGated = false;

  if (ir.rules?.length) {
    // Root AGENTS.md, native walk-up concat — pre-trust context surface,
    // never `.pi/AGENTS.md` (that surface does not exist) [PI2].
    const body = ir.rules.map((r) => r.body).join('\n\n');
    if (!opts.dryRun) {
      await mkdir(dirname(p.rulesFile), { recursive: true });
      await writeFile(p.rulesFile, `${body}\n`, 'utf8');
    }
    report.written.push(p.rulesFile);
  }

  if (ir.skills?.length) {
    for (const skill of ir.skills) {
      const skillFile = join(p.skillsDir, skill.name, 'SKILL.md');
      const violation = skillConstraintViolation(skill);
      if (violation) {
        report.warnings.push(`skills/${skill.name}: ${violation}`);
        report.skipped.push({
          path: skillFile,
          reason: 'constraint-violation',
        });
        continue;
      }
      for (const field of LOSSY_SKILL_FIELDS) {
        if (skill[field] !== undefined) {
          report.warnings.push(
            `skills/${skill.name}: '${field}' has no pi frontmatter equivalent (dropped) [PI5]`,
          );
        }
      }
      if (!opts.dryRun) {
        await mkdir(dirname(skillFile), { recursive: true });
        await writeFile(skillFile, serializePiSkill(skill), 'utf8');
      }
      report.written.push(skillFile);
      trustGated = true;
    }
  }

  if (ir.commands?.length) {
    for (const command of ir.commands) {
      const promptFile = join(p.promptsDir, `${command.name}.md`);
      const fm: Record<string, unknown> = {};
      if (command.description !== undefined)
        fm.description = command.description;
      if (command.argument_hint !== undefined)
        fm['argument-hint'] = command.argument_hint;
      for (const field of LOSSY_COMMAND_FIELDS) {
        if (command[field] !== undefined) {
          report.warnings.push(
            `commands/${command.name}: '${field}' has no prompt-template frontmatter home (dropped) [PI7]`,
          );
        }
      }
      if (!opts.dryRun) {
        await mkdir(p.promptsDir, { recursive: true });
        await writeFile(
          promptFile,
          serializeFrontmatter(fm, command.body),
          'utf8',
        );
      }
      report.written.push(promptFile);
      trustGated = true;
    }
  }

  // Code-shaped resources: direct `write` calls receive the full IR and
  // route here; engine compiles strip these and call the emitters directly.
  if (ir.agents?.length) {
    mergeInto(report, await emitAgentsCode(ir, scope, cwd, opts));
  }
  if (ir.hooks?.length) {
    mergeInto(report, await emitHooksCode(ir, scope, cwd, opts));
  }

  if (ir.mcp_servers?.length) {
    report.warnings.push(
      `mcp: pi omits MCP by design (${ir.mcp_servers.length} skipped); the designated route is an extension [PI2]`,
    );
    for (const s of ir.mcp_servers) {
      report.skipped.push({
        path: `mcp/${s.name}`,
        reason: 'unsupported-by-design [PI2]',
      });
    }
  }
  if (ir.permissions) {
    report.warnings.push(
      'permissions: pi has no permission system — run in a container or extend [PI2]',
    );
    report.skipped.push({ path: 'permissions', reason: 'unsupported [PI2]' });
  }
  if (ir.env && Object.keys(ir.env).length) {
    report.warnings.push('env: pi settings expose no env surface [PI4]');
    report.skipped.push({ path: 'env', reason: 'unsupported [PI4]' });
  }

  if (trustGated && scope !== 'user') {
    pushUnique(report.warnings, TRUST_WARNING);
  }

  return report;
}

export const piAdapter: Adapter = {
  id: 'pi',
  capabilities,
  eventMap: EVENT_MAP,
  pluginEmitters: {
    agents: emitAgentsCode,
    hooks: emitHooksCode,
  },
  async detect(scope: Scope, cwd: string): Promise<boolean> {
    const p = paths(scope, cwd);
    return existsSync(p.piDir) || existsSync(p.rulesFile);
  },
  read: readImpl,
  write: writeImpl,
};
export default piAdapter;
