# elicit-candidates

**Objective.** Recover the Operator's **intended** concept for each top cluster via `/elicit`
(binary-search by information gain), **starting with `principal-self`** — do not guess what a drifted
fragment meant; interview for it.

**Preconditions.** `clustering/cluster-redundant-fragments` produced ranked clusters. Operator
available (this is a post-handoff, interactive task).

**Operations.**

1. For `principal-self`: run `/elicit` to converge on the single concept the Operator means by a
   principal that owns decisions as a self (the thing Mav/Nico under-adopt). Capture it.
2. For each remaining top cluster: `/elicit` the intended concept + whether the members truly coalesce.
3. Record each recovered concept in `decisions/` (one ADR per resolved cluster).

**Artifacts.** `plans/corpus-signify-pass/decisions/00NN-<concept>.md` (one per cluster).

**Acceptance (blind test).** For every cluster taken, a decision file states the recovered concept
crisply enough that `/signify` can assign its σ\*\_R anchor with no further Operator input.
