---
kind: principle
delineation: A plan is a transient execution scaffold, not a record — retire (delete) a completed plan once its result is in the source of truth and its durable rationale has a permanent home; git history is the recovery net, so a kept completed plan is only palimpsest.
---

# Plan Retirement

A plan is a **transient execution scaffold** ([[doc-mirrors-runtime-truth]]: PLAN.md mirrors the work, it is never the work), not a durable record. Once the work is done, the scaffold comes down.

Retire — **delete** — a completed plan when both hold:

- **(a) The result is in the source of truth** — the code, the corpus, the deployed artifact carries the outcome.
- **(b) The durable rationale has a permanent home** — the _why_ survives in code, an `AGENTS.md` runbook, or a corpus cell; nothing load-bearing lived only in the plan.

git history is the recovery net: a deleted plan is always recoverable (`git log --all -- plans/<name>/`), so retiring loses nothing. Keeping a finished plan is [[palimpsest]] — a reader infers live work where there is none, the rot [[clean-slate]] strips at every grain. The plan was only ever a projection of the work, never its source ([[projection-is-not-the-source]]).

## See also

- [[sharded-plan-layout]] — the scaffold this retires; `completed/` is the terminal state before deletion.
