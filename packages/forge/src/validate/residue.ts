// residue.ts — the machine-check behind AC-RESIDUE (MODEL PARSIMONIOUS
// `body(c)=⟨α, residue⟩ ∧ residue=D∖fired(α)` specialized to the DEPLOYED corpus).
//
// GOVERNING INVARIANT (the project's whole point): every deployed σ* artifact the
// model reads is formal σ* under ρ, never human prose. This leg enforces it over the
// σ* payload set — the fields whose reader binding ρ is σ* (model-read): every dimension
// VALUE string · every skill `formalBlock` (the typed `SkillExpression`) · every agent
// `archetype`. Membership is a per-FIELD partition (`RESIDUE_GATED_FIELDS` below), NOT a
// per-file rule — the skill cell carries BOTH a σ* field (`formalBlock`) and a σ_human*
// field (`description`). The σ_human* fields — skill `description` · agent `description`
// (human-read selection bounds the router/subagent surfaces) — are EXEMPT by ρ
// (`RESIDUE_EXEMPT_FIELDS`), NOT residue-gated. Enumerated executable worker-bytes
// (HookCell `command`/`workers`) are code, not decoded context — also out.
//
// DECIDABLE PREDICATE (two shapes, one leg):
//
//   SINGLE-LINE (dimension value residue · skill `description`) admissible ⇔
//       ∅  (empty — the anchor α fully fires the concept, residue=∅),  OR
//       a σ* EXPRESSION: a symbol/anchor (shortlex kebab, opt. application `f(args)`),
//       or the declared value-algebra operators applied over such terms. The admitted
//       operators are the INJECTED corpus operator lexicon (`policy.residueOperators` /
//       `policy.operators`): `↾` (restriction, infix) · `⟨…⟩` (modifier, carries the
//       residue) · `${…}` (ESM reference — opaque CODE, resolved at eval, never decoded).
//     INADMISSIBLE = a free NL sentence: verb-led exposition, articles/connectives
//     carrying clausal meaning, sentence punctuation (`;` `.` `,` at top level) doing
//     semantic work. On reject the verdict NAMES the offending clause.
//
//   FORMAL-BLOCK (skill `formalBlock`, whole) admissible ⇔ it is a `formalize`
//     artifact: every non-blank line is a DECLARATION (a symbol bound via `≜`/`:`/`;`/
//     `—`), a LAW (carries a declared formal glyph — the injected `policy.operators`
//     glyph set), a structural header (`DECLARATIONS`/`LAWS`/a divider), or a `--`/`//`
//     comment continuation. INADMISSIBLE = an explanatory free-NL line (no symbol-binder,
//     no formal operator) or a `#`-preamble gloss — named by line number on reject.
//
// This is the doctrine-agnostic ALGORITHM (forge ENGINE): witnesses over supplied
// strings, zero IO. The operator lexicon it reads is CORPUS DATA, injected as a `Policy`
// (`./policy.ts`) — the DATA lives in the corpus (canon), never here. Corpus
// loading lives in the caller.

import type { SkillExpression } from '@cratylus/schema';
import type { Policy } from './policy.js';

export type ResidueShape = 'single-line' | 'formal-block';

export interface ResidueVerdict {
  readonly admissible: boolean;
  /** '' when admissible; the NAMED offending clause/line when rejected. */
  readonly reason: string;
}

const OK: ResidueVerdict = { admissible: true, reason: '' };
const no = (reason: string): ResidueVerdict => ({ admissible: false, reason });

// ── the grammar derived from the INJECTED operator lexicon (algorithm ⊥ policy) ────
//
// The residue grammar is a PURE function of the corpus operator lexicon: the
// bracketing/reference forms group a span, every other declared non-bracketing glyph
// is an INFIX operator the grammar splits terms on. Deriving from the injected policy
// means a new intra-expression operator added to the corpus lexicon is picked up
// automatically — the algorithm hardcodes no operator list.
interface Grammar {
  /** the bracketing/reference forms handled structurally (`⟨ ⟩ ${}`). */
  readonly bracketing: ReadonlySet<string>;
  /** every declared non-bracketing non-ASCII glyph the grammar splits terms on. */
  readonly residueGlyphs: readonly string[];
  /** the declared glyph set a LAW line may carry (operator keys ∪ ASCII math). */
  readonly formalGlyphs: ReadonlySet<string>;
}

