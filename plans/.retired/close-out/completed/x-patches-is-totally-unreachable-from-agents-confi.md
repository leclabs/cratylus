# patches is TOTALLY unreachable from agents.config.ts - a string fragment node exists only inside a discovery

> FILED, not specified. A stub: symptom + locus + provenance, no census, no
> acceptance. It exists so the defect was not chased when it was found. Whoever
> promotes it to `ready` owes it a real spec (`/praxis upsert`).

**Symptom.** patches is TOTALLY unreachable from agents.config.ts - a string fragment node exists only inside a discovery

**Locus.** _(unfilled — the filer may not have known)_

**Provenance.** Filed 2026-07-26 from `16538f5`, while executing `V8`.

## Measured and ROUTED 2026-07-26 (mav) — canon candidate, nico's remit

**Quantified.** Across `packages/canon/src/dimensions/`: **142 fragment modules,
142 string-form, 0 node-form.** So `patches` is not partially unreachable — it is
unreachable for the _entire_ canon. V8's "totally" is exact.

**The mechanism, stated precisely.** `config.ts:26-29` requires patches to target a
fragment _by its imported binding_ — "addressing by imported binding, never a string id;
NORTH-STAR §3". A **node-form** fragment exports an object a consumer can import and
patch. A **string-form** fragment does not: its node is minted at scan time inside the
discovery (`catalog/index.ts:270-274`, id `<plugin>:<dim>/<export>`), so no consumer can
ever hold the object, and `MissingExtendsTargetError` is the only reachable outcome of
any authored patch. With 0 node-form fragments, the feature has no live surface at all.

**Why I am not resolving this.** Every available fix is canon-shaped, not a defect fix:

1. **Convert fragments to node-form** — 142 authored modules change shape. That is a
   canon authoring decision with a 142-file blast radius.
2. **Let `patches` target by string id** — resolvable and small, but it contradicts
   NORTH-STAR §3 head-on. §3 is a stated principle; overturning it is a governance act,
   not a refactor.
3. **Retire `patches`** — legitimate, and arguably honest given it has never had a live
   surface. Also a canon decision: it deletes a declared consumer capability.

The design already classifies this correctly — `config.ts:28-29` calls the fix "the
reference-bearing authoring shape **deferred as a canon candidate**, NORTH-STAR §11".
It is filed exactly where it belongs; what was missing was the measurement, which is now
here.

Per the apex order (`cratylism ≻ VISION ≻ MODEL`), option 2 is a VISION-adjacent conflict
to be SURFACED, never unilaterally edited. **Routed to nico as a canon candidate**,
alongside the twelve flags already homed in this plan's §Canon-reconciliation.

**Consequence to carry meanwhile:** V8's resolver→projector pipe is live through the
programmatic seam and dormant through the CLI. That is correct and costs nothing today —
but it means the pipe is unexercised in production, so whichever option lands above must
re-verify it rather than assume V8's differential test still covers the real path.
