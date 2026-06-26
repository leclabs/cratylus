// Shared cell grammar for the mind→TS migration. Parses a `<organ>/<value>.md`
// or `skill/<name>.md` cell into its structural parts, and defines the canonical
// "cell body" the round-trip targets byte-for-byte.
//
// BYTE-ANCHOR — the canonical body is exactly what the Python toolkit's
// `core.cells.parse_cell` returns: `raw.split('---', 2)[2]` — everything after
// the second `---`. For a value-cell that is `\n\n<slug> ≜ <definiens>\n`; for a
// skill it is `\n\n# <verb>\n…\n`. The leading `\n\n` (the newline closing the
// front-matter fence + the blank line before the body) is PART of the body and
// must be reproduced. We mirror the Python split exactly — do not reinvent.
//
// A value-cell is uniform:
//
//     ---
//     kind: <organ>
//     ---
//
//     <slug> ≜ <definiens>
//
// The mark (📐·cyan) is parsed out as metadata but stays INLINE in the definiens,
// so projection is byte-exact by construction (we never re-synthesize it).

import type { Mark, Organ } from '@leclabs/koine/anatomy';

/** A parsed organ value-cell. */
export interface ParsedCell {
  readonly organ: Organ;
  readonly slug: string;
  /** Everything right of `≜ ` on the definition line (mark stays inline). */
  readonly definiens: string;
  readonly mark?: Mark;
  /** The canonical cell body (`split('---',2)[2]`) — the round-trip byte-anchor. */
  readonly body: string;
}

/** A parsed `kind: skill` cell. */
export interface ParsedSkill {
  /** Front-matter `name:` (falls back to the file slug). */
  readonly name: string;
  /** Front-matter `trigger:` (e.g. `/introspect`). */
  readonly trigger: string;
  /** Front-matter `delineation:`. */
  readonly delineation: string;
  /** The H1 verb (the `# <verb>` heading text). */
  readonly verb: string;
  /** The first fenced block's interior (the self-sufficient set-builder), if any. */
  readonly formalBlock: string;
  /** Sibling-skill anchors harvested from the prose `≜` formula / Bindings region. */
  readonly composition: readonly string[];
  /** The canonical cell body (`split('---',2)[2]`) — the round-trip byte-anchor. */
  readonly body: string;
}

/** A parsed `kind: agent` selection-vector cell. */
export interface ParsedAgent {
  /** The agent name (H1 / file slug). */
  readonly name: string;
  /** The organ selections in SOURCE ORDER: `[organ, [value, …]]` per line. */
  readonly selection: readonly (readonly [Organ, readonly string[]])[];
}

/** The definition connective. */
const DEF = ' ≜ ';

const MARK_RE =
  /(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)·([a-z]+)/u;

/** Every `[[anchor]]` token (slug only), mirroring the Python `cells.REF`. */
const REF_RE = /\[\[([a-z0-9-]+)\]\]/g;

/** A front-matter field value, or `''` if absent. Mirrors the Python `: ` split. */
function frontField(frontMatter: string, key: string): string {
  const m = frontMatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return m?.[1]?.trim() ?? '';
}

/**
 * Split a raw cell into front-matter and the CANONICAL body, mirroring the
 * Python `parse_cell`: `raw.split('---', 2)` → `body = parts[2]` (the leading
 * `\n` after the closing `---` is kept). Throws on a malformed cell.
 */
function splitCanonical(raw: string): { frontMatter: string; body: string } {
  if (!raw.startsWith('---')) {
    throw new Error('cell: missing front-matter open fence');
  }
  // raw.split('---', 2) in Python keeps the remainder in parts[2]; JS `split`
  // with a limit DROPS the remainder, so replicate the Python 3-way split.
  const first = raw.indexOf('---');
  const second = raw.indexOf('---', first + 3);
  if (second === -1) {
    throw new Error('cell: missing front-matter close fence');
  }
  const frontMatter = raw.slice(first + 3, second);
  const body = raw.slice(second + 3);
  return { frontMatter, body };
}

/** Parse the organ off the front-matter `kind:` line. */
function organFrom(frontMatter: string): Organ {
  const kind = frontField(frontMatter, 'kind');
  if (!kind) {
    throw new Error('cell: front-matter has no `kind:`');
  }
  return kind as Organ;
}

/** Parse a raw `.md` organ value-cell into its structural parts. */
export function parseCell(raw: string): ParsedCell {
  const { frontMatter, body } = splitCanonical(raw);
  const organ = organFrom(frontMatter);

  // The definition line is the single non-blank body line.
  const line = body.split('\n').find((l) => l.includes(DEF));
  if (line === undefined) {
    throw new Error(`cell: no definition line with "${DEF.trim()}"`);
  }
  const at = line.indexOf(DEF);
  const slug = line.slice(0, at);
  const definiens = line.slice(at + DEF.length);

  const markMatch = definiens.match(MARK_RE);
  const mark: Mark | undefined = markMatch?.[1]
    ? { emoji: markMatch[1], hue: markMatch[2] as string }
    : undefined;

  return { organ, slug, definiens, mark, body };
}

/** The interior of the first fenced ``` ``` block in `body`, or `''` if none. */
function firstFenceInterior(body: string): string {
  const lines = body.split('\n');
  let open = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i] as string;
    if (l.startsWith('```')) {
      if (open === -1) {
        open = i;
      } else {
        return lines.slice(open + 1, i).join('\n');
      }
    }
  }
  return '';
}

