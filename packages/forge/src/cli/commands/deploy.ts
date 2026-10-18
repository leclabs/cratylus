// `cratylus deploy` — place an already-projected render tree (agents/ + skills/ +
// hooks) on this machine. The deploy half of the projection↔deploy self-binding.
//
// AT USER SCOPE IT GOES THROUGH THE OWNED ROOT, as `install` does: the tree is placed
// whole as `~/.cratylus/<harness>`, with the version that projected it, the harness's
// own surfaces refer into it, and an earlier installation on those surfaces is taken
// back by its record. A user-scope deploy is therefore always the whole tree, every
// kind: `--kind` and `--only` narrow a project-scope deploy alone. At PROJECT scope the
// tree lands in the project's harness directory (`.omp/`), which the harness reads
// natively in that project alone.
//
// Local-only by construction: installing the packages on a host is npm's job,
// and iterating hosts is the operator's outer loop around the whole pipeline.
// Neither is a stage, so neither is here.

import { existsSync, statSync } from 'node:fs';
import { join, resolve as resolvePath } from 'node:path';
import type { AgentPlugin } from '@cratylus/schema';
import { adapterByName } from '../../adapters/registry/index.js';
import { CLI_BIN } from '../../bin-name.js';
import { loadConfig } from '../../config/index.js';
import { CONFIG_FILE } from '../../config/scaffold.js';
import type { HarnessAdapter } from '../../core/harness-adapter.js';
import { keepsHostModel } from '../../deploy/deploy.js';
import {
  DEPLOY_CHECK_EXIT,
  type DeliveredDocument,
  type DeployKind,
  type RenderTree,
  type Scope,
  type SkillCompanions,
  capabilityConfiguration,
  deploySingle,
  linkOwnedRoot,
  ownedRootIn,
  placeOwnedRoot,
  projectScope,
  readInstallationRecord,
  readRenderTree,
  resolveNames,
  rootFiles,
} from '../../deploy/index.js';
import { type DriftReport, auditLocal } from '../../deploy/local.js';
import { harnessDirIn } from '../../deploy/scope.js';
import { resolveSkills } from '../../project/resolve-skills.js';
import { fail as failLine, say, warn as warnLine } from '../style.js';
import { removeEarlierInstallation } from './uninstall.js';

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
  /** The corpus's plugin set, when the caller already holds it. Absent ⇒ read from
   *  `config`. */
  plugins?: readonly AgentPlugin[];
  /** The declared version of the build deploying, recorded in the owned root as the
   *  version that projected it (user scope). */
  version?: string;
  /** The documents the release delivers, handed in by the command that holds the
   *  release and placed read-only in the owned root as given (user scope). */
  delivered?: readonly DeliveredDocument[];
  dryRun?: boolean;
  /** REPORT ONLY: compare the deployed tree against the render tree and print
   *  every divergence. Places nothing, prunes nothing, repairs nothing. */
  check?: boolean;
  /** `--verbose`: also report the per-file detail of the run. */
  verbose?: boolean;
  /** The command this deploy runs in, named where an error says what to run again.
   *  Absent ⇒ `deploy`. */
  command?: 'deploy';
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
   * Path to `cratylus.config.ts` — read, when no `plugins` are supplied, for the one
   * fact deploy cannot obtain from a render tree: the capability configuration the
   * corpus's skills declare on their runtime faces, which a user-scope deploy writes
   * into the owned root. Absent or not there ⇒ none is written.
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
  /** How many items of an earlier installation a user-scope deploy took back (or,
   *  dry, would). */
  earlier: number;
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
    harness: opts.harness ?? 'omp',
    harnessDir: '',
    dry: opts.dryRun ?? false,
    placed: [],
    pruned: 0,
    unregistered: 0,
    unaccounted: 0,
    earlier: 0,
  };
  try {
    const kinds = kindsOf(opts.kind);
    assertRenderDirs(opts, kinds);
    // WHICH harness's home the tree lands in. Resolved by NAME through the same
    // registry `project` uses, so `deploy --harness <name>` and `project --harness
    // <name>` cannot disagree about where that harness lives. Unknown name fails
    // loudly here rather than silently deploying into another harness.
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
    if (opts.scope === 'user') {
      return await deployOwned(opts, outcome, harnessAdapter, tree, log);
    }
    const scopeRes = projectScope(
      opts.project ?? null,
      harnessAdapter.home ?? undefined,
    );
    outcome.harnessDir = scopeRes.harnessDir;

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
    }
    return outcome;
  } catch (e) {
    fail((e as Error).message);
    return { ...outcome, rc: 1 };
  }
}

