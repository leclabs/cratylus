// `cratylus deploy` — place an already-projected render tree (agents/ +
// skills/) into the LOCAL `.claude/` root. The deploy half of the
// projection↔deploy self-binding (the projection is `forge`
// claude-adapter output; this lands it locally).
//
// Local-only by construction: installing the packages on a host is npm's job,
// and iterating hosts is the operator's outer loop around the whole pipeline.
// Neither is a stage, so neither is here.

import { existsSync, statSync } from 'node:fs';
import { dirname, join, resolve as resolvePath } from 'node:path';
import type { AgentPlugin } from '@cratylus/schema';
import { adapterByName } from '../../adapters/registry/index.js';
import { CLI_BIN } from '../../bin-name.js';
import { loadConfig } from '../../config/index.js';
import { CONFIG_FILE } from '../../config/scaffold.js';
import type { HarnessAdapter } from '../../core/harness-adapter.js';
import { keepsHostModel } from '../../deploy/deploy.js';
import {
  DEPLOY_CHECK_EXIT,
  type DeployKind,
  type RenderTree,
  type RuntimeConfigRecord,
  type Scope,
  type SkillCompanions,
  deploySingle,
  emitRuntimeConfig,
  projectScope,
  readManifest,
  resolveNames,
  userScope,
  writeManifest,
} from '../../deploy/index.js';
import { type DriftReport, auditLocal } from '../../deploy/local.js';
import {
  runtimeConfigTarget,
  unreadableRuntimeConfig,
} from '../../deploy/runtime-config.js';
import { resolveSkills } from '../../project/resolve-skills.js';
import { fail as failLine, say, warn as warnLine } from '../style.js';

/** The CLI `--kind` argument: a real `DeployKind`, or the `all` sugar that
 *  expands to every kind in ONE invocation (agent → skill → hooks) under the
 *  SAME target resolution. `all` is a CLI-layer concept only; the deploy engine
 *  never sees it (it is expanded here before any engine call). */
export type DeployKindArg = DeployKind | 'all';

/** The kinds `all` expands to, in deploy order. */
export const ALL_KINDS: readonly DeployKind[] = ['agent', 'skill', 'hooks'];

export interface DeployCmdOpts {
  // The render tree to deploy.
  agentsDir: string;
  skillsDir: string;
  // Render tree hooks root (settings.json + hooks/<id>/); --kind hooks only.
  hooksDir?: string;
  // Per-skill committed `assets:` companion declarations.
  companions?: Record<string, SkillCompanions>;
  // What to ship. `all` expands to agent → skill → hooks (same target opts).
  kind: DeployKindArg;
  scope: Scope;
  /** Harness name (`claude` | `omp`); decides WHICH home the tree lands in. */
  harness?: string | null;
  // Target — the local harness root the scope resolves to.
  home?: string | null;
  project?: string | null;
  only?: string | null;
  /** The corpus's plugin set, when the caller already holds it. Supplied by
   *  `install`, which resolves its plugins in memory and has no config file to be
   *  read back. Absent ⇒ read from `config`. */
  plugins?: readonly AgentPlugin[];
  dryRun?: boolean;
  /** REPORT ONLY: compare the deployed tree against the render tree and print
   *  every divergence. Places nothing, prunes nothing, repairs nothing. */
  check?: boolean;
  /** `--verbose`: also report the per-file detail of the run. */
  verbose?: boolean;
  /** The command this deploy runs in, named where an error says what to run again.
   *  Absent ⇒ `deploy`. */
  command?: 'deploy' | 'install';
  /** Where the report goes: the summary, and under `verbose` the per-file detail.
   *  Absent ⇒ stdout. */
  log?: (line: string) => void;
  /** Where a warning goes — the message alone, which the sink prefixes. Absent ⇒
   *  stderr as `cratylus deploy: warning: <message>`. */
  warn?: (message: string) => void;
  /** Where the failure goes — the message alone, which the sink prefixes. Absent ⇒
   *  stderr as `cratylus deploy: <message>`. */
  fail?: (message: string) => void;
  /** Per-agent model the operator chose (agent name → `model:` value), placed on
   *  the def where the harness keeps a host's model line (claude). A harness whose
   *  routes live in its own config (omp) refuses a non-empty map. */
  models?: Readonly<Record<string, string>>;
  /**
   * Path to `cratylus.config.ts` — read, when no `plugins` are supplied, for the
   * facts deploy cannot obtain from a render tree: the corpus's lifecycle-event
   * vocabulary (`AgentPlugin.events`) and the capability configuration its skills
   * declare on their runtime faces.
   *
   * The tree is a directory of already-rendered bytes; neither fact is in it.
   * Reading the plugin set here is the same route `project` takes, so the two
   * cannot disagree about what the corpus declares. Absent or unreadable ⇒ the
   * host config is not emitted and the deploy says so, rather than writing an
   * empty vocabulary that would leave every runtime capability unable to validate.
   */
  config?: string | null;
}

