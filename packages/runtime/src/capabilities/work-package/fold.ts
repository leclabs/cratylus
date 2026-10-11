// ─────────────────────────────────────────────────────────────────────────────
// The LEDGER FOLD: a cut's state, computed from its ledger entries on every
// request and never stored. Pure: entries in, state out.
//
// WORK PACKAGE STATUS, from the harness's builder events and the assayers'
// verdicts since the package's latest builder dispatch:
//   submitted  never dispatched
//   dispatched its latest builder event is a dispatch (a failing package's
//              builder dispatched again is back here)
//   returned   its builder returned, and it is not judged approved, failing or
//              disputed: fewer than two assayers' latest verdicts, all passing,
//              stay here (unapproved)
//   approved   at least two distinct assayers have a latest verdict on it, and
//              every assayer's latest verdict passes
//   failing    every assayer's latest verdict on it has a finding: returned to
//              build
//   disputed   the assayers' latest verdicts disagree: unapproved, a meaning
//              question for the architect
// An agent's own account never moves a status: only `dispatched`, `returned`
// and `verdict` entries, written from the harness's events, do.
//
// CUT PHASE: `open` (recorded or sliced, nothing dispatched) → `in flight` (from
// the first `dispatched` of any role) → `complete` (every work package
// approved).
//
// READY: the work packages not yet dispatched whose every dependency is
// `returned` or `approved`.
//
// ROUNDS: each whole-check run is the run of its own round: run n closes round
// n. A round RESOLVES the failures of the previous run absent from its own, and
// makes NO PROGRESS when the previous run had failures and it resolves none.
//
// EFFICIENCY: one agent run per `returned` entry, in total and by role; tokens
// summed over the returns that report them (`null` when none do); rounds and
// whole-check runs from the `check` entries; the no-progress rounds.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  CommitRecord,
  ConceptVerdict,
  LedgerEntry,
  PackageFields,
} from './ledger.js';

/** Where a work package stands. */
export type PackageStatus =
  | 'submitted'
  | 'dispatched'
  | 'returned'
  | 'approved'
  | 'failing'
  | 'disputed';

/** Where a cut stands. */
export type CutPhase = 'open' | 'in flight' | 'complete';

/** A work package as the fold computes it. */
export interface WorkPackage extends PackageFields {
  readonly name: string;
  readonly status: PackageStatus;
}

/** One round, closed by its whole-check run. */
export interface Round {
  readonly round: number;
  readonly wholeCheckRuns: 1;
  readonly failures: readonly string[];
  readonly resolved: readonly string[];
  readonly noProgress: boolean;
}

/** A cut's efficiency figures. */
export interface Figures {
  readonly agentRuns: {
    readonly total: number;
    readonly byRole: Readonly<Record<string, number>>;
  };
  readonly rounds: number;
  readonly wholeCheckRuns: number;
  readonly tokens: number | null;
  readonly noProgressRounds: readonly number[];
}

/** The cut's record, as `open` wrote it. */
export interface CutRecord {
  readonly branch: string;
  readonly contexts: readonly string[];
  readonly architects: Readonly<Record<string, string>>;
}

/** A cut's state, folded from its ledger entries. */
export interface CutState {
  readonly cut: string;
  /** The cut's record, when it was opened. */
  readonly record: CutRecord | undefined;
  readonly phase: CutPhase;
  /** Each work package by name, in the order submitted. */
  readonly packages: ReadonlyMap<string, WorkPackage>;
  /** The names of the packages ready to dispatch, in the order submitted. */
  readonly ready: readonly string[];
  /** The commits made as each package's, in the order made. */
  readonly histories: ReadonlyMap<string, readonly CommitRecord[]>;
  readonly rounds: readonly Round[];
  readonly figures: Figures;
  /** The lead's latest reported deliverable, or `null`. */
  readonly report: unknown;
}

/** The status of a returned package from the assayers' latest verdicts on it. */
function judged(latest: ReadonlyMap<string, ConceptVerdict[]>): PackageStatus {
  const passes = [...latest.values()].map((verdicts) =>
    verdicts.every((v) => v.passes && v.finding === undefined),
  );
  if (passes.length === 0) return 'returned';
  if (passes.every((p) => !p)) return 'failing';
  if (passes.some((p) => !p)) return 'disputed';
  return passes.length >= 2 ? 'approved' : 'returned';
}