/**
 * A user-scope deploy: the render tree placed WHOLE as the owned root, as `install`
 * places one — the earlier installation taken back by its record, the harness's own
 * surfaces referring into the root, the version and the capability configuration
 * recorded in it, and the practices and host edits the installation it replaces
 * recorded carried over.
 */
async function deployOwned(
  opts: DeployCmdOpts,
  outcome: DeployOutcome,
  adapter: HarnessAdapter,
  tree: RenderTree,
  log: (line: string) => void,
): Promise<DeployOutcome> {
  if (opts.kind !== 'all' || opts.only) {
    throw new Error(
      `a user-scope deploy places the whole tree as ${ownedRootIn(adapter, opts.home)}, so --kind and --only narrow a project-scope deploy alone; drop them, or pass --scope project`,
    );
  }
  const dry = outcome.dry;
  const root = ownedRootIn(adapter, opts.home);
  const harnessDir = harnessDirIn(adapter, opts.home);
  outcome.harnessDir = root;
  const earlier = removeEarlierInstallation(adapter, {
    ...(opts.home ? { home: opts.home } : {}),
    dryRun: dry,
  });
  outcome.earlier = earlier?.removed.length ?? 0;
  for (const r of earlier?.removed ?? []) log(`earlier: ${r.what}`);
  const prior = readInstallationRecord(root);
  const linked = linkOwnedRoot({ adapter, harnessDir, root, prior, dry });
  for (const l of linked.left) throw new Error(`${l.what}: ${l.why}`);
  const files = rootFiles(adapter, readRenderTree(tree));
  let plugins = opts.plugins;
  const configPath =
    opts.config ?? join(opts.project ?? process.cwd(), CONFIG_FILE);
  if (plugins === undefined && existsSync(configPath))
    plugins = (await loadConfig(configPath)).extends;
  const placed = placeOwnedRoot({
    adapter,
    root,
    files,
    ...(opts.version === undefined ? {} : { version: opts.version }),
    ...(opts.delivered === undefined ? {} : { delivered: opts.delivered }),
    configuration:
      plugins === undefined
        ? {}
        : capabilityConfiguration(
            (await resolveSkills(plugins)).map((s) => s.skill),
          ),
    record: {
      ...(prior?.practices === undefined ? {} : { practices: prior.practices }),
      references: linked.references,
      ...(prior?.answered === undefined ? {} : { answered: prior.answered }),
    },
    dry,
  });
  for (const file of placed.files) log(`${root}/${file}`);
  const count = (dir: string, depth: number) =>
    new Set(
      files
        .filter((f) => f.path.startsWith(`${dir}/`))
        .map((f) => f.path.split('/').slice(0, depth).join('/')),
    ).size;
  outcome.placed.push(
    { kind: 'agent', count: count('agents', 2) },
    { kind: 'skill', count: count('skills', 2) },
    { kind: 'hooks', count: count('hooks', 2) },
  );
  return outcome;
}

/** A deploy's report, as lines: what was placed and where, what was pruned or taken
 *  back, and the next step. Per-file detail is `--verbose`'s. */
function summarize(outcome: DeployOutcome): string[] {
  const { dry, harness, harnessDir } = outcome;
  const placed = outcome.placed
    .map((p) => plural(p.count, KIND_NOUN[p.kind]))
    .join(', ');
  const lines = [
    `${dry ? 'would deploy' : 'deployed'} ${placed} to ${harness} (${harnessDir})`,
  ];
  if (outcome.earlier > 0) {
    lines.push(
      `${dry ? 'would take back' : 'took back'} the earlier installation (${plural(outcome.earlier, 'item')})`,
    );
  }
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
    const harnessAdapter = adapterByName(opts.harness ?? 'omp');
    // Same scope resolution the deploy path uses, so a check and the deploy it
    // audits can never be looking at two different roots.
    const harnessDir =
      opts.scope === 'project'
        ? projectScope(opts.project ?? null, harnessAdapter.home ?? undefined)
            .harnessDir
        : ownedRootIn(harnessAdapter, opts.home);
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
    // A command someone runs on the strength of reading it: a stale program name
    // here is a repair instruction that fails.
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
