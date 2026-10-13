// ─────────────────────────────────────────────────────────────────────────────
// A CUT as the work package capability reads it: identified by its NAME alone,
// across contexts. Its visible examples are every
// `design/examples/<context>/<name>.md`, read the way the concept journal reads
// visible examples (a line `N. ...` opens example N); its CONTEXTS are those
// contexts. An example is referenced as `<context>/<n>`. They are read from the
// files given: the working copy, or, for what is frozen, the record
// (`recorded.ts`).
//
// An example's CONCEPTS are the comma-separated names in the parenthesis that
// opens its text, `12. (whole check, efficiency) **Given** ...`, each a concept
// of the example's own context; the cut's concepts are every concept its
// visible examples name, per context, in the order first named. A shared cut
// never merges its contexts' models or example sets. Nothing else of the design
// is read.
// ─────────────────────────────────────────────────────────────────────────────

import { EXAMPLES_DIR, examplesIn } from '../concepts/leakage.js';
import type { Files } from './recorded.js';

/** One visible example of a cut. */
export interface CutExample {
  /** `<context>/<n>`. */
  readonly ref: string;
  readonly context: string;
  readonly number: number;
  readonly concepts: readonly string[];
  readonly text: string;
}

/** One concept of a cut, in its own context. */
export interface CutConcept {
  readonly name: string;
  readonly context: string;
}

/** A cut: its name, its contexts, its visible examples and its concepts. */
export interface Cut {
  readonly cut: string;
  readonly contexts: readonly string[];
  readonly examples: readonly CutExample[];
  readonly concepts: readonly CutConcept[];
}

/** The cut named `name` as `files` hold it; refuses a malformed name and a cut
 *  with no examples file in any context. */
export function cutAt(
  files: Files,
  name: string,
  refuse: (message: string) => Error,
): Cut {
  if (!/^[^\s/]+$/.test(name) || name === '.' || name === '..')
    throw refuse(
      `the cut '${name}' is not a cut name: one word, with no whitespace and no /; give it with --cut`,
    );
  const contexts = files
    .under(`${EXAMPLES_DIR}/`)
    .flatMap((path) => {
      const [context, file, ...deeper] = path
        .slice(EXAMPLES_DIR.length + 1)
        .split('/');
      return file === `${name}.md` && deeper.length === 0 && context
        ? [context]
        : [];
    })
    .sort();
  if (contexts.length === 0)
    throw refuse(
      `the cut '${name}' has no visible examples: no ${EXAMPLES_DIR}/<context>/${name}.md exists`,
    );
  const examples = contexts.flatMap((context) =>
    examplesIn(files.read(`${EXAMPLES_DIR}/${context}/${name}.md`) ?? '').map(
      ({ number, text }) => ({
        ref: `${context}/${number}`,
        context,
        number,
        concepts: (/^\(([^)]*)\)/.exec(text)?.[1] ?? '')
          .split(',')
          .map((c) => c.trim())
          .filter((c) => c !== ''),
        text,
      }),
    ),
  );
  const concepts: CutConcept[] = [];
  for (const e of examples)
    for (const concept of e.concepts)
      if (!concepts.some((c) => c.name === concept && c.context === e.context))
        concepts.push({ name: concept, context: e.context });
  return { cut: name, contexts, examples, concepts };
}
