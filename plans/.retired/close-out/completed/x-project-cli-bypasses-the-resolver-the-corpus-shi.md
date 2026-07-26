# project-cli bypasses the resolver - the corpus ships from this entry point and it never folds

> FILED, not specified. A stub: symptom + locus + provenance, no census, no
> acceptance. It exists so the defect was not chased when it was found. Whoever
> promotes it to `ready` owes it a real spec (`/praxis upsert`).

**Symptom.** project-cli bypasses the resolver - the corpus ships from this entry point and it never folds

**Locus.** _(unfilled — the filer may not have known)_

**Provenance.** Filed 2026-07-26 from `16538f5`, while executing `V8`.

## Decided 2026-07-26 (mav) — CLOSED, not deferred

`project-cli.ts` calls `projectPluginSet` without `resolvedBodies`, so the canon ship
path does not fold. Measured and true. **Wiring it anyway would be theatre**, and here
is the reasoning, recorded so nobody re-opens it on the strength of the symptom alone:

The fold's input is `patches`. V8 established — and I confirmed — that `patches` is
**totally unreachable** from `agents.config.ts`: a string fragment's node object exists
only inside a discovery, so no consumer can hold one to patch it, and any authored patch
can only ever produce `MissingExtendsTargetError`. Separately, canon is a **plugin**, not
a consumer; it has no `agents.config.ts` and authors no patches at all.

So wiring the canon path would mean computing `resolveFragmentBodies(discovery, [])` —
provably the identity, on an input that is provably always empty, twice over. It would
add a call site, a code path, and a false impression of coverage, and would change no
byte of the render tree. A fold that cannot fold is not a pipe; it is decoration.

**The real dependency is the reverse.** This becomes worth wiring the moment `patches`
is authorable — i.e. when the reference-bearing authoring shape lands (`config.ts:26-29`,
NORTH-STAR §11, tracked in the sibling stub). Until then the honest state is: forge's
`project` command folds because a consumer might patch; canon's does not because canon
cannot. Recorded on the caller, so the asymmetry reads as intended rather than missed.
