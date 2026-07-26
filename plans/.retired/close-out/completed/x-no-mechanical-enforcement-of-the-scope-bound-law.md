# no mechanical enforcement of the scope-bound law: dispatch(P) and not serves(a,P) implies a in file-or-triage is declared but unenforced

> FILED, not specified. A stub: symptom + locus + provenance, no census, no
> acceptance. It exists so the defect was not chased when it was found. Whoever
> promotes it to `ready` owes it a real spec (`/praxis upsert`).

**Symptom.** no mechanical enforcement of the scope-bound law: dispatch(P) and not serves(a,P) implies a in file-or-triage is declared but unenforced

**Locus.** _(unfilled — the filer may not have known)_

**Provenance.** Filed 2026-07-26 from `44ece48`, while executing `praxis repair`.

## Decided 2026-07-26 (mav) — DECIDED NOT TO BUILD, and the reasoning is the deliverable

The law is `dispatch(P) ∧ ¬ serves(a, P) ⇒ a ∈ { file, triage }`. It is declared in the
praxis cell and unenforced. That is deliberate now, not an omission.

**What a mechanical enforcer would have to decide is `serves(a, P)` — and that is a
semantic judgment, not a computable predicate.** A shard's outputs are prose paths; a
commit's files are facts; the relation between them is intent. Every candidate proxy
fails, and each fails in the direction that makes the gate worse than nothing:

- _"Flag a commit touching files outside the bound plan's shard outputs."_ This session
  would have convicted the guardrail re-anchor (a regression fix, correctly in-path), the
  four V7-API integration repairs (in-path by definition), and every `file` call itself.
  A gate that convicts the correct behaviour trains you to ignore it.
- _"Flag commits made while the frontier is empty."_ Also wrong: integration, mirror
  sync and retirement all legitimately happen with no active shard.
- _"Require a filed stub per out-of-plan fix."_ Unfalsifiable — a stub can be filed to
  satisfy the check without the discipline it stands for.

**The gradient is already fixed, which is what actually mattered.** The diagnosed cause
was never absent enforcement; it was that filing cost ~10 minutes against ~2 to just fix
the thing, so the incentive pointed at branching every single time and no rule survives
that arithmetic. `praxis file` now costs **17ms**, measured. This session filed twelve
defects and chased none — under the old cost, most would have been chased.

**And building it would be my own named failure mode.** `procedural: "I flee to
mechanism — standing relapse. On semantic-judgment work I reach for provable mechanics
and faithfully relocate garbage."` A Stop-hook that mechanically adjudicates whether an
act serves an objective is that relapse with a gate around it.

**What would change this verdict:** a shard declaring its outputs as _machine-checkable
globs_ rather than prose. Then `serves(a, P)` becomes decidable for the file-touching
half, and the gate could convict without guessing. That is a change to the shard SHAPE,
not a hook — and it is the honest form of this request. Re-open it there if wanted.
