// operator-lexicon — the corpus's shared operator vocabulary: the declared table `T`
// of self-sufficient-formalism's `closed(B)`. One glyph ⇔ one sense (injective, like
// signify on names): a glyph carries a single meaning across every fence, fixed by its
// `sense` and pinned by its `signature`. `T` DECLARES rather than derives — the one table
// exempt from "every symbol registered".
//
// DECLARE-NOT-DEGRADE (llm-native): `T` is a decodability REGISTRY, not an expression cap.
// When the SYMBOLS gate rejects the FITTEST sign, EXTEND `T` with it (cold-verify its
// decode) — never swap it for a weaker declared glyph to appease the gate.
//
// SINGLE HOME (DRY): the ONLY source for both gates —
//   • the SYMBOLS gate (`test/symbols.test.ts`): every fence-interior glyph must be a
//     non-ASCII key here (∪ the calibrated exempt classes).
//   • the RESIDUE gate (`forge/src/validate/residue.ts`): its admissible σ* value-algebra
//     operators = `↾ · ⟨⟩ · ${}`.
// Agent-audience: dense `sense` + `signature` only — NO human-comprehension prose. A human
// dereferences a glyph by asking an agent to explain the artifact (the on-demand channel),
// never a maintained doc.
//
// `coldVerified`: a cold reader recovers the operation from the glyph ALONE
// (SIGNIFIED/COLD-BLIND). Universal math/logic notation is cold by ubiquity; `↾`/`⟨⟩` were
// cold-surveyed against reader priors and passed. `${}` is a CODE mechanism (resolved at
// eval, not decoded) ⇒ false.

export type Glyph = string;

export interface OperatorEntry {
  /** the dense sense-name an agent-reader dereferences from priors */
  readonly sense: string;
  /** the type signature (`name : Domain → Codomain`, or a usage schema) */
  readonly signature: string;
  /** a cold reader recovers the operation from the glyph alone */
  readonly coldVerified: boolean;
}

