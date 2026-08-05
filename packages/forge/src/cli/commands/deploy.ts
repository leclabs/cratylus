// `cratylus deploy` — place an already-projected render tree (agents/ +
// skills/) into the LOCAL `.claude/` root. The deploy half of the
// projection↔deploy self-binding (the projection is `forge`
// claude-adapter output; this lands it locally).
//
// Local-only by construction: installing the packages on a host is npm's job,
// and iterating hosts is the operator's outer loop around the whole pipeline.
// Neither is a stage, so neither is here.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import pc from 'picocolors';
import { adapterByName } from '../../adapters/registry/index.js';
import { loadAgentsConfig } from '../../config/index.js';
import { CONFIG_FILE } from '../../config/scaffold.js';
import {
  type DeployKind,
  type RenderTree,
  type Scope,
  type SkillCompanions,
  deploySingle,
  emitRuntimeConfig,
  projectScope,
  resolveNames,
  userScope,
} from '../../deploy/index.js';
import { type DriftReport, auditLocal } from '../../deploy/local.js';

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
  /** Harness name (`claude` | `codex`); decides WHICH home the tree lands in. */
  harness?: string | null;
  // Target — the local harness root the scope resolves to.
  home?: string | null;
  project?: string | null;
  only?: string | null;
  dryRun?: boolean;
  /** REPORT ONLY: compare the deployed tree against the render tree and print
   *  every divergence. Places nothing, prunes nothing, repairs nothing. */
  check?: boolean;
  /** Sink for the report (tests, and any caller that is not a terminal). */
  log?: (line: string) => void;
  /**
   * Path to `agents.config.ts` — read for ONE fact deploy cannot obtain from a
   * render tree: the corpus's lifecycle-event vocabulary (`AgentPlugin.events`).
   *
   * The tree is a directory of already-rendered bytes; a vocabulary is not in it.
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

export async function runDeploy(opts: DeployCmdOpts): Promise<number> {
  if (opts.check) {
    return runDeployCheck(opts);
  }
  // WHICH harness's home the tree lands in. Resolved by NAME through the same
  // registry `project` uses, so `deploy --harness codex` and `project --harness
  // codex` cannot disagree about where codex lives. Unknown name fails loudly
  // here rather than silently deploying into `.claude`.
  const harnessAdapter = adapterByName(opts.harness ?? 'claude');
  const tree: RenderTree = {
    agentsDir: opts.agentsDir,
    skillsDir: opts.skillsDir,
    hooksDir: opts.hooksDir,
    companions: opts.companions,
  };
  const log = opts.log ?? ((line: string) => console.log(line));
  const warn = (line: string) => console.error(line);

  // Expand the `all` sugar to the concrete kinds; a single kind runs a
  // one-element loop. Every kind reuses the EXISTING per-kind engine path with
  // IDENTICAL target opts. The overall rc is the first non-zero kind's rc.
  const kinds: readonly DeployKind[] =
    opts.kind === 'all' ? ALL_KINDS : [opts.kind];

  try {
    let rc = 0;
    for (const kind of kinds) {
      const r = deploySingle({
        kind,
        scope: opts.scope,
        tree,
        harnessHome: harnessAdapter.home,
        agentExt: harnessAdapter.agentExt,
        hooksFile: harnessAdapter.hooksFile,
        home: opts.home ?? null,
        project: opts.project ?? null,
        only: splitList(opts.only),
        dry: opts.dryRun ?? false,
        log,
        warn,
      });
      if (r.rc !== 0 && rc === 0) {
        rc = r.rc;
      }
    }
    await emitHostRuntimeConfig(opts, harnessAdapter.nativeEvents, log, warn);
    return rc;
  } catch (e) {
    console.error(pc.red(`cratylus deploy: ${(e as Error).message}`));
    return 1;
  }
}

/**
 * Emit the host runtime config — ARCHITECTURE property 4's producer.
 *
 * The corpus's vocabulary reaches the projector as DATA on the plugin (property 3)
 * and the harness's native map comes off the adapter, so this step decides nothing
 * and carries two facts it was handed. It runs once per deploy invocation, not once
 * per kind: the config is a property of the corpus and the harness, not of whether
 * agents or skills were the thing being placed.
 *
 * A MISSING CONFIG FILE IS A WARNING, NOT A FAILURE. `deploy` is reachable with a
 * bare render tree and no corpus in sight (that is what `--agents-dir` is for), and
 * refusing the whole deploy over a step that did not apply would be a refusal where
 * the shortfall is legible. It warns and names exactly what the host will lack.
 */
