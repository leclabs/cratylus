// operator-lexicon — the canon's shared operator vocabulary: the declared table `T`
// of self-sufficient-formalism's `closed(B)`. One glyph ⇔ one sense (injective, like
// signify on names): a glyph carries a single meaning across every fence, fixed by its
// `sense` and pinned by its `signature`. `T` DECLARES rather than derives — the one table
// exempt from "every symbol registered".
//
// Agent-audience: dense `sense` + `signature` only — NO human-comprehension prose. A human
// dereferences a glyph by asking an agent to explain the artifact (the on-demand channel),
// never a maintained doc.
//
// `freshVerified`: a fresh model, given the glyph and nothing of its sense, recovers the operation.
// Universal math/logic notation passes by ubiquity; `↾`/`⟨⟩` were surveyed by fresh readings
// against reader priors and passed. `${}` is a CODE mechanism (resolved at
// eval, not decoded) ⇒ false.

export type Glyph = string;

export interface OperatorEntry {
  /** the dense sense-name an agent-reader dereferences from priors */
  readonly sense: string;
  /** the type signature (`name : Domain → Codomain`, or a usage schema) */
  readonly signature: string;
  /** a fresh model, given the glyph and nothing of its sense, recovers the operation */
  readonly freshVerified: boolean;
}

