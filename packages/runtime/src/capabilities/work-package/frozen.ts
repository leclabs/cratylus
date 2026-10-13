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
// never frozen by implication (decision 0125). Only the architect the cut
// records for a context changes the examples and concepts the cut freezes
// there, and only the cut's lead and its check-writer its checks (decision
// 0160): a rule held by review and by the record, never refused (decision 0143).
//
// Beside what it freezes, the view says which of the cut's visible examples no
// frozen check binds (`unchecked`).
// ─────────────────────────────────────────────────────────────────────────────

import { EXAMPLES_DIR } from '../concepts/leakage.js';
import { unbound } from './bindings.js';
import { cutAt } from './cut.js';
import { foldCut } from './fold.js';
import type { LedgerEntry } from './ledger.js';
import type { Files } from './recorded.js';

/** Where the cuts' judgments are, relative to the top of the repository. */
export const JUDGMENT_DIR = 'design/judgment';

/** One frozen cut: what it freezes, and the architect who alone may change
 *  its examples and concepts, for each of its contexts (its checks are the
 *  lead's and the check-writer's). Paths are from the top of the repository; a
 *  path ending in `/` is a folder, everything under which is frozen. */
export interface FrozenCut {
  readonly cut: string;
  readonly architects: Readonly<Record<string, string>>;
  /** For each context: its examples and its held-out example text. */
  readonly examples: readonly string[];
  /** The checks its freeze acts name, held-out checks included. */
  readonly checks: readonly string[];
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
    const { record, integrated, frozenChecks } = foldCut(entries, name);
    if (record === undefined || integrated) return [];
    const missing = record.contexts
      .map((context) => `${EXAMPLES_DIR}/${context}/${name}.md`)
      .filter((path) => !files.kept(path));
    if (missing.length > 0)
      throw refuse(
        `the frozen cut '${name}' has its examples file ${missing.join(', ')} missing from the working copy`,
      );
    const cut = cutAt(files, name, refuse);
    return [
      {
        cut: name,
        architects: record.architects ?? {},
        examples: record.contexts.flatMap((context) => [
          `${EXAMPLES_DIR}/${context}/${name}.md`,
          `${JUDGMENT_DIR}/${context}/${name}.md`,
        ]),
        checks: frozenChecks,
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