function splitList(s: string | null | undefined): string[] | null {
  if (!s) {
    return null;
  }
  const items = s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  return items.length ? items : null;
}

/** Parse a `--assets skill=spec[,skill=spec...]` declaration into a companions
 *  map. Each entry binds one committed-asset spec to a skill; repeated keys
 *  accumulate. Specs resolve against the skill's source dir. */
export function parseCompanions(
  assets: string | null | undefined,
): Record<string, SkillCompanions> | undefined {
  const map: Record<string, SkillCompanions> = {};
  for (const pair of splitList(assets) ?? []) {
    const eq = pair.indexOf('=');
    if (eq < 0) {
      throw new Error(
        `--assets: '${pair}' must be <skill>=<spec> (e.g. skill=logo.png)`,
      );
    }
    const skill = pair.slice(0, eq).trim();
    const spec = pair.slice(eq + 1).trim();
    if (!map[skill]) {
      map[skill] = {};
    }
    const c = map[skill];
    if (!c.assets) {
      c.assets = [];
    }
    c.assets.push(spec);
  }
  return Object.keys(map).length ? map : undefined;
}

/** What a deploy did, for whoever reports it. */
export interface DeployOutcome {
  /** The exit code: 0 landed; 1 refused or failed; 2 a placed shim is inert. */
  rc: number;
  harness: string;
  harnessDir: string;
  dry: boolean;
  /** Per kind run: how many names it placed. */
  placed: { kind: DeployKind; count: number }[];
  /** Orphans a prior deploy placed that this one removed (or, dry, would). */
  pruned: number;
  /** Stale `settings.json` hook registrations removed (or, dry, to be). */
  unregistered: number;
  /** Dry run: names in the target this tool cannot account for, never pruned. */
  unaccounted: number;
  /** The runtime config this deploy wrote, or (dry) would write; null ⇒ none. */
  runtimeConfig: { path: string; wrote: boolean } | null;
  /** Directories outside the harness directory this deploy placed files in (or, dry,
   *  would), each with how many files. omp's vendor-neutral root is one. */
  outside: Record<string, number>;
}

const KIND_NOUN: Readonly<Record<DeployKind, string>> = {
  agent: 'agent',
  skill: 'skill',
  hooks: 'hook',
};

const plural = (n: number, noun: string): string =>
  `${n} ${noun}${n === 1 ? '' : 's'}`;

/** The concrete kinds `--kind` names. Anything else is refused: it was run as a kind
 *  of nothing, and reported "deployed 2 undefineds". */
function kindsOf(kind: DeployKindArg): readonly DeployKind[] {
  if (kind === 'all') return ALL_KINDS;
  if (ALL_KINDS.includes(kind)) return [kind];
  throw new Error(
    `unknown kind '${String(kind)}'; pass --kind <${[...ALL_KINDS, 'all'].join('|')}>`,
  );
}

/** Refuse a render dir that these kinds read and that is not a directory. A missing
 *  dir read as an empty tree places nothing, and the prune then removes everything a
 *  prior deploy placed for want of a render to match it against. A dir the kinds do
 *  not read is not asked about. */