function grammarOf(policy: Policy): Grammar {
  const bracketing: ReadonlySet<string> = new Set(['⟨', '⟩', '${}']);
  // fail loud if the injected lexicon drifts out from under the grammar's constants.
  for (const b of bracketing) {
    if (!policy.residueOperators.includes(b)) {
      throw new Error(
        `residue-gate: '${b}' absent from policy.residueOperators (lexicon drift)`,
      );
    }
  }
  const keys = Object.keys(policy.operators);
  // A residue is a σ* expression over the FULL declared operator vocabulary — not only
  // the structural value-algebra ops. Every declared glyph is an admitted operator the
  // grammar splits terms on, EXCEPT two semantically-defined classes below. An
  // UNDECLARED glyph is NOT split → stays an atom → fails the ANCHOR check → rejected;
  // genuine prose (connectives · clausal punctuation) still fails. Admits both batch
  // styles (`⟨a · b⟩` and space-separated `⟨a b⟩`).
  //
  // The exclusions were previously a single `codePointAt > 0x7f` test — an ENCODING
  // predicate standing in for two unrelated STRUCTURAL facts, which is a category
  // error: it silently barred every ASCII glyph from ever being an operator no matter
  // how well it cold-verifies. `@` was declared, cold-verified, and unusable; `=` and
  // `|` had to be hand-patched back into the splitter in code because the lexicon
  // could not hold them. Both classes are now named for what they are.

  // (1) STRUCTURAL — the bracketing/reference forms, handled by `decompose`, never
  // split as infix. Char-level, because `'${}'` is a 3-char key: `bracketing.has('$')`
  // is false, so the old encoding test was the ONLY thing keeping `$ { }` out.
  const structural = new Set<string>([...bracketing].flatMap((b) => [...b]));
  // (2) ANCHOR-INTERNAL — punctuation that is part of a σ* token, not a separator.
  // Splitting on these would shred every kebab and snake anchor (`human-on-the-loop`
  // → 4 fragments, `ρ_s` → 2). Neither is a declared operator; this is a guard so
  // declaring one later cannot silently dismantle the anchor vocabulary.
  const anchorInternal = new Set<string>(['-', '_']);
  const residueGlyphs: readonly string[] = [
    ...new Set(
      keys
        .flatMap((g) => [...g])
        .filter((ch) => !structural.has(ch) && !anchorInternal.has(ch)),
    ),
  ];
  // Every declared glyph, plus the structural chars a law line may carry.
  const formalGlyphs: ReadonlySet<string> = new Set<string>(
    keys.flatMap((g) => [...g]),
  );
  return { bracketing, residueGlyphs, formalGlyphs };
}

/**
 * Well-formed σ* anchor — kebab, admitting a CASED proper-noun sign (`ReAct`, `Endsley`,
 * `Auftragstaktik`, `LLM`): a proper noun IS the fittest sign for a concept the lowercase
 * form collides on. Connectives are still caught case-insensitively, so prose still fails.
 */
const ANCHOR = /^[A-Za-z][A-Za-z0-9_]*(?:-[A-Za-z0-9_]+)*$/;
/**
 * A definiendum-class variable — a single Greek letter (`ρ`, `σ`, `α`, …), optionally
 * star-marked (`σ*` — the project's central sign). The `ρ=LLM` binding's left side.
 *
 * Optionally SUBSCRIPTED with an anchor (`π_decision-authority`, `ρ_s`, `ρ_document`):
 * standard policy/family notation, cold-verified and already load-bearing across the
 * corpus. The single-letter form never admitted it, which convicted the cell rather
 * than the rig — the sign the model wants is the truth; this pattern is warm K.
 */
const GREEK = /^[Α-ω]\*?(?:_[A-Za-z][A-Za-z0-9_]*(?:-[A-Za-z0-9_]+)*)?$/;