async function emitHostRuntimeConfig(
  opts: DeployCmdOpts,
  nativeEvents: Readonly<Record<string, string>>,
  log: (line: string) => void,
  warn: (line: string) => void,
): Promise<void> {
  const configPath =
    opts.config ?? join(opts.project ?? process.cwd(), CONFIG_FILE);
  if (!existsSync(configPath)) {
    warn(
      `  runtime config: no ${CONFIG_FILE} at ${configPath} — the corpus's event vocabulary is unavailable, so the host config was NOT emitted and runtime capabilities on this host cannot validate an event name`,
    );
    return;
  }
  const config = await loadAgentsConfig(configPath);
  const events = [...new Set(config.extends.flatMap((p) => p.events ?? []))];
  if (events.length === 0) {
    warn(
      `  runtime config: ${CONFIG_FILE} extends no plugin declaring \`events\` — the host config was NOT emitted`,
    );
    return;
  }
  const { path, wrote, doc } = emitRuntimeConfig({
    events,
    nativeEvents,
    dry: opts.dryRun ?? false,
  });
  log(
    `  runtime config${wrote ? '' : ' (dry-run)'}: ${path} — ` +
      `${doc.events.vocabulary.length} event(s), ` +
      `${Object.keys(doc.events.native).length} with a native peer`,
  );
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
    rc: stale + absent > 0 ? 1 : 0,
  };
}

/** Compare the deployed tree against the render tree; report, change nothing. */
export function runDeployCheck(opts: DeployCmdOpts): number {
  const log = opts.log ?? ((line: string) => console.log(line));
  const harnessAdapter = adapterByName(opts.harness ?? 'claude');
  const tree: RenderTree = {
    agentsDir: opts.agentsDir,
    skillsDir: opts.skillsDir,
    hooksDir: opts.hooksDir,
    companions: opts.companions,
  };
  const kinds: readonly DeployKind[] =
    opts.kind === 'all' ? ALL_KINDS : [opts.kind];
  try {
    // Same scope resolution the deploy path uses, so a check and the deploy it
    // audits can never be looking at two different roots.
    const scopeRes =
      opts.scope === 'project'
        ? projectScope(opts.project ?? null, harnessAdapter.home ?? undefined)
        : userScope(opts.home ?? null, harnessAdapter.home ?? undefined);
    const harnessDir = scopeRes.harnessDir;
    log(
      `=== deploy CHECK (reports only, changes nothing) -> ${harnessDir} ===`,
    );

    const reports: DriftReport[] = [];
    for (const kind of kinds) {
      const names = resolveNames(
        kind,
        tree,
        splitList(opts.only),
        harnessAdapter.agentExt ?? undefined,
      );
      const report = auditLocal(harnessDir, kind, tree, names, {
        agentExt: harnessAdapter.agentExt ?? undefined,
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
      return 0;
    }
    log(
      pc.red(
        `DRIFT: ${v.stale} stale, ${v.absent} absent (+${v.foreign} foreign) — this host is NOT running what the corpus renders.`,
      ),
    );
    log('  Repair: re-run `cratylus project`, then `cratylus deploy`.');
    return v.rc;
  } catch (e) {
    console.error(pc.red(`cratylus deploy --check: ${(e as Error).message}`));
    return 1;
  }
}