function assertRenderDirs(
  opts: DeployCmdOpts,
  kinds: readonly DeployKind[],
): void {
  const reads: Record<DeployKind, string | undefined> = {
    agent: opts.agentsDir,
    skill: opts.skillsDir,
    hooks: opts.hooksDir,
  };
  const missing = kinds
    .map((kind) => reads[kind])
    .filter(
      (dir): dir is string =>
        dir !== undefined && !(existsSync(dir) && statSync(dir).isDirectory()),
    );
  if (missing.length > 0) {
    throw new Error(
      `no render dir at ${[...new Set(missing)].join(', ')}; run \`${CLI_BIN} project\` first, or pass the right --from, --agents-dir, --skills-dir or --hooks-dir`,
    );
  }
}

/** Place the render tree and say nothing but through the sinks: `log` takes the
 *  per-file detail, `warn` and `fail` the diagnostics. The result is returned, for
 *  the caller to report in its own words. */
export async function deployTree(opts: DeployCmdOpts): Promise<DeployOutcome> {
  const log = opts.log ?? (() => {});
  const warn = opts.warn ?? ((message: string) => warnLine('deploy', message));
  const fail = opts.fail ?? ((message: string) => failLine('deploy', message));
  const outcome: DeployOutcome = {
    rc: 0,
    harness: opts.harness ?? 'claude',
    harnessDir: '',
    dry: opts.dryRun ?? false,
    placed: [],
    pruned: 0,
    unregistered: 0,
    unaccounted: 0,
    runtimeConfig: null,
    outside: {},
  };
  try {
    const kinds = kindsOf(opts.kind);
    assertRenderDirs(opts, kinds);
    // WHICH harness's home the tree lands in. Resolved by NAME through the same
    // registry `project` uses, so `deploy --harness <name>` and `project --harness
    // <name>` cannot disagree about where that harness lives. Unknown name fails
    // loudly here rather than silently deploying into `.claude`.
    const harnessAdapter = adapterByName(outcome.harness);
    const tree: RenderTree = {
      agentsDir: opts.agentsDir,
      skillsDir: opts.skillsDir,
      hooksDir: opts.hooksDir,
      companions: opts.companions,
    };
    if (
      opts.models !== undefined &&
      Object.keys(opts.models).length > 0 &&
      !keepsHostModel(harnessAdapter.home)
    ) {
      fail(
        `the '${harnessAdapter.name}' harness routes models in its own config, so a per-agent model cannot be placed on its agent defs; set the model in that config`,
      );
      return { ...outcome, rc: 1 };
    }
    // THE SCOPE IS RESOLVED ONCE, and a bare home is said once: it was said by each
    // kind in turn, the same fact three times over.
    const scopeRes =
      opts.scope === 'project'
        ? projectScope(opts.project ?? null, harnessAdapter.home ?? undefined)
        : userScope(
            opts.home ?? null,
            harnessAdapter.home ?? undefined,
            harnessAdapter.homeEnv,
          );
    outcome.harnessDir = scopeRes.harnessDir;
    if (scopeRes.note) {
      warn(scopeRes.note.message);
    }

    // THE RUNTIME CONFIG IS SETTLED BEFORE ANYTHING IS PLACED. One this run would write
    // over and cannot read is refused here, with nothing yet written. It follows the
    // home the run was given, when it was given one: a project-scope deploy, and a run
    // given no home, leave it to the process's.
    const runtimeHome =
      opts.scope === 'user' && opts.home
        ? dirname(scopeRes.harnessDir)
        : undefined;
    const plan = await planRuntimeConfig(opts, runtimeHome, warn);

    // Expand the `all` sugar to the concrete kinds; a single kind runs a
    // one-element loop. Every kind reuses the EXISTING per-kind engine path with
    // IDENTICAL target opts. The overall rc is the first non-zero kind's rc.
    for (const kind of kinds) {
      const r = deploySingle({
        kind,
        scope: opts.scope,
        tree,
        harnessHome: harnessAdapter.home,
        harnessHomeEnv: harnessAdapter.homeEnv ?? null,
        agentExt: harnessAdapter.agentExt,
        agentRel: (n: string) => harnessAdapter.agentRel(n),
        skillRel: (n: string, agents: readonly string[]) =>
          harnessAdapter.skillRel(n, agents),
        // Optional on the port: present only on a harness whose mechanism is a
        // scoped module rather than a config merge.
        scopedRel: harnessAdapter.scopedRel ?? null,
        hooksFile: harnessAdapter.hooksFile,
        home: opts.home ?? null,
        project: opts.project ?? null,
        ...(opts.models ? { models: opts.models } : {}),
        only: splitList(opts.only),
        dry: outcome.dry,
        log,
        warn,
      });
      if (r.result.refusal !== undefined) {
        fail(r.result.refusal);
      }
      if (r.rc !== 0 && outcome.rc === 0) {
        outcome.rc = r.rc;
      }
      outcome.placed.push({
        kind,
        count: r.names.length - r.result.report.skipped.length,
      });
      outcome.pruned += r.pruned.length;
      outcome.unregistered += r.unregistered;
      outcome.unaccounted += r.unaccounted.length;
      for (const rel of Object.values(r.result.report.written).flat()) {
        if (!rel.startsWith('../')) continue;
        const parts = rel.split('/');
        const root = resolvePath(
          outcome.harnessDir,
          ...parts.slice(0, parts.findIndex((p) => p !== '..') + 1),
        );
        outcome.outside[root] = (outcome.outside[root] ?? 0) + 1;
      }
    }
    const emitted =
      plan === null
        ? null
        : await emitHostRuntimeConfig(
            opts,
            plan,
            harnessAdapter.name,
            harnessAdapter.nativeEvents,
            harnessAdapter.nativeActs,
            runtimeHome,
            log,
          );
    outcome.runtimeConfig =
      emitted === null ? null : { path: emitted.path, wrote: emitted.wrote };
    // What this deploy wrote into the file, kept with the record of what it placed: the
    // host may hold keys of its own there and may change a part later, which an uninstall
    // must tell from what was written.
    if (emitted?.wrote === true) {
      writeManifest(outcome.harnessDir, {
        ...readManifest(outcome.harnessDir),
        runtimeConfig: emitted.record,
      });
    }
    return outcome;
  } catch (e) {
    fail((e as Error).message);
    return { ...outcome, rc: 1 };
  }
}

