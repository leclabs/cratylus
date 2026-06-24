// The claude projection of a Fragment: render a typed fragment module back to
// its current cell-body markdown form. This is the inverse of codegen; the
// round-trip gate is `fragmentToMarkdown(fromCell(parseCell(raw))) === body`.

import type { Fragment } from '@leclabs/koine/anatomy';

/**
 * Render a Fragment to the current cell-body form: the single
 * `<slug> ≜ <definiens>\n` line. The mark, when present, is already inline in
 * the definiens (we never re-synthesize it), so no special-casing is needed —
 * the body is exactly the definition line plus its trailing newline.
 */
export function fragmentToMarkdown(f: Fragment): string {
  return `${f.slug} ≜ ${f.definiens}\n`;
}