/**
 * Free NL articles/connectives — function words that carry clausal meaning in a
 * sentence yet are absent from a σ* anchor (there they are hyphen-glued into a single
 * token: `human-on-the-loop` is ONE anchor, not the words `on`/`the`). A standalone
 * token equal to one of these is the crisp signature of prose exposition. Generic
 * English grammar — doctrine-agnostic, not corpus policy.
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

/** Depth-0 tokens, split on whitespace + every declared operator glyph + `=` bindings. */
function topTokens(top: string, residueGlyphs: readonly string[]): string[] {
  let t = top;
  for (const op of residueGlyphs) {
    t = t.split(op).join(' ');
  }
  // `=` (binding) and `|` (given) were hand-patched in here because the encoding
  // filter above barred every ASCII glyph from the declared set. Both are now
  // declared operators and split like any other — no special case.
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

function singleLine(payload: string, grammar: Grammar): ResidueVerdict {
  const s = payload.trim();
  if (s === '') return OK; // ∅ — the anchor fully fires the concept
  const code = stripRefs(s);
  const { top, groups } = decompose(code);

  const signals: string[] = [];
  const p = clausalPunct(top);
  if (p) signals.push(`clausal-punct '${p}'`);
  const conn = topTokens(top, grammar.residueGlyphs).filter((w) =>
    CONNECTIVES.has(w.toLowerCase()),
  );
  if (conn.length > 0)
    signals.push(`free-NL connective(s) [${conn.join('·')}]`);
  if (signals.length > 0) {
    return no(`${signals.join(' · ')} — offending clause: "${firstClause(s)}"`);
  }
  // no prose signal: every residual atom must be a well-formed σ* anchor or a Greek var.
  const bad = topTokens(top, grammar.residueGlyphs).filter(
    (w) => !ANCHOR.test(w) && !GREEK.test(w),
  );
  if (bad.length > 0) return no(`non-σ* atom(s) [${bad.join('·')}]`);
  // a group's interior (modifier tag · application arg) must itself be σ*.
  for (const g of groups) {
    const v = singleLine(g, grammar);
    if (!v.admissible)
      return no(`in ⟨modifier/arg⟩ "${g.trim()}": ${v.reason}`);
  }
  return OK;
}

/**
 * SINGLE-LINE admissibility — ∅, a bare anchor, or an application of the declared
 * operators over anchors. Rejects a free NL sentence, NAMING the offending clause. The
 * admitted operator vocabulary is the INJECTED corpus lexicon (`policy`).
 */
export function admissibleSingleLine(
  payload: string,
  policy: Policy,
): ResidueVerdict {
  return singleLine(payload, grammarOf(policy));
}

// ── body (a `formalize` artifact — declarations-above / laws-below) ─────────

const SECTION_HEADER = /^(DECLARATIONS|LAWS)\b/;
const DIVIDER = /^[-—─]{3,}$/;
/** `<symbol> <ws> <binder>` — a symbol introduced/bound (`≜` covered as a glyph too). */
const DECL_BINDER = /^\S+\s+[—:;]/;

function isLaw(line: string, formalGlyphs: ReadonlySet<string>): boolean {
  for (const ch of line) {
    if (formalGlyphs.has(ch)) return true;
  }
  return false;
}

/**
 * FORMAL-BLOCK admissibility — every non-blank line is a declaration, a law, a
 * structural header/divider, or a `--`/`//` comment continuation. Rejects a free-NL
 * explanatory line or a `#`-preamble gloss, NAMED by line number. The declared LAW
 * glyph set is the INJECTED corpus lexicon (`policy`).
 */
export function admissibleBody(block: string, policy: Policy): ResidueVerdict {
  const { formalGlyphs } = grammarOf(policy);
  const lines = block.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] ?? '').trim();
    if (line === '') continue;
    if (SECTION_HEADER.test(line) || DIVIDER.test(line)) continue;
    if (line.startsWith('#')) {
      return no(`L${i + 1} #-preamble gloss: "${line}"`);
    }
    if (line.startsWith('--') || line.startsWith('//')) continue;
    if (DECL_BINDER.test(line) || isLaw(line, formalGlyphs)) continue;
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
  policy: Policy,
): ResidueVerdict {
  return shape === 'formal-block'
    ? admissibleBody(payload, policy)
    : admissibleSingleLine(payload, policy);
}

/**
 * AC-RESIDUE over a skill's σ* payload — the TYPED forge `formalBlock`
 * (`SkillExpression`), consumed as the IR field, NEVER a fence-scraped body. A
 * `formalBlock` is a `formalize` artifact ⇒ the FORMAL-BLOCK shape. This is the sole
 * σ* payload of a skill cell; its sibling `description` is σ_human* and un-gated.
 */
export function admissibleFormalBlock(
  formalBlock: SkillExpression,
  policy: Policy,
): ResidueVerdict {
  return admissibleBody(formalBlock, policy);
}

// ── the per-FIELD residue partition — ρ decides membership (the gate's contract) ──
//
// AC-RESIDUE gates the σ* fields ONLY. A cell field's reader binding ρ decides
// membership: σ* (model-read) ⇒ residue-gated at its shape; σ_human* (human-read
// selection bound) ⇒ EXEMPT. This is a per-FIELD partition, NOT a per-file rule — a
// skill cell carries a σ* field (`formalBlock`) AND a σ_human* field (`description`),
// and an agent carries a σ* `archetype` AND a σ_human* `description`.

/** A cell field's reader binding — the two ρ classes the partition splits on. */
export type ReaderBinding = 'σ*' | 'σ_human*';

/** A σ*-gated field: its address + the residue shape AC-RESIDUE reads it at. */
export interface GatedField {
  readonly field: 'fragment' | 'skill.formalBlock' | 'agent.archetype';
  readonly shape: ResidueShape;
}

/**
 * The σ* fields residue/parsimony gate — the gate's field-partition contract, one
 * home. dimension value (single-line `α ≜ residue`) · skill `formalBlock` (the typed
 * `SkillExpression`, a formalize block) · agent `archetype` (single-line σ* identity).
 * `skill.description` is DELIBERATELY ABSENT — un-gated on purpose, because it is
 * human-audience prose rather than σ*. This list is the whole gated set; read it here.
 */
export const RESIDUE_GATED_FIELDS: readonly GatedField[] = [
  { field: 'fragment', shape: 'single-line' },
  { field: 'skill.formalBlock', shape: 'formal-block' },
  { field: 'agent.archetype', shape: 'single-line' },
] as const;

/**
 * The σ_human* fields — human-read one-line selection bounds the router/subagent
 * surfaces, NEVER residue-gated. `skill.description` leaves the gated set here (it was
 * over-gated as σ*; it is σ_human*), joining `agent.description` (its one-level-up
 * twin). Exempt by ρ, never by path.
 */
export const RESIDUE_EXEMPT_FIELDS: readonly (
  | 'skill.description'
  | 'agent.description'
)[] = ['skill.description', 'agent.description'] as const;
