# T2 · enumerate-shard

**Wave** 0 · **Deps** none · **State** ready

## Objective

Discover the corpus at runtime: enumerate EVERY context fragment agent-factory ships (agent-vector
organ values, skill process fragments, rules, CLAUDE.md/AGENTS.md fragments, any composable the
project delivers), and partition them into MECE shards — one shard = one orthogonal concern cluster —
emitting the work-list the SWEEP phase fans out over. No realignment here; discovery + partition only.

## Steps

1. Enumerate all fragment classes the project treats as shippable context composables. Derive the
   taxonomy from the repo's own structure at runtime — do NOT assume a layout from memory.
2. Partition into shards along orthogonal boundaries (by organ, by skill, by artifact class — cut so
   shards don't collide and each is end-to-end on one concern). Maximize shard count that stays MECE
   (wider SWEEP fan-out).
3. Emit the work-list: `[ { shard_id, concern, fragment_refs[] } ]`.

## Acceptance (falsifier)

- FAIL if the inventory is not collectively exhaustive — a fragment class exists in the repo that no
  shard covers (spot-check: pick a random shipped composable; it must map to exactly one shard).
- FAIL if shards overlap (a fragment in two shards) — MECE violated.
- FAIL if partition is by incidental boundary (file size, directory happenstance) rather than
  orthogonal concern.

## Return

The work-list `[ { shard_id, concern, fragment_refs[] } ]` + the coverage argument (why exhaustive)

- the MECE argument (why disjoint). This return is the dep-fed input that instantiates the SWEEP tasks.

---

## Outcome — PASS (2026-07-03)

Work-list emitted → `completed/T2-worklist.md`. 27 MECE shards (24 organ + S-skills/S-agents/S-special)
over 159 organ-fragments + 15 skills + 12 agents + special/governance. Coverage exhaustive (excluded set =
toolkit machinery + generated, proven non-shippable); disjoint (class→organ dirs); orthogonal (anatomy axis,
not file happenstance). Ts pre-satisfied 2 fragments (nico-archetype-cyan, cold-decode-oracle) → T3 skips them.