/** Refs in the cell's single prose `≜` formula line (fenced `≜` is math, skipped). */
function formulaRefs(body: string): string[] {
  const fence = fenceMask(body);
  const lines = body.split('\n');
  const formula = lines.find((l, i) => l.includes('≜') && !fence.has(i));
  if (formula === undefined) {
    return [];
  }
  return dedupe([...formula.matchAll(REF_RE)].map((m) => m[1] as string));
}

/** Refs in the cell's `Bindings:` paragraph (the cite-once home), if present. */
function bindingsRefs(body: string): string[] {
  const fence = fenceMask(body);
  const lines = body.split('\n');
  const start = lines.findIndex(
    (l, i) =>
      !fence.has(i) && /^\s*\*{0,2}Bindings\b\s*(?:\([^)]*\))?\s*:/.test(l),
  );
  if (start === -1) {
    return [];
  }
  const refs: string[] = [];
  for (let i = start; i < lines.length; i++) {
    const l = lines[i] as string;
    if (
      i > start &&
      (l.trim() === '' || (l.startsWith('## ') && !fence.has(i)))
    ) {
      break;
    }
    refs.push(...[...l.matchAll(REF_RE)].map((m) => m[1] as string));
  }
  return dedupe(refs);
}

/** Line indices inside a ``` fenced block (markers included). Mirrors `fence_lines`. */
function fenceMask(body: string): Set<number> {
  const lines = body.split('\n');
  const mask = new Set<number>();
  let open = -1;
  for (let i = 0; i < lines.length; i++) {
    if ((lines[i] as string).startsWith('```')) {
      if (open === -1) {
        open = i;
      } else {
        for (let j = open; j <= i; j++) {
          mask.add(j);
        }
        open = -1;
      }
    }
  }
  return mask;
}

function dedupe(xs: string[]): string[] {
  return [...new Set(xs)];
}

/**
 * Parse a `kind: skill` cell. Composition precedence mirrors the Python
 * `composition_refs`: a Bindings region (cite-once home) WINS; absent it, the
 * prose `≜` formula's refs. The verb is the H1 text; the formalBlock is the
 * first fenced block's interior.
 */
export function parseSkill(raw: string, fileSlug: string): ParsedSkill {
  const { frontMatter, body } = splitCanonical(raw);
  const fence = fenceMask(body);
  const lines = body.split('\n');

  const h1 = lines.find((l, i) => l.startsWith('# ') && !fence.has(i));
  const verb = h1 ? h1.slice(2).trim() : fileSlug;

  const composition = bindingsRefs(body).length
    ? bindingsRefs(body)
    : formulaRefs(body);

  return {
    name: frontField(frontMatter, 'name') || fileSlug,
    trigger: frontField(frontMatter, 'trigger'),
    delineation: frontField(frontMatter, 'delineation'),
    verb,
    formalBlock: firstFenceInterior(body),
    composition,
    body,
  };
}

/** The 24 organ-catalog names — the valid first token of a selection line. */
const ORGAN_NAMES = new Set<string>([
  'autonomy',
  'persona',
  'role',
  'formality',
  'audience-adaptation',
  'transparency',
  'provenance',
  'objective',
  'guardrails',
  'engineering-principles',
  'heuristics',
  'capabilities',
  'learning',
  'situation-awareness',
  'actions',
  'modalities',
  'model',
  'memory',
  'trigger',
  'framing',
  'reasoning-strategy',
  'satisficing',
  'output-format',
  'self-evaluation',
]);

/** Strip a selection value token to its bare anchor (`[[x]]` or `x` → `x`). */
function stripValue(tok: string): string {
  const t = tok.trim();
  const m = t.match(/^\[\[([a-z0-9-]+)\]\]$/);
  return m ? (m[1] as string) : t;
}

/**
 * Parse a `kind: agent` selection-vector cell. Mirrors the Python
 * `compose_agent_selection.parse_selection`: each body line whose first token is
 * an organ name is a selection `organ value` or `organ { v1 · v2 · … }`; values
 * are authored bare or as `[[wikilink]]` (both normalize). The schema formula
 * line (`name ≜ ⊕{organ ↦ value}`), headings, blanks, and fenced lines are
 * skipped. Selection order = SOURCE order (load-bearing for byte-identity).
 */
export function parseAgent(raw: string, fileSlug: string): ParsedAgent {
  const { body } = splitCanonical(raw);
  const fence = fenceMask(body);
  const lines = body.split('\n');

  const h1 = lines.find((l, i) => l.startsWith('# ') && !fence.has(i));
  const name = h1 ? h1.slice(2).trim() : fileSlug;

  const selection: (readonly [Organ, readonly string[]])[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (fence.has(i)) {
      continue;
    }
    const s = (lines[i] as string).trim();
    if (!s || s.startsWith('#') || s.includes('⊕{organ ↦')) {
      continue;
    }
    const sp = s.indexOf(' ');
    if (sp === -1) {
      continue;
    }
    const organ = s.slice(0, sp);
    const rest = s.slice(sp + 1).trim();
    if (!ORGAN_NAMES.has(organ)) {
      continue;
    }
    const values =
      rest.startsWith('{') && rest.endsWith('}')
        ? rest
            .slice(1, -1)
            .split('·')
            .map(stripValue)
            .filter((v) => v)
        : [stripValue(rest)].filter((v) => v);
    selection.push([organ as Organ, values]);
  }
  return { name, selection };
}