/** The state of cut `cut` folded from `entries`, every cut's, in ledger order. */
export function foldCut(
  entries: readonly LedgerEntry[],
  cut: string,
): CutState {
  const fields = new Map<string, PackageFields>();
  const histories = new Map<string, CommitRecord[]>();
  /** Each package's latest builder event, and the verdicts since its latest
   *  dispatch: per assayer, that assayer's latest verdicts on it. */
  const builder = new Map<string, 'dispatched' | 'returned'>();
  const verdicts = new Map<string, Map<string, ConceptVerdict[]>>();
  const checks: (readonly string[])[] = [];
  const runs: { role: string; tokens: number | undefined }[] = [];
  let record: CutRecord | undefined;
  let dispatched = false;
  let report: unknown = null;

  for (const entry of entries) {
    if (entry.cut !== cut) continue;
    switch (entry.kind) {
      case 'cut': {
        const recorded: object = entry;
        const earlier =
          'meaningHolders' in recorded ? recorded.meaningHolders : undefined;
        record = {
          branch: entry.branch,
          contexts: entry.contexts,
          architects: entry.architects ?? (earlier as CutRecord['architects']),
        };
        break;
      }
      case 'submit': {
        const { outputs, concepts, dependsOn, needs } = entry;
        fields.set(entry.workPackage, { outputs, concepts, dependsOn, needs });
        histories.set(entry.workPackage, []);
        break;
      }
      case 'update': {
        const current = fields.get(entry.workPackage);
        if (current !== undefined)
          fields.set(entry.workPackage, { ...current, ...entry.changes });
        break;
      }
      case 'commit':
        histories.get(entry.workPackage)?.push(entry.commit);
        break;
      case 'check':
        checks.push(entry.failures);
        break;
      case 'dispatched':
        dispatched = true;
        if (entry.workPackage !== undefined) {
          builder.set(entry.workPackage, 'dispatched');
          verdicts.set(entry.workPackage, new Map());
        }
        break;
      case 'returned':
        runs.push({ role: entry.role, tokens: entry.tokens });
        if (entry.workPackage !== undefined)
          builder.set(entry.workPackage, 'returned');
        break;
      case 'verdict': {
        const byPackage = new Map<string, ConceptVerdict[]>();
        for (const v of entry.verdicts)
          byPackage.set(v.workPackage, [
            ...(byPackage.get(v.workPackage) ?? []),
            v,
          ]);
        for (const [name, own] of byPackage) {
          const latest = verdicts.get(name) ?? new Map();
          latest.set(entry.assayer, own);
          verdicts.set(name, latest);
        }
        break;
      }
      case 'reported':
        report = entry.report;
        break;
    }
  }

  const packages = new Map<string, WorkPackage>();
  for (const [name, own] of fields) {
    const event = builder.get(name);
    const status: PackageStatus =
      event === undefined
        ? 'submitted'
        : event === 'dispatched'
          ? 'dispatched'
          : judged(verdicts.get(name) ?? new Map());
    packages.set(name, { name, ...own, status });
  }
  const finished = (name: string) => {
    const status = packages.get(name)?.status;
    return status === 'returned' || status === 'approved';
  };
  const ready = [...packages.values()]
    .filter((p) => p.status === 'submitted' && p.dependsOn.every(finished))
    .map((p) => p.name);
  const all = [...packages.values()];
  const phase: CutPhase =
    all.length > 0 && all.every((p) => p.status === 'approved')
      ? 'complete'
      : dispatched
        ? 'in flight'
        : 'open';

  const rounds: Round[] = checks.map((failures, i) => {
    const previous = checks[i - 1] ?? [];
    const resolved = previous.filter((f) => !failures.includes(f));
    return {
      round: i + 1,
      wholeCheckRuns: 1,
      failures,
      resolved,
      noProgress: previous.length > 0 && resolved.length === 0,
    };
  });
  const byRole: Record<string, number> = {};
  for (const { role } of runs) byRole[role] = (byRole[role] ?? 0) + 1;
  const carried = runs.flatMap((r) =>
    r.tokens === undefined ? [] : [r.tokens],
  );
  const figures: Figures = {
    agentRuns: { total: runs.length, byRole },
    rounds: checks.length,
    wholeCheckRuns: checks.length,
    tokens: carried.length === 0 ? null : carried.reduce((a, b) => a + b, 0),
    noProgressRounds: rounds.filter((r) => r.noProgress).map((r) => r.round),
  };

  return {
    cut,
    record,
    phase,
    packages,
    ready,
    histories,
    rounds,
    figures,
    report,
  };
}
