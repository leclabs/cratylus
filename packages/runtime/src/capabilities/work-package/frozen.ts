// ─────────────────────────────────────────────────────────────────────────────
// What is FROZEN: every cut opened and not integrated, and what it freezes,
// computed from the ledger and the record on every request (`recorded.ts`:
// the branch's recorded tip, the working copy only for what it has recorded
// nothing of, decisions 0132, 0134).
//
// A cut is frozen from its `open` until its `integrate`. For each of its
// contexts it freezes, from its `open`, its examples
// `design/examples/<context>/<cut>.md` and its held-out example text
// `design/judgment/<context>/<cut>.md`, and each concept its examples name, in
// its own context. It freezes the checks its `freeze` acts name, a held-out
// check among them only once a freeze act names it: its judgment folder is
// never frozen by implication (decision 0125). It freezes the files its frozen
// checks use (`uses.ts`). Only the architect the cut records for a context may
// change what the cut freezes there.
//
// Beside what it freezes, the view says which of the cut's visible examples no
// frozen check binds (`unchecked`): a builder is not dispatched while one it owns
// is among them (decision 0128).
// ─────────────────────────────────────────────────────────────────────────────

import { EXAMPLES_DIR } from '../concepts/leakage.js';
import { cutAt } from './cut.js';
import { foldCut } from './fold.js';
import type { LedgerEntry } from './ledger.js';
import type { Files } from './recorded.js';
import { unbound, usedBy } from './uses.js';

/** Where the cuts' judgments are, relative to the top of the repository. */
export const JUDGMENT_DIR = 'design/judgment';

/** One frozen cut: what it freezes, and the architect who alone may change
 *  it, for each of its contexts. Paths are from the top of the repository; a
 *  path ending in `/` is a folder, everything under which is frozen. */
export interface FrozenCut {
  readonly cut: string;
  readonly architects: Readonly<Record<string, string>>;
  /** For each context: its examples and its held-out example text. */
  readonly examples: readonly string[];
  /** The checks its freeze acts name, held-out checks included. */
  readonly checks: readonly string[];
  /** The files its frozen checks use: reached by their relative imports,
   *  transitively, and no output of a work package of the cut. */
  readonly uses: readonly string[];
  /** Its visible examples, as `<context>/<number>`, that no frozen check names. */
  readonly unchecked: readonly string[];
  /** Each concept its examples name, in its own context. */
  readonly concepts: readonly {
    readonly context: string;
    readonly name: string;
  }[];
}

/** Every cut `entries`, a ledger, records as opened and not integrated, in the
 *  order opened, with what it freezes as `files`, the record, hold it.
 *  Throws, worded by `refuse`, when a frozen cut has no visible examples, or
 *  the working copy lacks one of its examples files. */
export function frozenIn(
  files: Files,
  entries: readonly LedgerEntry[],
  refuse: (message: string) => Error,
): FrozenCut[] {
  const opened = new Set(
    entries.flatMap((e) => (e.kind === 'cut' ? [e.cut] : [])),
  );
  return [...opened].flatMap((name): FrozenCut[] => {
    const { record, integrated, frozenChecks, packages } = foldCut(
      entries,
      name,
    );
    if (record === undefined || integrated) return [];
    const missing = record.contexts
      .map((context) => `${EXAMPLES_DIR}/${context}/${name}.md`)
      .filter((path) => !files.kept(path));
    if (missing.length > 0)
      throw refuse(
        `the frozen cut '${name}' has its examples file ${missing.join(', ')} missing from the working copy`,
      );
    const cut = cutAt(files, name, refuse);
    const outputs = [...packages.values()].flatMap((p) => p.outputs);
    return [
      {
        cut: name,
        architects: record.architects ?? {},
        examples: record.contexts.flatMap((context) => [
          `${EXAMPLES_DIR}/${context}/${name}.md`,
          `${JUDGMENT_DIR}/${context}/${name}.md`,
        ]),
        checks: frozenChecks,
        uses: usedBy(files, frozenChecks, outputs),
        unchecked: unbound(
          files,
          frozenChecks,
          cut.examples.map((e) => e.ref),
        ),
        concepts: cut.concepts.map((c) => ({
          context: c.context,
          name: c.name,
        })),
      },
    ];
  });
}
