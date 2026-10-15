// ─────────────────────────────────────────────────────────────────────────────
// The ledger runtime CAPABILITY — the record of a project's work: each story
// and task in flight, how each ended, merged or dropped, and what each cost in
// agent runs by role, tokens and elapsed time, taken from what the harness saw.
// Reached via `cratylus ledger <verb>`; `main.ts` routes it to
// {@link dispatchLedger}. Its entries are kept in the tracked, branch-versioned
// ledger `design/ledger/` (`store.ts`); the harness's own dispatches and returns
// reach it through `cratylus lifecycle` (`../../lifecycle/`).
//
// What another reader needs of the ledger is exported here: the work in flight
// and ended (`workIn`), which the context overview tells and which makes a
// done story's examples history, and the cuts its history records integrated,
// which keep a decision recorded about such a cut deprecated, and that cut's
// examples history, in the concept journal.
// ─────────────────────────────────────────────────────────────────────────────

import type { ReadPast } from '../concepts/journal.js';
import { type Work, foldWork } from './fold.js';
import { topOf } from './git.js';
import { ledgerAt } from './store.js';

export { LEDGER, VERBS, dispatchLedger } from './dispatch.js';
export {
  type Cost,
  type Ending,
  type Story,
  type Task,
  type Work,
  foldWork,
} from './fold.js';
export {
  LEDGER_DIR,
  LIFECYCLE_KINDS,
  type LedgerDraft,
  type LedgerEntry,
  OUTCOMES,
  type Outcome,
} from './store.js';

/** The work the ledger of the repository holding `from` records, measured to
 *  now; the cuts its history records integrated; and the entries of kinds this
 *  runtime does not know, read past. */
export function workIn(
  from: string,
  refuse: (message: string) => Error = (m) => new Error(m),
): {
  readonly work: Work;
  readonly integratedCuts: ReadonlySet<string>;
  readonly readPast: ReadPast;
} {
  const top = topOf(from);
  if (top === undefined)
    throw refuse(
      `${from} is not inside a git repository; the ledger is kept in one`,
    );
  const { entries, integratedCuts, readPast } = ledgerAt(top, refuse).read();
  return {
    work: foldWork(entries, Date.now()),
    integratedCuts,
    readPast,
  };
}
