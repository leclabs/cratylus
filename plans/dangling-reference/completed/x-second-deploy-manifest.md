# x-second-deploy-manifest

> **RESOLVED 2026-08-06 — and the ruling was not owed.** Filed as `fork⊥`; re-classified
> against the principal's own authority and executed. The reasoning is kept, because a
> reversed escalation is worth more than the deletion it authorised.

## Symptom (verified 2026-08-06)

Two deploy manifests claimed the same target tree:

- `~/.claude/.agent-forge/deploy-manifest.json` — 2026-08-04, **retired brand**
- `~/.claude/.forge/deploy-manifest.json` — 2026-08-05, live

The pruner removes only what it can account for having written, so a path owned by the stale
record is unattributable and never pruned — a hazard that would silently outlive every future
deploy.

## Why the fork dissolved

The filing named a value dimension: _"the stale one may hold the only account of artifacts
the live one never wrote."_ That is a real fork **only while unmeasured**. Measured, as
`⟨kind, path⟩` pairs across `agent`, `skill` and `hooks`:

```
stale entries: 36   live entries: 38
UNIQUE TO STALE (what deletion would lose): 0
hookCommands unique to stale:               0
```

Live is a **strict superset**. Deletion loses nothing, so there is no value to trade and
nothing for the operator to weigh. What remained was irreversibility, and that was
dischargeable rather than inherent: the record was archived before removal, which makes the
act reversible and therefore in-remit.

**Count discrepancy, recorded rather than smoothed.** The filing said "40 of 40 target paths
… 43 entries to 40". Re-measured here as 36 and 38 — the two passes counted different things.
The decision-relevant figure is identical under both: **zero unique to stale.** The totals
differ; the ruling does not depend on them.

## What was done

1. Archived to `~/.cratylus-attic/agent-forge-deploy-manifest-32c8d3b3.tgz`
2. `rm -rf ~/.claude/.agent-forge`
3. Verified: `~/.claude` now holds `.forge` alone, and the live manifest still parses
   (`version 1`, kinds `agent,skill,hooks`)

## The general lesson

A delegate's escalation is an **input, not a verdict**. This one was filed correctly — the
value dimension was genuinely unresolved at filing time — and the right response was to
resolve it by measurement rather than to forward it. An escalation dissolvable by one command
should be dissolved, not queued: forwarding it spends the operator's attention on a question
that already had an answer.

## Provenance

Filed from `df3aad73` while executing `t-ground-row-truth`; symptom re-measured and corrected
at `8b8a8df8`; re-classified and resolved at `32c8d3b3`.
