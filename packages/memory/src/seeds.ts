// The self-authored instance layers a fresh agent home carries beside its def —
// the v2 (CoALA) stores:
//   SEMANTIC.md    — identity facts + durable agent-intrinsic knowledge; the
//                    hot index (the vault carries the cold corpus).
//   PROCEDURAL.md  — inductively generalized cross-project wisdom NOT already
//                    carried by a projection (agent definition · skills · gates); the
//                    projection-dedup bar governs every write.
//   EPISODIC.jsonl — the raw append-only event log.
// Seeded-if-absent, NEVER clobbered: a home is provisioned once and an existing
// store is never overwritten (`substance-over-accident`).
//
// TWO writers provision a home — `memory init` (wake-register) and forge's
// deploy seed site — so the seeded prose NAMES NEITHER OF THEM. A store that
// said "`memory init` never overwrites me" was lying whenever deploy wrote it,
// and vice versa; the invariant the agent needs is the property, not the
// provisioner. See `test/seed-parity.test.ts`, which fails the moment these
// bytes and forge's copy disagree.
//
// EPISODIC is a JSONL event log: `memory encode` mints a ULID and appends one
// open record per salient event. A JSONL store carries no prose, so a fresh
// home seeds an EMPTY `.jsonl` file; the protocol that governs it lives once in
// the Target's verbatim Protocol dimension, never duplicated into the data store.

/** Local-date `YYYY-MM-DD` (local time, NOT UTC) — the seed stamp. */
function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function semanticSeed(name: string): string {
  const d = today();
  return `# ${name} — semantic

*My semantic store (\`memory\`) — identity facts + durable agent-intrinsic knowledge; the hot
index (the vault carries the cold corpus). Self-authored, grown at dream; seeded once, never
overwritten. Read whole at wake. Agent-intrinsic ONLY: a project- or plan-scoped fact lives
in that node's AGENTS.md, never here.*

<!-- Seeded ${d}. Empty on purpose. Dream promotes durable facts here from EPISODIC. -->

## Identity


## Facts I carry

`;
}

export function proceduralSeed(name: string): string {
  const d = today();
  return `# ${name} — procedural

*My procedural store (\`memory\`) — inductively generalized, cross-project wisdom NOT already
carried by a projection (agent definition · skills · gates); the projection-dedup bar governs every
write: already-projected ⇒ not stored. Grown at dream (\`correction-consolidation\`); seeded once,
never overwritten. Read whole at wake.*

<!-- Seeded ${d}. Empty on purpose. Dream distils corrections into standing dispositions here. -->

## Dispositions

`;
}

/** An empty EPISODIC.jsonl store: zero records (`memory`). */
export function episodicSeed(_name: string): string {
  return '';
}

/**
 * The memory store seed templates — `(filename, seed-fn)` pairs `memory init`
 * writes IF-ABSENT when provisioning a home.
 *
 * ONE WRITER, again. Forge's deploy carried a byte-parallel copy so it could seed a
 * home for every agent it projected, and `test/seed-parity.test.ts` existed to make
 * the two copies' drift impossible to ship — it was written after one copy told the
 * agent "deploy never overwrites me" while the other said "`memory init` never
 * overwrites me", which made the sentence in any given home false half the time.
 * The canon's memory cells are gone, deploy stopped seeding with them, and the copy
 * and its parity gate went too. Reintroduce a second writer and the gate comes back
 * with it: the north-star graph (`ARCHITECTURE.md`) has no `forge → memory` edge, so
 * a shared home for these bytes is an architecture amendment, not a refactor.
 */
export const seedTemplates: ReadonlyArray<[string, (name: string) => string]> =
  [
    ['SEMANTIC.md', semanticSeed],
    ['PROCEDURAL.md', proceduralSeed],
    ['EPISODIC.jsonl', episodicSeed],
  ];