export const OPERATORS = {
  // ── Definition & comparison ──────────────────────────────────────────────
  '≜': { sense: 'defines', signature: 'name ≜ expr', coldVerified: true },
  '≠': { sense: 'distinct', signature: 'T × T → Prop', coldVerified: true },
  '≽': { sense: 'dominates', signature: 'T × T → Prop', coldVerified: true },
  '≻': {
    sense: 'strictly-dominates',
    signature: 'T × T → Prop',
    coldVerified: true,
  },
  '≅': {
    sense: 'reader-isomorphic',
    signature: '𝒞 × 𝒞 → Prop',
    coldVerified: true,
  },
  '≺': { sense: 'precedes', signature: 'T × T → Prop', coldVerified: true },
  '≥': { sense: 'at-least', signature: 'T × T → Prop', coldVerified: true },
  '≤': { sense: 'at-most', signature: 'T × T → Prop', coldVerified: true },
  '≡': { sense: 'identical', signature: 'T × T → Prop', coldVerified: true },
  '≢': {
    sense: 'not-identical',
    signature: 'T × T → Prop',
    coldVerified: true,
  },
  '⟨': {
    sense: 'tuple-open / modifier-open',
    signature:
      '⟨a, b, …⟩ ordered record · X⟨m⟩ modifier (position-disambiguated)',
    coldVerified: true,
  },
  '⟩': {
    sense: 'tuple-close / modifier-close',
    signature:
      '⟨a, b, …⟩ ordered record · X⟨m⟩ modifier (position-disambiguated)',
    coldVerified: true,
  },
  '⋡': {
    sense: 'does-not-dominate',
    signature: 'T × T → Prop',
    coldVerified: true,
  },
  '⟼': { sense: 'maps-to', signature: 'x ⟼ f(x)', coldVerified: true },
  𝔹: { sense: 'Booleans', signature: '{⊤, ⊥}', coldVerified: true },

  // ── Propositional logic ──────────────────────────────────────────────────
  '¬': { sense: 'not', signature: 'Prop → Prop', coldVerified: true },
  '∧': { sense: 'and', signature: 'Prop × Prop → Prop', coldVerified: true },
  '∨': { sense: 'or', signature: 'Prop × Prop → Prop', coldVerified: true },
  '⊻': {
    sense: 'exclusive-or',
    signature: 'Prop × Prop → Prop',
    coldVerified: true,
  },
  '⇒': {
    sense: 'implies',
    signature: 'Prop × Prop → Prop',
    coldVerified: true,
  },
  '⇏': {
    sense: 'not-implies',
    signature: 'Prop × Prop → Prop',
    coldVerified: true,
  },
  '⇔': { sense: 'iff', signature: 'Prop × Prop → Prop', coldVerified: true },
  '⊥': { sense: 'contradiction', signature: 'Prop', coldVerified: true },
  '∴': { sense: 'therefore', signature: 'Prop ∴ Prop', coldVerified: true },
  '∵': { sense: 'because', signature: 'Prop ∵ Prop', coldVerified: true },

  // ── Quantifiers ──────────────────────────────────────────────────────────
  '∀': { sense: 'for-all', signature: '∀ x : Prop', coldVerified: true },
  '∃': { sense: 'exists', signature: '∃ x : Prop', coldVerified: true },
  '∄': { sense: 'none-exist', signature: '∄ x : Prop', coldVerified: true },

  // ── Sets ─────────────────────────────────────────────────────────────────
  '∈': { sense: 'member', signature: 'El × Set → Prop', coldVerified: true },
  '∉': {
    sense: 'non-member',
    signature: 'El × Set → Prop',
    coldVerified: true,
  },
  // ASCII operators. Barred for years not by cold-verification but by an encoding
  // filter in the residue grammar (`codePointAt > 0x7f`); `=` and `|` were in live
  // use the whole time, hand-split in code. Cold-verifiability is the only bar.
  '=': {
    sense: 'equality-binding',
    signature: 'A × A → Prop',
    coldVerified: true,
  },
  '|': {
    sense: 'given ⟨such-that⟩',
    signature: 'A × Cond → A',
    coldVerified: true,
  },
  '+': { sense: 'sum-conjunction', signature: 'A × A → A', coldVerified: true },
  '⊆': { sense: 'subset', signature: 'Set × Set → Prop', coldVerified: true },
  '⊂': {
    sense: 'proper-subset',
    signature: 'Set × Set → Prop',
    coldVerified: true,
  },
  '⊇': { sense: 'superset', signature: 'Set × Set → Prop', coldVerified: true },
  '⊕': {
    sense: 'direct-sum ⟨composition of parts into a whole⟩',
    signature: 'A × A → A',
    coldVerified: true,
  },
  '∪': { sense: 'union', signature: 'Set × Set → Set', coldVerified: true },
  '∩': {
    sense: 'intersection',
    signature: 'Set × Set → Set',
    coldVerified: true,
  },
  '⋃': {
    sense: 'n-ary-union',
    signature: 'Set[Set] → Set',
    coldVerified: true,
  },
  '∅': { sense: 'empty', signature: 'Set', coldVerified: true },
  '×': { sense: 'product', signature: 'Set × Set → Set', coldVerified: true },
  ℘: { sense: 'power-set', signature: 'Set → Set[Set]', coldVerified: true },
  '⊊': {
    sense: 'proper-subset',
    signature: 'Set × Set → Prop',
    coldVerified: true,
  },
  '⊔': { sense: 'join', signature: 'Set[El] → El', coldVerified: true },

  // ── Maps ─────────────────────────────────────────────────────────────────
  '→': { sense: 'maps', signature: 'A → B', coldVerified: true },
  '↦': { sense: 'sends', signature: 'x ↦ y', coldVerified: true },
  '⇀': { sense: 'partial-map', signature: 'A ⇀ B', coldVerified: true },
  '↣': { sense: 'injective-map', signature: 'A ↣ B', coldVerified: true },
  '⊨': { sense: 'entails', signature: 'X ⊨ Y', coldVerified: true },
  '↾': {
    sense: 'restriction',
    signature: 'X ↾ Y — X narrowed to scope Y',
    coldVerified: true,
  },
  '∘': {
    sense: 'compose',
    signature: '(B → C) × (A → B) → (A → C)',
    coldVerified: true,
  },

  // ── Enumeration ──────────────────────────────────────────────────────────
  '·': { sense: 'and-list', signature: 'a · b · c', coldVerified: true },
  '…': { sense: 'and-so-on', signature: '{ a, b, … }', coldVerified: true },

  // ── Provenance / representation (ASCII — contributes no gate glyph) ────────
  '@': {
    sense:
      'resides-at / sourced-from — the authoritative on-disk or subsystem home of a fact',
    signature: 'fact @ location',
    coldVerified: true,
  },

  // ── Reference mechanism (value algebra; ASCII — contributes no gate glyph) ─
  '${}': {
    sense: 'esm-reference',
    signature:
      '${cell} — template-literal interpolation of another cell, resolved at eval',
    coldVerified: false,
  },
} as const satisfies Record<Glyph, OperatorEntry>;

/**
 * The non-ASCII declared glyph set — the SYMBOLS-gate keyset (replaces the live markdown
 * read). Each key contributes its non-ASCII code points; ASCII keys (`${}`) add nothing.
 */
export function declaredGlyphs(): Set<string> {
  const out = new Set<string>();
  for (const glyph of Object.keys(OPERATORS)) {
    for (const ch of glyph) {
      if ((ch.codePointAt(0) ?? 0) > 127) {
        out.add(ch);
      }
    }
  }
  return out;
}

/**
 * The σ* value-algebra operators the RESIDUE gate admits inside a residue expression:
 * restriction, the modifier bracket, and the ESM reference mechanism. Member-composition is
 * the agent's set-arity vector, NOT a glyph — no compose operator without its own survey.
 */
export const RESIDUE_OPERATORS = ['↾', '⟨', '⟩', '${}'] as const;
