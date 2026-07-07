// `SkillCell` — the migration-grade skill module shape (T1.3). It carries the
// canonical cell body VERBATIM (the byte-anchor for the round-trip) alongside the
// typed metadata fields. It mirrors the Python `render: verbatim` discipline:
// the body is authored operative content reproduced byte-for-byte, never
// re-synthesized from fields.
//
// RELATION TO `@leclabs/agent-forge/anatomy`'s `Skill`: SkillCell carries the same
// `name / trigger / delineation / verb / formalBlock`. It DIVERGES on two axes,
// both deliberate and both flagged as findings for T1.2:
//   1. `composition` is sibling-skill name ANCHORS (`readonly string[]`), not the
//      anatomy's eager `readonly Skill[]` — the skill graph has genuine cycles
//      (conceptualize↔exemplify↔signify↔materialize, elicit↔probe), so eager
//      `const`-reference imports would hit ESM temporal-dead-zone. Resolving an
//      anchor to a live `Skill` wants a lazy thunk; the anatomy type should
//      become `composition: () => readonly Skill[]` (or the graph proven acyclic).
//   2. `body` is the verbatim canonical cell body — the projection payload. The
//      anatomy `Skill` is the COMPOSED shape; SkillCell is the SOURCE-cell shape.

/**
 * A skill cell as a typed module (source grain), carrying its verbatim body.
 *
 * The `name` is the anchor: the trigger is `/`+name and the verb is derivable, so
 * NEITHER is stored (they restate the filename). `delineation` is the residue-tight
 * one-line bound; `formalBlock` is the skill's PRIMARY σ* payload (its content
 * formalization is the S/E2a task, not here).
 */
export interface SkillCell {
  /** Front-matter `name:` — the anchor (trigger = `/`+name). */
  readonly name: string;
  /** Front-matter `delineation:` — the residue-tight one-line bound. */
  readonly delineation: string;
  /** The self-sufficient set-builder block (the skill's primary σ* payload). */
  readonly formalBlock: string;
  /** Sibling-skill composition anchors (cycle-safe; resolved lazily by T1.2). */
  readonly composition: readonly string[];
  /** The canonical cell body (`split('---',2)[2]`) — the projection payload. */
  readonly body: string;
}
