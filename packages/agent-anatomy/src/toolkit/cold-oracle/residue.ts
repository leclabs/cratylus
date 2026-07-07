// residue.ts — the machine-check behind AC-RESIDUE (PLAN.md · MODEL PARSIMONIOUS
// `body(c)=⟨α, residue⟩ ∧ residue=D∖fired(α)` specialized to the DEPLOYED corpus).
//
// GOVERNING INVARIANT (the project's whole point): every deployed artifact the model
// reads is formal σ* under ρ, never human prose. This leg enforces it over the whole
// deployed σ* payload set — every organ VALUE string · every skill `delineation` ·
// every skill `formalBlock` (whole). Each is read by the model as context ⇒ it MUST
// address the model's semantic space in formal σ*, never explanatory prose (the
// vision's failure criterion). Only enumerated executable worker-bytes (HookCell
// `command`/`workers`) are excluded — they are code, not decoded context.
//
// DECIDABLE PREDICATE (two shapes, one leg):
//
//   SINGLE-LINE (organ value residue · skill `delineation`) admissible ⇔
//       ∅  (empty — the anchor α fully fires the concept, residue=∅),  OR
//       a σ* EXPRESSION: a symbol/anchor (shortlex kebab, opt. application `f(args)`),
//       or the declared value-algebra operators applied over such terms. The admitted
//       operators are READ from `operator-lexicon.ts` (`RESIDUE_OPERATORS` — DRY, one
//       home): `↾` (restriction, infix) · `⟨…⟩` (modifier, carries the residue) ·
//       `${…}` (ESM reference — opaque CODE, resolved at eval, never decoded).
//     INADMISSIBLE = a free NL sentence: verb-led exposition, articles/connectives
//     carrying clausal meaning, sentence punctuation (`;` `.` `,` at top level) doing
//     semantic work. On reject the verdict NAMES the offending clause (actionable for
//     the O*/S* reduction waves).
//
//   FORMAL-BLOCK (skill `formalBlock`, whole) admissible ⇔ it is a `formalize`
//     artifact: every non-blank line is a DECLARATION (a symbol bound via `≜`/`:`/`;`/
//     `—`), a LAW (carries a declared formal glyph — the `operator-lexicon` glyph set,
//     the SECOND DRY read of the module), a structural header (`DECLARATIONS`/`LAWS`/a
//     divider), or a `--`/`//` comment continuation. INADMISSIBLE = an explanatory
//     free-NL line (no symbol-binder, no formal operator) or a `#`-preamble gloss —
//     named by line number on reject.
//
// PURE — witnesses over supplied strings, zero IO. Corpus loading (organ values ·
// delineations · formalBlocks) lives in the caller (`test/reader-density.test.ts`),
// mirroring `structural-parsimony.ts` (a sibling `accept()` leg driven by its test).

import { OPERATORS, RESIDUE_OPERATORS } from '../operator-lexicon.js';

export type ResidueShape = 'single-line' | 'formal-block';

export interface ResidueVerdict {
  readonly admissible: boolean;
  /** '' when admissible; the NAMED offending clause/line when rejected. */
  readonly reason: string;
}

const OK: ResidueVerdict = { admissible: true, reason: '' };
const no = (reason: string): ResidueVerdict => ({ admissible: false, reason });

// ── the admitted operator algebra — READ from operator-lexicon (DRY, one home) ────
//
// `RESIDUE_OPERATORS = ['↾','⟨','⟩','${}']`. The bracketing/reference forms group a
// span; the remainder are INFIX operators the grammar splits terms on. Deriving INFIX
// from the module means a new intra-expression operator added to the lexicon is picked
// up here automatically — the gate never hardcodes a second operator list.
const BRACKETING: ReadonlySet<string> = new Set(['⟨', '⟩', '${}']);
const INFIX_OPS: readonly string[] = RESIDUE_OPERATORS.filter(
  (o) => !BRACKETING.has(o),
);
// fail loud if the lexicon drifts out from under the grammar's structural constants.
for (const b of BRACKETING) {
  if (!(RESIDUE_OPERATORS as readonly string[]).includes(b)) {
    throw new Error(
      `residue-gate: '${b}' absent from RESIDUE_OPERATORS (lexicon drift)`,
    );
  }
}

/** The declared glyph set a LAW line may carry (the OPERATORS keys ∪ ASCII math). */
const FORMAL_GLYPHS: ReadonlySet<string> = new Set<string>([
  ...Object.keys(OPERATORS).flatMap((g) => [...g]),
  '=',
  '{',
  '}',
  '|',
]);

/** Well-formed σ* anchor — shortlex kebab (the `SIGNIFIED` sign shape, `accept.ts`). */
const ANCHOR = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/**
 * Free NL articles/connectives — function words that carry clausal meaning in a
 * sentence yet are absent from a σ* anchor (there they are hyphen-glued into a single
 * token: `human-on-the-loop` is ONE anchor, not the words `on`/`the`). A standalone
 * token equal to one of these is the crisp signature of prose exposition.
 */
const CONNECTIVES: ReadonlySet<string> = new Set([
  'the',
  'a',
  'an',
  'of',
  'to',
  'on',
  'in',
  'into',
  'onto',
  'upon',
  'for',
  'and',
  'or',
  'but',
  'because',
  'so',
  'then',
  'than',
  'when',
  'while',
  'never',
  'over',
  'its',
  "it's",
  'it',
  'is',
  'are',
  'be',
  'been',
  'with',
  'as',
  'at',
  'by',
  'from',
  'that',
  'this',
  'these',
  'those',
  'each',
  'only',
  'not',
  'no',
  'if',
  'via',
  'per',
  'out',
  'up',
  'off',
  'about',
  'we',
  'you',
  'your',
]);

