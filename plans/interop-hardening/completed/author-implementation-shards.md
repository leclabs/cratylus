# author-implementation-shards — one shard per failing-test cluster

**Lane** Nico (plan authoring; implementation lanes assigned per shard) · **wave(3)** · deps:
⊳story-coverage-tests.

## Static

The tracked-failing set + story↔test map (⊳). The praxis execution-spec laws (task =
⟨static, scope, accept⟩, blind-dispatchable, falsifiable accept).

## Scope

Cluster the tracked-failing tests by orthogonal concern (per-adapter · IR/core · pipeline ·
output-surface); author one implementation task file per cluster into THIS plan's `pending/`
(bug fixes, features, improvements — whatever makes that cluster pass); wire the DAG
(maximize-fan-out; disjoint file owned path sets per wave); sync the PLAN.md mirror. Each shard's
accept = its cluster of tests flips to green + no regression + the mapped stories' acceptance
observably holds (a story whose test passes but whose observable behavior still fails = the shard
fails — tests serve stories, not themselves).

## Accept (falsifiers)

- Every tracked-failing test is owned by exactly one shard (a test with zero or two owners fails —
  MECE).
- Every shard is blind-dispatchable (spec-shape check + statics exist); a shard needing plan prose
  fails.
- The emitted DAG's wave(0) has width > 1 unless the clusters are provably serial (single-next-step
  frontier = mis-cut).
