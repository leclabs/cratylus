// Shared cell grammar for the T1.1 spike: parse a `<organ>/<value>.md` cell into
// its structural parts, and define the canonical "cell body" the round-trip
// targets byte-for-byte.
//
// A value-cell is uniform:
//
//     ---
//     kind: <organ>
//     ---
//
//     <slug> ≜ <definiens>
//
// (front-matter, one blank line, one definition line, trailing newline). The
// "body" the composer inlines — and the byte-anchor the round-trip targets — is
// everything after the front-matter block, i.e. the `<slug> ≜ <definiens>\n`
// line. We keep the body verbatim; the mark (📐·cyan) is parsed out as metadata
// but stays INLINE in the definiens, so projection is byte-exact by construction.

import type { Mark, Organ } from '@leclabs/koine/anatomy';

export interface ParsedCell {
  /** The organ (front-matter `kind:`). */
  readonly organ: Organ;
  /** The cell anchor, left of `≜`. */
  readonly slug: string;
  /** Everything right of `≜ ` on the definition line (mark stays inline). */
  readonly definiens: string;
  /** The emoji·hue mark, if one is embedded in the definiens. */
  readonly mark?: Mark;
  /** The canonical cell body the round-trip must reproduce byte-for-byte. */
  readonly body: string;
}

/** The definition connective. */
const DEF = ' ≜ ';

/**
 * The mark token: an emoji glyph, a middot, a lowercase hue word — with NO
 * spaces around the inner `·` (distinguishing `📐·cyan` from the ` · ` segment
 * separators). Emoji are matched by Extended_Pictographic + optional VS16/joins.
 */
const MARK_RE = /(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)·([a-z]+)/u;

/** Split front-matter from body. Returns `{ frontMatter, body }`. */
function splitFrontMatter(raw: string): { frontMatter: string; body: string } {
  if (!raw.startsWith('---\n')) {
    throw new Error('cell: missing front-matter open fence');
  }
  const close = raw.indexOf('\n---\n', 4);
  if (close === -1) {
    throw new Error('cell: missing front-matter close fence');
  }
  const frontMatter = raw.slice(0, close + 5); // through "\n---\n"
  let body = raw.slice(close + 5);
  // Drop exactly one separator blank line between front-matter and body.
  if (body.startsWith('\n')) {
    body = body.slice(1);
  }
  return { frontMatter, body };
}

/** Parse the organ off the front-matter `kind:` line. */
function organFromFrontMatter(frontMatter: string): Organ {
  const m = frontMatter.match(/^kind:\s*(.+)$/m);
  if (!m?.[1]) {
    throw new Error('cell: front-matter has no `kind:`');
  }
  return m[1].trim() as Organ;
}

/** Parse a raw `.md` cell string into its structural parts. */
export function parseCell(raw: string): ParsedCell {
  const { frontMatter, body } = splitFrontMatter(raw);
  const organ = organFromFrontMatter(frontMatter);

  const line = body.endsWith('\n') ? body.slice(0, -1) : body;
  const at = line.indexOf(DEF);
  if (at === -1) {
    throw new Error(`cell: definition line lacks "${DEF.trim()}" connective: ${line}`);
  }
  const slug = line.slice(0, at);
  const definiens = line.slice(at + DEF.length);

  const markMatch = definiens.match(MARK_RE);
  const mark: Mark | undefined = markMatch?.[1]
    ? { emoji: markMatch[1], hue: markMatch[2] as string }
    : undefined;

  return { organ, slug, definiens, mark, body };
}
