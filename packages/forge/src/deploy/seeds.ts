// The self-authored instance layers an agent carries beside its def — the v2
// (CoALA) stores the `memory` tool owns:
//   SEMANTIC.md    — identity facts + durable agent-intrinsic knowledge; the
//                    hot index (the vault carries the cold corpus).
//   PROCEDURAL.md  — inductively generalized cross-project wisdom NOT already
//                    carried by a projection (agent definition · skills · gates); the
//                    projection-dedup bar governs every write.
//   EPISODIC.jsonl — the raw append-only event log.
// Seeded-if-absent, NEVER clobbered: the def (Target) is generated substance,
// overwritten freely; these are the self-authored individual, protected from
// every regen (`substance-over-accident`). Skills have no sidecars — seeding
// is agent-only.
//
// The v1 stores {SELF.md, MEMORY.md} are RETIRED: deploy never seeds them — a
// home carrying only v2 stores stays v1-free across every deploy (no
// resurrection). Deploy is one of those organs: EVERY organ that touches the
// stores moves with them, and one that does not silently undoes the retirement.
//
// EPISODIC is a JSONL event log: `memory encode` mints a ULID and appends
// one open record per salient event. A JSONL store carries no prose, so a
// fresh agent seeds an EMPTY `.jsonl` file; the protocol that governs it lives
// once in the Target's verbatim Protocol dimension, never duplicated into the data
// store.

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

// The retired TODO here told its own successor to `export { seedTemplates as
// SEED_FILES } from '@cratylus/memory'` once memory shipped that export. Memory
// SHIPS IT (`memory/src/seeds.ts`, `./seedTemplates` subpath) — and the remedy is
// still REFUSED: `ARCHITECTURE.md`'s north-star graph has NO `forge → memory`
// edge, and forge declares only `@cratylus/runtime` + `@cratylus/schema`. Taking
// the import would add an edge the north star does not contain, which is an
// architecture amendment, not a refactor. The one shared ancestor both packages
// already reach — runtime — is the per-host CONTRACT leaf ("pure types plus one
// identity helper"), so parking store prose there relocates ownership away from
// memory rather than resolving it.
//
// So this copy STAYS, under a contract instead of a promise: it is byte-identical
// to `memory/src/seeds.ts`, and `memory/test/seed-parity.test.ts` FAILS the moment
// it is not. Edit the prose here and that test goes red until memory matches.
// Memory is the prose authority; this is the mirror.
/** (filename, seed-fn) — Target (the def) is generated, not seeded here. */
export const SEED_FILES: ReadonlyArray<[string, (name: string) => string]> = [
  ['SEMANTIC.md', semanticSeed],
  ['PROCEDURAL.md', proceduralSeed],
  ['EPISODIC.jsonl', episodicSeed],
];