export const OPERATORS = {
  // ── Definition & comparison ──────────────────────────────────────────────
  '≜': { sense: 'defines', signature: 'name ≜ expr', freshVerified: true },
  '≠': { sense: 'distinct', signature: 'T × T → Prop', freshVerified: true },
  '≽': { sense: 'dominates', signature: 'T × T → Prop', freshVerified: true },
  '≻': {
    sense: 'strictly-dominates',
    signature: 'T × T → Prop',
    freshVerified: true,
  },
  '≅': {
    sense: 'reader-isomorphic',
    signature: '𝒞 × 𝒞 → Prop',
    freshVerified: true,
  },
  '≺': { sense: 'precedes', signature: 'T × T → Prop', freshVerified: true },
  '≥': { sense: 'at-least', signature: 'T × T → Prop', freshVerified: true },
  '≤': { sense: 'at-most', signature: 'T × T → Prop', freshVerified: true },
  '≡': { sense: 'identical', signature: 'T × T → Prop', freshVerified: true },
  '≢': {
    sense: 'not-identical',
    signature: 'T × T → Prop',
    freshVerified: true,
  },
  '⟨': {
    sense: 'tuple-open / modifier-open',
    signature:
      '⟨a, b, …⟩ ordered record · X⟨m⟩ modifier (position-disambiguated)',
    freshVerified: true,
  },
  '⟩': {
    sense: 'tuple-close / modifier-close',
    signature:
      '⟨a, b, …⟩ ordered record · X⟨m⟩ modifier (position-disambiguated)',
    freshVerified: true,
  },
  '⋡': {
    sense: 'does-not-dominate',
    signature: 'T × T → Prop',
    freshVerified: true,
  },
  '⟼': { sense: 'maps-to', signature: 'x ⟼ f(x)', freshVerified: true },
  𝔹: { sense: 'Booleans', signature: '{⊤, ⊥}', freshVerified: true },

  // ── Propositional logic ──────────────────────────────────────────────────
  '¬': { sense: 'not', signature: 'Prop → Prop', freshVerified: true },
  '∧': { sense: 'and', signature: 'Prop × Prop → Prop', freshVerified: true },
  '∨': { sense: 'or', signature: 'Prop × Prop → Prop', freshVerified: true },
  '⊻': {
    sense: 'exclusive-or',
    signature: 'Prop × Prop → Prop',
    freshVerified: true,
  },
  '⇒': {
    sense: 'implies',
    signature: 'Prop × Prop → Prop',
    freshVerified: true,
  },
  '⇏': {
    sense: 'not-implies',
    signature: 'Prop × Prop → Prop',
    freshVerified: true,
  },
  '⇔': { sense: 'iff', signature: 'Prop × Prop → Prop', freshVerified: true },
  '⊥': { sense: 'contradiction', signature: 'Prop', freshVerified: true },
  '∴': { sense: 'therefore', signature: 'Prop ∴ Prop', freshVerified: true },
  '∵': { sense: 'because', signature: 'Prop ∵ Prop', freshVerified: true },

  // ── Quantifiers ──────────────────────────────────────────────────────────
  '∀': { sense: 'for-all', signature: '∀ x : Prop', freshVerified: true },
  '∃': { sense: 'exists', signature: '∃ x : Prop', freshVerified: true },
  '∄': { sense: 'none-exist', signature: '∄ x : Prop', freshVerified: true },

  // ── Sets ─────────────────────────────────────────────────────────────────
  '∈': { sense: 'member', signature: 'El × Set → Prop', freshVerified: true },
  '∉': {
    sense: 'non-member',
    signature: 'El × Set → Prop',
    freshVerified: true,
  },
  // ASCII operators. An encoding filter in the precising-definition grammar (`codePointAt > 0x7f`)
  // barred them for years; `=` and `|` were in live use the whole time, hand-split in code.
  // Fresh verification is the only bar.
  '=': {
    sense: 'equality-binding',
    signature: 'A × A → Prop',
    freshVerified: true,
  },
  '|': {
    sense: 'given ⟨such-that⟩',
    signature: 'A × Cond → A',
    freshVerified: true,
  },
  '+': {
    sense: 'sum-conjunction',
    signature: 'A × A → A',
    freshVerified: true,
  },
  '⊆': { sense: 'subset', signature: 'Set × Set → Prop', freshVerified: true },
  '⊂': {
    sense: 'proper-subset',
    signature: 'Set × Set → Prop',
    freshVerified: true,
  },
  '⊇': {
    sense: 'superset',
    signature: 'Set × Set → Prop',
    freshVerified: true,
  },
  '⊕': {
    sense: 'direct-sum ⟨composition of parts into a whole⟩',
    signature: 'A × A → A',
    freshVerified: true,
  },
  '∪': { sense: 'union', signature: 'Set × Set → Set', freshVerified: true },
  '∩': {
    sense: 'intersection',
    signature: 'Set × Set → Set',
    freshVerified: true,
  },
  '⋃': {
    sense: 'n-ary-union',
    signature: 'Set[Set] → Set',
    freshVerified: true,
  },
  '∅': { sense: 'empty', signature: 'Set', freshVerified: true },
  '×': { sense: 'product', signature: 'Set × Set → Set', freshVerified: true },
  ℘: { sense: 'power-set', signature: 'Set → Set[Set]', freshVerified: true },
  '⊊': {
    sense: 'proper-subset',
    signature: 'Set × Set → Prop',
    freshVerified: true,
  },
  '⊔': { sense: 'join', signature: 'Set[El] → El', freshVerified: true },

  // ── Maps ─────────────────────────────────────────────────────────────────
  '→': { sense: 'maps', signature: 'A → B', freshVerified: true },
  '↦': { sense: 'sends', signature: 'x ↦ y', freshVerified: true },
  '⇀': { sense: 'partial-map', signature: 'A ⇀ B', freshVerified: true },
  '↣': { sense: 'injective-map', signature: 'A ↣ B', freshVerified: true },
  '⊨': { sense: 'entails', signature: 'X ⊨ Y', freshVerified: true },
  '↾': {
    sense: 'restriction',
    signature: 'X ↾ Y — X narrowed to scope Y',
    freshVerified: true,
  },
  '∘': {
    sense: 'compose',
    signature: '(B → C) × (A → B) → (A → C)',
    freshVerified: true,
  },

  // ── Enumeration ──────────────────────────────────────────────────────────
  '·': { sense: 'and-list', signature: 'a · b · c', freshVerified: true },
  '…': { sense: 'and-so-on', signature: '{ a, b, … }', freshVerified: true },

  // ── Provenance / representation (ASCII) ──────────────────────────────────
  '@': {
    sense:
      'resides-at / sourced-from — the authoritative on-disk or subsystem home of a fact',
    signature: 'fact @ location',
    freshVerified: true,
  },

  // ── Reference mechanism (value algebra; ASCII) ───────────────────────────
  '${}': {
    sense: 'esm-reference',
    signature:
      '${value} — template-literal interpolation of another value, resolved at eval',
    freshVerified: false,
  },
} as const satisfies Record<Glyph, OperatorEntry>;
