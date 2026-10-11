// ─────────────────────────────────────────────────────────────────────────────
// The workPackage runtime CAPABILITY — a cut's work packages, their dependency
// graph, the builders' commits and the cut's counts, reached via
// `cratylus workPackage <verb> --cut <name>` — and the LEDGER it keeps, read by
// the harness's own seams.
//
// Ships INSIDE the runtime, beside `concepts`: `main.ts` routes
// `workPackage <verb>` to {@link dispatchWorkPackage}. The cut's entries are
// kept in the tracked, branch-versioned ledger `design/ledger/`; its efficiency
// figures are recorded in the concept journal.
//
// THE LEDGER API. What a harness binding (the omp extension's builder dispatch
// check) or another package (forge, the context overview) needs of the ledger
// is exported here and from the `@cratylus/runtime` barrel, so it is reached
// in-process; the same facts are reached out of process through the CLI:
//   cutView(from, cut)   ≡ `cratylus workPackage state|inventory --cut <cut>`:
//                          the ledger fold (record, phase, statuses), readiness,
//                          served concepts and owned examples, and what the
//                          ledger read past
//   cutsInLedger(from)   every recorded cut with its branch, contexts and
//                        phase, and what the ledger read past
//   foldCut(entries,cut) the pure fold, over entries already read
//   readCut(cut, pkgs)   the pure reading: served concepts and owned examples
//   appendLifecycle      ≡ `cratylus lifecycle '<json>'` (`../../lifecycle/`)
// ─────────────────────────────────────────────────────────────────────────────

import type { ReadPast } from '../concepts/journal.js';
import { type Cut, cutAt } from './cut.js';
import { type CutState, foldCut } from './fold.js';
import { topOf } from './git.js';
import { ledgerAt } from './ledger.js';
import { type CutReading, readCut } from './reading.js';

export { dispatchWorkPackage } from './dispatch.js';
export type { Cut, CutConcept, CutExample } from './cut.js';
export {
  type CutPhase,
  type CutRecord,
  type CutState,
  type Figures,
  type PackageStatus,
  type Round,
  type WorkPackage,
  foldCut,
} from './fold.js';
export {
  type CommitRecord,
  type ConceptVerdict,
  LEDGER_DIR,
  LIFECYCLE_KINDS,
  type LedgerDraft,
  type LedgerEntry,
} from './ledger.js';
export {
  type CutReading,
  type OwnedExample,
  type ServedConcept,
  readCut,
} from './reading.js';

/** A cut as its ledger and its visible examples make it, computed now, with
 *  the ledger's entries of kinds this runtime does not know, read past. */
export interface CutView {
  readonly cut: Cut;
  readonly state: CutState;
  readonly reading: CutReading;
  readonly readPast: ReadPast;
}

/** The top of the git working tree holding `from`; refuses outside one. */
function topFrom(from: string, refuse: (message: string) => Error): string {
  const top = topOf(from);
  if (top === undefined)
    throw refuse(
      `${from} is not inside a git repository; the ledger is kept in one`,
    );
  return top;
}

/** Cut `name` of the repository holding `from`: its visible examples, its
 *  ledger fold (record, phase, package statuses, ready packages, figures,
 *  report) and the reading of it by its packages (served concepts, owned
 *  examples, dependency graph). Throws, worded by `refuse`, when the cut has
 *  no visible examples or the ledger cannot be read. */
export function cutView(
  from: string,
  name: string,
  refuse: (message: string) => Error = (m) => new Error(m),
): CutView {
  const top = topFrom(from, refuse);
  const cut = cutAt(top, name, refuse);
  const ledger = ledgerAt(top, refuse);
  const state = foldCut(ledger.entries(), name);
  return {
    cut,
    state,
    reading: readCut(cut, [...state.packages.values()]),
    readPast: ledger.readPast(),
  };
}

/** Every cut the ledger of the repository holding `from` records with `open`,
 *  in the order opened, with its branch, contexts and current phase, and the
 *  ledger's entries of kinds this runtime does not know, read past. */
export function cutsInLedger(
  from: string,
  refuse: (message: string) => Error = (m) => new Error(m),
): {
  readonly cuts: readonly {
    readonly cut: string;
    readonly branch: string;
    readonly contexts: readonly string[];
    readonly phase: CutState['phase'];
  }[];
  readonly readPast: ReadPast;
} {
  const ledger = ledgerAt(topFrom(from, refuse), refuse);
  const entries = ledger.entries();
  return {
    cuts: entries.flatMap((entry) =>
      entry.kind === 'cut'
        ? [
            {
              cut: entry.cut,
              branch: entry.branch,
              contexts: entry.contexts,
              phase: foldCut(entries, entry.cut).phase,
            },
          ]
        : [],
    ),
    readPast: ledger.readPast(),
  };
}
