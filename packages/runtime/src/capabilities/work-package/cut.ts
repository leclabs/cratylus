// ─────────────────────────────────────────────────────────────────────────────
// A CUT as the work package capability reads it: identified by its NAME alone,
// across contexts. Its visible examples are every
// `design/examples/<context>/<name>.md`, read the way the concept journal reads
// visible examples (a line `N. ...` opens example N); its CONTEXTS are those
// contexts. An example is referenced as `<context>/<n>`.
//
// An example's CONCEPTS are the comma-separated names in the parenthesis that
// opens its text, `12. (whole check, efficiency) **Given** ...`, each a concept
// of the example's own context; the cut's concepts are every concept its
// visible examples name, per context, in the order first named. A shared cut
// never merges its contexts' models or example sets. Nothing else of the design
// is read.
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { EXAMPLES_DIR, visibleExamples } from '../concepts/leakage.js';

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

/** The cut named `name` in the repository at `top`; refuses a malformed name
 *  and a cut with no examples file in any context. */
export function cutAt(
  top: string,
  name: string,
  refuse: (message: string) => Error,
): Cut {
  if (!/^[^\s/]+$/.test(name) || name === '.' || name === '..')
    throw refuse(
      `the cut '${name}' is not a cut name: one word, with no whitespace and no /; give it with --cut`,
    );
  const dir = join(top, EXAMPLES_DIR);
  const contexts = existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter(
          (d) => d.isDirectory() && existsSync(join(dir, d.name, `${name}.md`)),
        )
        .map((d) => d.name)
        .sort()
    : [];
  if (contexts.length === 0)
    throw refuse(
      `the cut '${name}' has no visible examples: no ${EXAMPLES_DIR}/<context>/${name}.md exists`,
    );
  const files = new Map(
    contexts.map((context) => [
      `${EXAMPLES_DIR}/${context}/${name}.md`,
      context,
    ]),
  );
  const examples = visibleExamples(top).flatMap(({ file, number, text }) => {
    const context = files.get(file);
    if (context === undefined) return [];
    return [
      {
        ref: `${context}/${number}`,
        context,
        number,
        concepts: (/^\(([^)]*)\)/.exec(text)?.[1] ?? '')
          .split(',')
          .map((c) => c.trim())
          .filter((c) => c !== ''),
        text,
      },
    ];
  });
  const concepts: CutConcept[] = [];
  for (const e of examples)
    for (const concept of e.concepts)
      if (!concepts.some((c) => c.name === concept && c.context === e.context))
        concepts.push({ name: concept, context: e.context });
  return { cut: name, contexts, examples, concepts };
}