/** A deploy's report, as lines: what was placed and where, what was pruned, the
 *  runtime config, and the next step. Per-file detail is `--verbose`'s. */
function summarize(outcome: DeployOutcome): string[] {
  const { dry, harness, harnessDir } = outcome;
  const placed = outcome.placed
    .map((p) => plural(p.count, KIND_NOUN[p.kind]))
    .join(', ');
  const lines = [
    `${dry ? 'would deploy' : 'deployed'} ${placed} to ${harness} (${harnessDir})`,
  ];
  if (outcome.pruned > 0) {
    lines.push(
      `${dry ? 'would prune' : 'pruned'} ${plural(outcome.pruned, 'orphan')} a prior deploy placed`,
    );
  }
  if (outcome.unregistered > 0) {
    lines.push(
      `${dry ? 'would unregister' : 'unregistered'} ${plural(outcome.unregistered, 'stale hook registration')}`,
    );
  }
  if (outcome.unaccounted > 0) {
    lines.push(
      `left alone ${plural(outcome.unaccounted, 'name')} in the target that this tool did not place and cannot account for (--verbose names them)`,
    );
  }
  for (const [root, count] of Object.entries(outcome.outside)) {
    lines.push(
      `${dry ? 'would place' : 'placed'} ${plural(count, 'file')} in ${root}, outside ${harnessDir}`,
    );
  }
  if (outcome.runtimeConfig !== null) {
    const { path, wrote } = outcome.runtimeConfig;
    lines.push(`${wrote ? 'wrote' : 'would write'} the runtime config ${path}`);
  }
  lines.push(
    dry
      ? 'next: run it again without --dry-run to place them'
      : `next: start or restart ${harness}`,
  );
  return lines;
}

