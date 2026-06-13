# A2 — author-the-sociology

**State:** completed (2026-06-13) · **Lead:** Nico · **Phase:** A (constitution)

## Intent

Surface polis's latent sociology — personhood, authority, cultural propagation, identity — as explicit
corpus: each a named cell or coherent composite, no implicit sociology remaining.

## Method — audit then mint (anchor-routing: mint only the homeless)

Audited the four pillars against the 137-cell corpus. Three were already anchored; one had a real gap.

- **Authority** — anchored: `scope-grant`, `scope-precedence-merge-algebra`, `principal-agency`, `sovereign`,
  `genuine-fork`, `subsidiarity-net-zero-corrections`, `decision-at-the-locus-of-need` + A1 `founder-charter` +
  A3 `operator-relation`. No mint.
- **Cultural propagation** — anchored: `substance-over-accident`, `archetype-instantiation`, `commons-distribution`,
  `adopt-the-commons`, `cite-dont-copy`, `projection-is-not-the-source`, `generated-artifact-provenance`,
  `regenerate-without-clobbering`. No mint.
- **Identity / marks** — anchored: `agent-identity-portability` (mark + persona-delta facets),
  `named-marker-as-index-key`. No mint (anchor-routing: a standalone `mark` cell would be forcing it).
- **Personhood** — GAP. The pieces existed (`ambient-person-agent`, `continuity-thread`, `episodic-encoding`,
  `dream`, `agent-know-thyself`) but the **4-layer stack as an architecture** had no home — it was emitted as
  prose into every def, and the composer's docstring even referenced `[[identity-memory-stack]]` /
  `[[dreamer-consolidation]]` cells that did not exist. The pieces cited `[[dream]]` (the skill) as a stand-in
  for the stack itself — an overload.

## Outcome

- **Minted `ideas/identity-memory-stack.md`** (kind: structure) — the 4-layer architecture: SOUL (commons-fixed,
  never hand-edited) beneath SELF / MEMORY / EPISODIC (self-authored, deploy-immutable); two motions
  ([[episodic-encoding]] down, [[dream]] up); commons-fixed-vs-self-authored + move-not-copy consolidation.
  Cites the pieces, restates none.
- **Fixed the dangling refs**: composer docstring `[[dreamer-consolidation]]` → `[[dream]]` (dream *is* the
  consolidation); `identity-memory-stack` now resolves. Re-pointed the overloaded "identity-memory stack
  ([[dream]])" → "([[identity-memory-stack]])" in `episodic-encoding` and `agent-know-thyself`.

## Done-when

- Each pillar is a named cell or coherent composite; no implicit sociology remains. ✓
- Schema/refs/fences gates PASS; glossary regenerated (138 exemplars); composer still resolves. ✓

## Finding (→ polis-machinery)

The identity-memory block is **hardcoded prose** in `toolkit/compose/agent.py` (`_identity_block()`), emitted
verbatim into every def. Now that `identity-memory-stack` is a cell, that block should *resolve from* the cell
(exemplar-resolution) rather than be duplicated in the composer — one home, projected. Machinery follow-on;
out of scope for A2 (which authors the corpus truth, not the projection mechanism).
