---
kind: principle
delineation: A plan is a transient execution scaffold, not a record — retire (delete) a completed plan once its result is in the source of truth and its durable rationale has a permanent home; git history is the recovery net, so a kept completed plan is only palimpsest.
---

# Plan Retirement

A plan is a transient projection of the work, never its source ([[doc-mirrors-runtime-truth]], [[projection-is-not-the-source]]).

Retire — **delete** — a completed plan when both hold:

- **(a) The result is in the source of truth** — the code, the corpus, the deployed artifact carries the outcome.
- **(b) The durable rationale has a permanent home** — the _why_ survives in code, an `AGENTS.md` runbook, or a corpus cell; nothing load-bearing lived only in the plan.

git history is the recovery net (`git log --all -- plans/<name>/`). A kept completed plan is [[palimpsest]] — the rot [[clean-slate]] strips.

## See also

- [[sharded-plan-layout]] — the scaffold this retires; `completed/` is the terminal state before deletion.