export async function runDeploy(opts: DeployCmdOpts): Promise<number> {
  if (opts.check) {
    return runDeployCheck(opts);
  }
  const log = opts.log ?? say;
  const outcome = await deployTree({
    ...opts,
    log: opts.verbose ? log : () => {},
  });
  if (outcome.rc === 0) {
    for (const line of summarize(outcome)) {
      log(line);
    }
  }
  return outcome.rc;
}

/** What the host runtime config is emitted from: the plugin set, and the corpus's
 *  events that its vocabulary is. */
interface RuntimeConfigPlan {
  readonly plugins: readonly AgentPlugin[];
  readonly events: string[];
}

/**
 * Whether, and from what, this deploy emits the host config — settled before anything
 * is placed, so that a runtime config this deploy would write over and cannot read is
 * refused with nothing yet written. `null` ⇒ none is emitted (and a warning says why).
 */
async function planRuntimeConfig(
  opts: DeployCmdOpts,
  home: string | undefined,
  warn: (message: string) => void,
): Promise<RuntimeConfigPlan | null> {
  // THE CALLER MAY ALREADY HOLD THE CORPUS, and when it does, re-reading a config
  // file to recover what it has is how a zero-config path ends up half-configured.
  // `install` resolves its plugins in memory and has no config file by definition —
  // it passes the plugin set straight through rather than sending deploy to look
  // for a file that will not be there. Either way, the vocabulary and the
  // configuration are derived from ONE plugin set, by one route.
  let plugins = opts.plugins;
  if (plugins === undefined) {
    const configPath =
      opts.config ?? join(opts.project ?? process.cwd(), CONFIG_FILE);
    if (!existsSync(configPath)) {
      warn(
        `runtime config not emitted: no ${CONFIG_FILE} at ${configPath}, so the corpus's event vocabulary is unavailable and runtime capabilities on this host cannot validate an event name; pass --config <path> to the corpus's config`,
      );
      return null;
    }
    plugins = (await loadConfig(configPath)).extends;
  }
  const events = [...new Set(plugins.flatMap((p) => p.events ?? []))];
  if (events.length === 0) {
    warn(
      'runtime config not emitted: the plugin set declares no `events`, so runtime capabilities on this host cannot validate an event name; declare the corpus’s events',
    );
    return null;
  }
  const target = runtimeConfigTarget(process.env, home);
  const why = unreadableRuntimeConfig(target);
  if (why !== undefined) {
    throw new Error(
      `${target} ${why}; repair the file or move it away, then run ${CLI_BIN} ${opts.command ?? 'deploy'} again`,
    );
  }
  return { plugins, events };
}

/**
 * Emit the host runtime config — ARCHITECTURE property 4's producer.
 *
 * The corpus's vocabulary and its skills' capability configuration reach the
 * projector as DATA on the plugin set (property 3) and the harness's native map
 * comes off the adapter, so this step decides nothing and carries facts it was
 * handed. It runs once per deploy invocation, not once per kind: the config is a
 * property of the corpus and the harness, not of whether agents or skills were the
 * thing being placed.
 *
 * A MISSING CONFIG FILE IS A WARNING, NOT A FAILURE. `deploy` is reachable with a
 * bare render tree and no corpus in sight (that is what `--agents-dir` is for), and
 * refusing the whole deploy over a step that did not apply would be a refusal where
 * the shortfall is legible. It warns and names exactly what the host will lack.
 *
 * It returns where the config went (or, dry, would go): the file is written outside
 * the harness directory, so a caller that names what it writes names this too.
 */
