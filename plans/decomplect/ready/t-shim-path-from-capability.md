# The cell hard-codes a path the projector already computes

> Census: [`CENSUS-2026-08-05.md`](../CENSUS-2026-08-05.md). Every number below was measured,
> not quoted forward.

## Intent

The runtime shim path is stated **twice** per skill: correctly as a structured binding
(`runtime: { capability: 'memory' }`), and again as a hard-coded literal inside the σ\* formal
block. `forge/src/core/exemplify/skill-cell.ts:97-99` renders the binding line from the field, and
`forge/src/project/runtime-shim.ts:78` owns the layout. **The cell restates what forge derives.**

The duplication is visible in the render: `.render-ts/skills/wake/SKILL.md:43` carries the
forge-derived line while `:24` and `:30` carry the cell's own literal.

## Measured

20 literals total. **This shard is the `memory` half: 15 literals across 3 cells** — `dream` (9),
`wake` (2), `handoff` (1), plus adjacent prose. The 5 `scripts/eventTap.mjs` literals are **out of
scope** and wait on `t-tap-anchor`: the literal is `f(capability)`, so settling that sign settles them.

## Constraints

- Express the verbs against the capability; let forge's one line supply the path.
- **These are shipped cells — the render oracle WILL move.** That is expected and must be argued in
  the commit, with the diff shown to be only the removed restatement.

## Acceptance

- No `scripts/memory.mjs` literal survives in `packages/canon/src`.
- The rendered SKILL.md still tells a reader where the shim is — via the forge-derived line.
- Oracle re-baselined **deliberately**, with the byte diff quoted.
