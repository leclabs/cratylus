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

/** A skill cell as a typed module (source grain), carrying its verbatim body. */
export interface SkillCell {
  /** Front-matter `name:`. */
  readonly name: string;
  /** Front-matter `trigger:` (e.g. `/introspect`). */
  readonly trigger: string;
  /** Front-matter `delineation:`. */
  readonly delineation: string;
  /** The H1 verb. */
  readonly verb: string;
  /** The first fenced block's interior (the self-sufficient set-builder), if any. */
  readonly formalBlock: string;
  /** Sibling-skill composition anchors (cycle-safe; resolved lazily by T1.2). */
  readonly composition: readonly string[];
  /** The canonical cell body (`split('---',2)[2]`) — the round-trip byte-anchor. */
  readonly body: string;
}
