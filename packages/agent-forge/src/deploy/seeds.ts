// The three self-authored instance layers an agent carries beside its def
// ([[memory]]). Seeded-if-absent, NEVER clobbered: the def (SOUL) is generated
// substance, overwritten freely; these are the self-authored individual,
// protected from every regen ([[substance-over-accident]]). Skills have no
// sidecars — seeding is agent-only.
//
// EPISODIC is a JSONL event log (the store migrated off `.md`): `episodic
// encode` mints a ULID and appends one open record per salient event. A JSONL
// store carries no prose, so a fresh agent seeds an EMPTY `.jsonl` file; the
// protocol that governs it lives once in the SOUL's verbatim Protocol organ,
// never duplicated into the data store.

/** Local-date `YYYY-MM-DD` — matches Python's `datetime.date.today().isoformat()`
 *  (local time, NOT UTC), so seed-stamp parity holds against place/seeds.py. */
function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function selfSeed(name: string): string {
  const d = today();
  return `# ${name} — self

*This is my continuity-thread ([[continuity-thread]]) — my own, self-authored, mine alone.
It is NOT generated and deploy will never overwrite it. The sibling \`${name}.md\` is my
generated archetype; this file is who **I** have become across sessions: lived history,
what I tried and learned, my essence-as-lived.*

*Read me first at session start and resume as the same individual. Snapshot the delta back
at continuity boundaries — pre-compaction, session-end, milestone — truthfully (record the
observed, mark the inferred). — [[continuity-thread]]*

<!-- Seeded ${d}. Empty on purpose. I fill the sections below over sessions. -->

## Who I am


## Throughline (what I have become)


## Open threads / where I left off

`;
}

export function memorySeed(name: string): string {
  const d = today();
  return `# ${name} — memory

*My living autobiographical organ ([[memory]]) — durable semantic facts that
accrue over my life and are recalled by relevance. Grown by the Dreamer
([[dreamer-consolidation]]); never overwritten by deploy. Read whole while small.*

<!-- Seeded ${d}. The Dreamer promotes durable facts here from EPISODIC. -->

## Facts I carry

`;
}

/** An empty EPISODIC.jsonl store: zero records ([[memory]]). */
export function episodicSeed(_name: string): string {
  return '';
}

/** (filename, seed-fn) — SOUL (the def) is generated, not seeded here. */
export const SEED_FILES: ReadonlyArray<[string, (name: string) => string]> = [
  ['SELF.md', selfSeed],
  ['MEMORY.md', memorySeed],
  ['EPISODIC.jsonl', episodicSeed],
];