async function emitHostRuntimeConfig(
  opts: DeployCmdOpts,
  plan: RuntimeConfigPlan,
  harness: string,
  nativeEvents: Readonly<Record<string, string>>,
  nativeActs: HarnessAdapter['nativeActs'],
  home: string | undefined,
  log: (line: string) => void,
): Promise<{
  path: string;
  wrote: boolean;
  record: RuntimeConfigRecord;
}> {
  const { path, wrote, doc, stanza, record } = emitRuntimeConfig({
    events: plan.events,
    harness,
    nativeEvents,
    ...(nativeActs === undefined ? {} : { nativeActs }),
    skills: (await resolveSkills(plan.plugins)).map((s) => s.skill),
    dry: opts.dryRun ?? false,
    ...(home === undefined ? {} : { home }),
  });
  log(
    `runtime config${wrote ? '' : ' (dry-run)'}: ${path}: ` +
      `${doc.events.vocabulary.length} event(s), ` +
      `harnesses.${harness}: ${Object.keys(stanza.native).length} with a native peer, ` +
      `${Object.keys(record.capabilities).length} configured capability(ies)`,
  );
  return { path, wrote, record };
}

// ─────────────────────────────────────────────────────────────────────────────
// `cratylus deploy --check` — is the host what the corpus RENDERS?
//
// Reachable without the suite ON PURPOSE. The failure it catches is a property
// of the HOST, not of the repo: a contributor with no deployment has nothing to
// compare, and the suite that runs in the repo could never have caught the
// incident that motivated this. The whole of the check is a report — it places
// nothing, prunes nothing, and repairs nothing, so it is safe to point at a
// machine one is not ready to converge.
// ─────────────────────────────────────────────────────────────────────────────

/** How many differing lines to print per side before eliding. The report is for
 *  reading; a full diff of a doctrine is not. */
const REPORT_LINES = 12;

/** Render one kind's drift as report lines. Pure — the verdict text and the
 *  formatting are separable from the IO so both are testable. */
export function formatDrift(report: DriftReport): string[] {
  const out: string[] = [];
  for (const d of report.divergences) {
    if (d.kind === 'stale') {
      out.push(`  STALE   ${d.path} — deployed bytes are not what we render`);
      out.push(`            ${d.gist}`);
      if (d.missing.length > 0) {
        out.push('            MISSING on this host (rendered, not deployed):');
        for (const l of d.missing) {
          out.push(`              + ${l}`);
        }
      }
      if (d.superseded.length > 0) {
        out.push(
          '            STILL RUNNING here (deployed, no longer rendered):',
        );
        for (const l of d.superseded) {
          out.push(`              - ${l}`);
        }
      }
      continue;
    }
    if (d.kind === 'absent') {
      out.push(
        `  ABSENT  ${d.path} — rendered, never deployed (${d.bytes} bytes never arrived)`,
      );
      out.push(`            ${d.gist}`);
      continue;
    }
    out.push(
      `  ?       ${d.path} — deployed, not rendered${d.ours ? ' (OURS, retired: a deploy would prune it)' : ' (NOT ours: left alone)'}`,
    );
    out.push(`            ${d.gist}`);
  }
  return out;
}

/**
 * The check's verdict.
 *
 * `stale` and `absent` are OUR defects — the host is running something the
 * corpus does not say, or never received something it does — so they exit
 * non-zero. `foreign` does not: deciding that a file we cannot account for is a
 * failure is the same inference the prune refuses, and an operator's own
 * artifact sitting in their own `.claude` is not a defect. It is reported every
 * time regardless; the floor is never silence.
 *
 * IT NEVER RETURNS `noVerdict`. This function is only reachable once the audit
 * ran, so its two outcomes are the two it can testify to. The third code is
 * emitted where the testimony fails to exist — see `runDeployCheck`'s catch.
 */
export function driftVerdict(reports: readonly DriftReport[]): {
  stale: number;
  absent: number;
  foreign: number;
  rc: number;
} {
  const all = reports.flatMap((r) => [...r.divergences]);
  const n = (k: string): number => all.filter((d) => d.kind === k).length;
  const stale = n('stale');
  const absent = n('absent');
  return {
    stale,
    absent,
    foreign: n('foreign'),
    rc: stale + absent > 0 ? DEPLOY_CHECK_EXIT.drift : DEPLOY_CHECK_EXIT.inSync,
  };
}

