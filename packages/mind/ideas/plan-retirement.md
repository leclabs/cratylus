---
kind: principle
delineation: A plan is a transient execution scaffold, not a record — retire (delete) a completed plan once its result is in the source of truth and its durable rationale has a permanent home; git history is the recovery net, so a kept completed plan is only palimpsest. The one exception is the standing plan, which is itself a durable home and so never retires.
---

# Plan Retirement

A plan is a transient projection of the work, never its source ([[doc-mirrors-runtime-truth]], [[projection-is-not-the-source]]).

Retire — **delete** — a completed plan when both hold:

- **(a) The result is in the source of truth** — the code, the corpus, the deployed artifact carries the outcome.
- **(b) The durable rationale has a permanent home** — the _why_ survives in code, an `AGENTS.md` runbook, or a corpus cell; nothing load-bearing lived only in the plan.

git history is the recovery net (`git log --all -- plans/<name>/`). A kept completed plan is [[palimpsest]] — the rot [[clean-slate]] strips.

The one exception is the **standing plan** — a perpetual sharded plan that is itself the durable home for the live backlog and standalone tasks too small for their own initiative. It never satisfies (a): its in-flight work IS the source of truth, never yet subsumed elsewhere. So it never retires; sweep its `completed/` periodically (git remains the recovery net), and when a cluster of its tasks grows into a coherent initiative, promote it back out into its own plan.

## See also

- [[sharded-plan-layout]] — the scaffold this retires; `completed/` is the terminal state before deletion.
