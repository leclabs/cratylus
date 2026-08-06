# x-second-deploy-manifest

> **RULING OWED — the repair is an irreversible host-side act and is the operator's to sign
> off.** Filed, verified, and deliberately NOT executed.

## Symptom (verified 2026-08-06)

Two deploy manifests claim the same target tree:

- `~/.claude/.agent-forge/deploy-manifest.json` — 2026-08-04, **retired brand**
- `~/.claude/.forge/deploy-manifest.json` — 2026-08-05, live

**40 of 40 target paths in the retired-brand manifest are also claimed by the live one —
100% overlap.** Every `agents/*.md` and `skills/*` among them. The filing that raised this
said the stale record "claims the same target paths"; measured, it is not an overlap but
total shadowing.

## Why it matters

The pruner removes only what it can account for having written. A path owned by the stale
record is unattributable, so it is never pruned — the same "two records, one target tree"
hazard the render oracle's own local-tree caveat warns about, and it will silently outlive
every future deploy.

## Why it is not repaired here

Deleting a deploy manifest is a host-side, irreversible act outside the workspace. Which
record is authoritative is a decision with a value dimension (the stale one may hold the only
account of artifacts the live one never wrote). That is a fork the principal does not resolve.

**Recommendation, so the fork arrives with a pick:** the live `.forge/` record is
authoritative — it is newer, brand-current, and a superset (43 entries to 40). Reconcile by
confirming the 3 entries unique to `.forge/`, then delete `~/.claude/.agent-forge/` entirely.
The 40 shadowed paths are byte-identical claims, so nothing is lost.

## Provenance

Filed from `df3aad73` while executing `t-ground-row-truth`; symptom re-measured and corrected
at `8b8a8df8`.
