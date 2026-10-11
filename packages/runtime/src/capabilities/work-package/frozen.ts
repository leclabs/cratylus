// ─────────────────────────────────────────────────────────────────────────────
// What is FROZEN: every cut opened and not integrated, and what it freezes,
// computed from the ledger and the cut's visible examples on every request.
//
// A cut is frozen from its `open` until its `integrate`. For each of its
// contexts it freezes its examples `design/examples/<context>/<cut>.md`, its
// judgment `design/judgment/<context>/<cut>.md` and everything under
// `design/judgment/<context>/<cut>/`; the checks frozen with it; and each
// concept its examples name, in its own context. Only the architect the cut
// records for a context may change what the cut freezes there.
// ─────────────────────────────────────────────────────────────────────────────

import { EXAMPLES_DIR } from '../concepts/leakage.js';
import { cutAt } from './cut.js';
import { foldCut } from './fold.js';
import type { LedgerEntry } from './ledger.js';

/** Where the cuts' judgments are, relative to the top of the repository. */
export const JUDGMENT_DIR = 'design/judgment';

/** One frozen cut: what it freezes, and the architect who alone may change
 *  it, for each of its contexts. Paths are from the top of the repository; a
 *  path ending in `/` is a folder, everything under which is frozen. */
export interface FrozenCut {
  readonly cut: string;
  readonly architects: Readonly<Record<string, string>>;
  /** For each context: its examples, its judgment and its judgment folder. */
  readonly examples: readonly string[];
  /** The checks frozen with it. */
  readonly checks: readonly string[];
  /** Each concept its examples name, in its own context. */
  readonly concepts: readonly {
    readonly context: string;
    readonly name: string;
  }[];
}

/** Every cut `entries`, the ledger of the repository at `top`, records as
 *  opened and not integrated, in the order opened, with what it freezes.
 *  Throws, worded by `refuse`, when a frozen cut has no visible examples. */
export function frozenIn(
  top: string,
  entries: readonly LedgerEntry[],
  refuse: (message: string) => Error,
): FrozenCut[] {
  const opened = new Set(
    entries.flatMap((e) => (e.kind === 'cut' ? [e.cut] : [])),
  );
  return [...opened].flatMap((name): FrozenCut[] => {
    const { record, integrated, frozenChecks } = foldCut(entries, name);
    if (record === undefined || integrated) return [];
    return [
      {
        cut: name,
        architects: record.architects ?? {},
        examples: record.contexts.flatMap((context) => [
          `${EXAMPLES_DIR}/${context}/${name}.md`,
          `${JUDGMENT_DIR}/${context}/${name}.md`,
          `${JUDGMENT_DIR}/${context}/${name}/`,
        ]),
        checks: frozenChecks,
        concepts: cutAt(top, name, refuse).concepts.map((c) => ({
          context: c.context,
          name: c.name,
        })),
      },
    ];
  });
}