/** Compare the deployed tree against the render tree; report, change nothing. */
export function runDeployCheck(opts: DeployCmdOpts): number {
  const log = opts.log ?? say;
  const fail =
    opts.fail ?? ((message: string) => failLine('deploy --check', message));
  const tree: RenderTree = {
    agentsDir: opts.agentsDir,
    skillsDir: opts.skillsDir,
    hooksDir: opts.hooksDir,
    companions: opts.companions,
  };
  try {
    const kinds = kindsOf(opts.kind);
    assertRenderDirs(opts, kinds);
    // INSIDE THE TRY, and it was not. An unknown `--harness` threw straight out of
    // this function, past the catch that owns the exit contract — so the process
    // died on an uncaught error and its status was whatever the runtime chose,
    // which is `1`: the code that means DRIFT. The check's own failure was
    // reported as a stale host by the one path that could not be caught.
    const harnessAdapter = adapterByName(opts.harness ?? 'claude');
    // Same scope resolution the deploy path uses, so a check and the deploy it
    // audits can never be looking at two different roots.
    const scopeRes =
      opts.scope === 'project'
        ? projectScope(opts.project ?? null, harnessAdapter.home ?? undefined)
        : userScope(
            opts.home ?? null,
            harnessAdapter.home ?? undefined,
            harnessAdapter.homeEnv,
          );
    const harnessDir = scopeRes.harnessDir;
    log(`deploy --check of ${harnessDir} (reports only, changes nothing)`);

    const reports: DriftReport[] = [];
    for (const kind of kinds) {
      const names = resolveNames(
        kind,
        tree,
        splitList(opts.only),
        harnessAdapter.agentExt ?? undefined,
      );
      // THE WHOLE LAYOUT, not just the extension. The check used to pass
      // `agentExt` alone, so every non-claude harness was audited against claude's
      // destinations: an omp check compared `agents/<name>.md` at the harness
      // root while the deploy it audits writes `agent/agents/<name>.md`, and
      // reported the whole corpus absent. Same facts as the deploy call above,
      // same source.
      const report = auditLocal(harnessDir, kind, tree, names, {
        agentExt: harnessAdapter.agentExt ?? undefined,
        agentRel: (n: string) => harnessAdapter.agentRel(n),
        skillRel: (n: string, agents: readonly string[]) =>
          harnessAdapter.skillRel(n, agents),
        agents: resolveNames(
          'agent',
          tree,
          null,
          harnessAdapter.agentExt ?? undefined,
        ),
        ...(harnessAdapter.scopedRel
          ? { scopedRel: harnessAdapter.scopedRel }
          : {}),
        maxLines: REPORT_LINES,
      });
      reports.push(report);
      log(
        `${kind} — ${names.length} name(s) [${names.join(', ') || '-'}], ${report.compared} rendered file(s) compared`,
      );
      for (const line of formatDrift(report)) {
        log(line);
      }
    }

    const v = driftVerdict(reports);
    if (v.stale + v.absent === 0) {
      log(
        v.foreign > 0
          ? `DEPLOYED TREE IS IN SYNC with the render tree (${v.foreign} unrendered artifact(s) reported above, none of them a defect).`
          : 'DEPLOYED TREE IS IN SYNC with the render tree.',
      );
      return DEPLOY_CHECK_EXIT.inSync;
    }
    log(
      `DRIFT: ${v.stale} stale, ${v.absent} absent (+${v.foreign} foreign) — this host is NOT running what the corpus renders.`,
    );
    // RELAYED VERBATIM INTO AN AGENT'S CONTEXT by the SessionStart drift
    // advisory, so this line is a command someone runs on the strength of
    // reading it. A stale program name here is a repair instruction that fails.
    log(`  Repair: re-run \`${CLI_BIN} project\`, then \`${CLI_BIN} deploy\`.`);
    return v.rc;
  } catch (e) {
    // THE THIRD CODE, and the whole reason it exists. This branch is reached when
    // the check could not run — an unknown harness, an unreadable scope, a tree
    // that is not one. Returning `drift` here would report a crash as a stale
    // host: a fabricated verdict, relayed by every caller that trusts the code.
    fail((e as Error).message);
    return DEPLOY_CHECK_EXIT.noVerdict;
  }
}
