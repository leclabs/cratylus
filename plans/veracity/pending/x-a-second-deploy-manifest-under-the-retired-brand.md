# a second deploy manifest under the retired brand at HOME/.claude/.agent-forge/deploy-manifest.json still claims the same target paths as .forge — two records, one target tree, a pruning hazard

> FILED, not specified. A stub: symptom + locus + provenance, no census, no
> acceptance. It exists so the defect was not chased when it was found. Whoever
> promotes it to `ready` owes it a real spec (`/praxis upsert`).

**Symptom.** a second deploy manifest under the retired brand at HOME/.claude/.agent-forge/deploy-manifest.json still claims the same target paths as .forge — two records, one target tree, a pruning hazard

**Locus.** _(unfilled — the filer may not have known)_

**Provenance.** Filed 2026-08-06 from `13e5f394`, while executing `wake-orientation`.

## VERDICT — VERIFIED 2026-08-06, stronger than filed

Both manifests exist:

- `~/.claude/.agent-forge/deploy-manifest.json` — 2026-08-04, retired brand
- `~/.claude/.forge/deploy-manifest.json` — 2026-08-05, live

The filing says the stale record "claims the same target paths". Measured: **40 of 40 target
paths in the retired-brand manifest are also claimed by the live one — 100% overlap**, every
`agents/*.md` and `skills/*` among them. It is not an overlap, it is total shadowing.

Consequence, as filed and confirmed: the pruner removes only what it can account for having
written, so any path the stale record owns is unattributable and never pruned. This is the
same "two records, one target tree" hazard the render-oracle's own local-tree caveat warns
about. The repair is a decision about which record is authoritative and a deletion of the
other — an irreversible host-side act, so it is the operator's to sign off.