// ── single-line σ* expression ─────────────────────────────────────────────────────

/** Strip `${…}` reference spans — opaque CODE (resolved at eval, never decoded). */
function stripRefs(s: string): string {
  return s.replace(/\$\{[^}]*\}/g, ' ');
}

/**
 * Split into the depth-0 text (each `⟨…⟩` / `(…)` group elided to a space) plus the
 * inner text of every top-level group. A residue's prose signals live at depth 0; a
 * group's interior (a modifier / an application's args) is validated by recursion.
 */
function decompose(s: string): { top: string; groups: string[] } {
  let depth = 0;
  let top = '';
  let cur = '';
  const groups: string[] = [];
  for (const ch of s) {
    if (ch === '⟨' || ch === '(') {
      if (depth === 0) {
        top += ' ';
        cur = '';
      } else {
        cur += ch;
      }
      depth++;
    } else if (ch === '⟩' || ch === ')') {
      depth = Math.max(0, depth - 1);
      if (depth === 0) {
        groups.push(cur);
      } else {
        cur += ch;
      }
    } else if (depth === 0) {
      top += ch;
    } else {
      cur += ch;
    }
  }
  return { top, groups };
}

/** Sentence punctuation doing semantic work at top level (∉ any bracket group). */
function clausalPunct(top: string): string | null {
  if (top.includes(';')) return ';';
  if (top.includes(',')) return ',';
  if (/\.(?!\d)/.test(top)) return '.'; // a period not inside a decimal
  return null;
}

/** Depth-0 tokens, split on whitespace + the declared INFIX operators. */
function topTokens(top: string): string[] {
  let t = top;
  for (const op of INFIX_OPS) {
    t = t.split(op).join(' ');
  }
  return t.split(/\s+/).filter((x) => x.length > 0);
}

/** The first clause (split on sentence punctuation) — what the reject NAMES. */
function firstClause(s: string): string {
  const seg = s
    .split(/[;.]/)
    .map((c) => c.trim())
    .find((c) => c.length > 0);
  return seg ?? s.trim();
}

/**
 * SINGLE-LINE admissibility — ∅, a bare anchor, or an application of the declared
 * operators over anchors. Rejects a free NL sentence, NAMING the offending clause.
 */
export function admissibleSingleLine(payload: string): ResidueVerdict {
  const s = payload.trim();
  if (s === '') return OK; // ∅ — the anchor fully fires the concept
  const code = stripRefs(s);
  const { top, groups } = decompose(code);

  const signals: string[] = [];
  const p = clausalPunct(top);
  if (p) signals.push(`clausal-punct '${p}'`);
  const conn = topTokens(top).filter((w) => CONNECTIVES.has(w.toLowerCase()));
  if (conn.length > 0)
    signals.push(`free-NL connective(s) [${conn.join('·')}]`);
  if (signals.length > 0) {
    return no(`${signals.join(' · ')} — offending clause: "${firstClause(s)}"`);
  }
  // no prose signal: every residual atom must be a well-formed σ* anchor.
  const bad = topTokens(top).filter((w) => !ANCHOR.test(w));
  if (bad.length > 0) return no(`non-σ* atom(s) [${bad.join('·')}]`);
  // a group's interior (modifier tag · application arg) must itself be σ*.
  for (const g of groups) {
    const v = admissibleSingleLine(g);
    if (!v.admissible)
      return no(`in ⟨modifier/arg⟩ "${g.trim()}": ${v.reason}`);
  }
  return OK;
}

// ── formalBlock (a `formalize` artifact — declarations-above / laws-below) ─────────

const SECTION_HEADER = /^(DECLARATIONS|LAWS)\b/;
const DIVIDER = /^[-—─]{3,}$/;
/** `<symbol> <ws> <binder>` — a symbol introduced/bound (`≜` covered as a glyph too). */
const DECL_BINDER = /^\S+\s+[—:;]/;

function isLaw(line: string): boolean {
  for (const ch of line) {
    if (FORMAL_GLYPHS.has(ch)) return true;
  }
  return false;
}

/**
 * FORMAL-BLOCK admissibility — every non-blank line is a declaration, a law, a
 * structural header/divider, or a `--`/`//` comment continuation. Rejects a free-NL
 * explanatory line or a `#`-preamble gloss, NAMED by line number.
 */
export function admissibleFormalBlock(block: string): ResidueVerdict {
  const lines = block.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] ?? '').trim();
    if (line === '') continue;
    if (SECTION_HEADER.test(line) || DIVIDER.test(line)) continue;
    if (line.startsWith('#')) {
      return no(`L${i + 1} #-preamble gloss: "${line}"`);
    }
    if (line.startsWith('--') || line.startsWith('//')) continue;
    if (DECL_BINDER.test(line) || isLaw(line)) continue;
    return no(
      `L${i + 1} explanatory-prose line (no symbol-binder, no formal operator): "${line}"`,
    );
  }
  return OK;
}

/** The AC-RESIDUE predicate over a deployed σ* payload of the given shape. */
export function admissibleResidue(
  payload: string,
  shape: ResidueShape,
): ResidueVerdict {
  return shape === 'formal-block'
    ? admissibleFormalBlock(payload)
    : admissibleSingleLine(payload);
}
