// The claude projection of a fragment / skill: render a typed module back to its
// current cell-body markdown form. Inverse of codegen; the round-trip gate is
// `fragmentToMarkdown(module) === parse_cell(raw).body` (and likewise for skills).
//
// The canonical body (the byte-anchor) is `raw.split('---',2)[2]` — it begins
// with the `\n\n` that closes the front-matter fence + the blank line before the
// body, and ends with a single trailing `\n`. We reproduce that exactly.

import type { Fragment } from '@leclabs/agent-forge/anatomy';

/**
 * Render a Fragment to its canonical cell body: `\n\n<slug> ≜ <definiens>\n`.
 * The body is fully determined by `{slug, definiens}` — the mark is already
 * inline in the definiens (we never re-synthesize it), so this is byte-exact.
 */
export function fragmentToMarkdown(f: Fragment): string {
  return `\n\n${f.slug} ≜ ${f.definiens}\n`;
}

/**
 * A skill module carries its canonical body VERBATIM (mirroring the Python
 * `render: verbatim` path): the typed `Skill` fields are queryable metadata, but
 * the body is the authored operative content reproduced byte-for-byte. The
 * projector therefore just returns the carried body — no field-by-field
 * reconstruction of free authored prose (which would invite drift).
 */
export interface SkillModule {
  /** The verbatim canonical cell body (`split('---',2)[2]`). */
  readonly body: string;
}

/** Render a skill module back to its canonical cell body (verbatim). */
export function skillToMarkdown(s: SkillModule): string {
  return s.body;
}
