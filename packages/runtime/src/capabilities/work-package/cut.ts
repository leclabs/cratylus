// ─────────────────────────────────────────────────────────────────────────────
// A CUT as the work package capability reads it: `<context>/<name>`, whose
// visible examples are `design/examples/<context>/<name>.md`, read the way the
// concept journal reads visible examples (a line `N. ...` opens example N).
//
// An example's CONCEPTS are the comma-separated names in the parenthesis that
// opens its text, `12. (whole check, efficiency) **Given** ...`; the cut's
// concepts are every concept its visible examples name, in the order first
// named. Nothing else of the design is read.
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { EXAMPLES_DIR, visibleExamples } from '../concepts/leakage.js';

/** One visible example of a cut. */
export interface CutExample {
  readonly number: number;
  readonly concepts: readonly string[];
  readonly text: string;
}

/** A cut: its name as given, its context and own name, its visible examples
 *  and its concepts. */
export interface Cut {
  readonly cut: string;
  readonly context: string;
  readonly name: string;
  readonly examples: readonly CutExample[];
  readonly concepts: readonly string[];
}

/** The cut `spec` names in the repository at `top`; refuses a malformed name
 *  and a cut with no examples file. */
export function cutAt(
  top: string,
  spec: string,
  refuse: (message: string) => Error,
): Cut {
  const [context, name, ...rest] = spec.split('/');
  const part = /^[^\s/]+$/;
  if (
    context === undefined ||
    name === undefined ||
    rest.length > 0 ||
    !part.test(context) ||
    !part.test(name) ||
    [context, name].some((p) => p === '.' || p === '..')
  )
    throw refuse(
      `the cut '${spec}' is not <context>/<name>; give one with --cut`,
    );
  const file = `${EXAMPLES_DIR}/${context}/${name}.md`;
  if (!existsSync(join(top, file)))
    throw refuse(
      `the cut '${spec}' has no visible examples: ${file} is missing`,
    );
  const examples = visibleExamples(top)
    .filter((e) => e.file === file)
    .map(({ number, text }) => ({
      number,
      concepts: (/^\(([^)]*)\)/.exec(text)?.[1] ?? '')
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c !== ''),
      text,
    }));
  return {
    cut: spec,
    context,
    name,
    examples,
    concepts: [...new Set(examples.flatMap((e) => e.concepts))],
  };
}
