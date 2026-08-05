> **RE-SCOPED 2026-08-05 by census.** The filed INSTANCE is repaired and the filed PROPERTY is not.
> `toolkit/guardrail/memory-consolidation-nudge.sh:40` now reads `MEM="${MEMORY_BIN:-cratylus-run}"`,
> and `bin-name-single-home.test.ts:142-158` now reads the committed `.sh` — so the gate DOES cross
> the language boundary. For exactly one file, reached by a `targetPath`, not by a scan.
>
> **There are 13 `.sh`/`.mjs` sources under `packages/*/src`. Twelve are watched by nothing** for
> this property. No canon test enumerates them by glob: `command-veracity.test.ts` names two by
> literal, and `harness-parity.test.ts`'s shell strings are synthetic fixtures.
>
> So the shard's acceptance — which quantifies over _"any hand-authored shell or `.mjs` source under
> `packages/_/src`"* — is **unmet**, and the shard's own Constraints section already said the scan
DOMAIN *"is the question, not the assertion"*. That question is now the whole shard. This is also
the property whose absence cost this session a dead `/wake`: an emitted artifact naming a bin is
> exactly where a rename fails on a host rather than at build.

# `bin-name-single-home.test.ts` asserts on TypeScript, and the bin name escapes into `.sh`

> Surfaced 2026-08-05 by the bin migration (`runtime` → `cratylus-run`). The gate did not fail.
> A `grep` found what it missed.

## Symptom

`packages/canon/src/toolkit/guardrail/memory-consolidation-nudge.sh` carried:

```sh
MEM="${MEMORY_BIN:-runtime}"
```

A **second home** for the bin name, in a file the single-home gate does not read.

## Why the gate could not see it

`bin-name-single-home.test.ts` exists to prove exactly one thing: that the bin name has one home
(`RUNTIME_BIN`) and that the sole irreducible second copy — `invoke`'s `bin` key, which npm reads with
no compiler in the loop — agrees with it. It does that by reading **TypeScript source** and the
manifest.

The bin name does not stay inside TypeScript. `bin-name.ts` says so in its own header: _"four packages
speak it, and three of them speak it from INSIDE an emitted artifact (a projected
`scripts/<cap>.mjs`, a generated hook `.sh`) where no compiler can see it."_ The module solved the
**authoring** half — every TS site interpolates the constant. It did not close the **shell** half, and
a hand-written `.sh` under `toolkit/` is neither emitted nor compiled, so nothing was watching it.

This is the same defect one level up that ARCHITECTURE already names for prose: a property enforced
only where the enforcement mechanism happens to reach.

## Why it matters more than it looks

The header also records the failure mode, from experience: _"A rename that missed one produced a
deployed script that failed at runtime on a host, not at build."_ That is the whole cost profile.
A missed TS site is a compile error. A missed shell site is a **green build and a broken host**, and
the shells are precisely the sites the compiler cannot defend.

The migration only caught this one because a full-tree `grep` ran by hand. That is not a gate.

## Constraints

- The gate must not simply forbid the literal — `${MEMORY_BIN:-…}` is a legitimate _override seam_
  and a test seam. What is forbidden is the **default** being a second literal rather than something
  the projection interpolated.
- Scan domain is the question, not the assertion. Candidates: every tracked `.sh`/`.mjs` under
  `packages/*/src`, plus the rendered output. Rendered output is the stronger target — it is where a
  miss actually ships — and `.render-ts` is gitignored, so a render-reading gate must project first
  or run in the `pnpm oracle` path.
- **Do not double-count with the render oracle.** The oracle already pins rendered bytes wholesale;
  a rendered-shim gate must convict on something the hash does not, or it is ceremony. The live gap
  the oracle does **not** cover is hand-authored `.sh` under `src/`, which is what bit here.

## Acceptance

- A gate fails when a bin-name literal is introduced as a default in any hand-authored shell or
  `.mjs` source under `packages/*/src`.
- Control proves it convicts: reintroduce `${MEMORY_BIN:-cratylus-run}` as a bare literal, see red;
  revert, see green.
- The gate names what it permits (override seams) and what it forbids (second homes), so the next
  reader does not delete a legitimate `${VAR:-…}`.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** cell-contract · **wave** 0
- **depends on** `t-worker-payload-seam-and-property-1`
- **writes** `packages/canon/test/bin-name-single-home.test.ts`
- **compiles against** `packages/runtime/src/bin-name.ts`
- **evidence** `packages/canon/test/bin-name-single-home.test.ts`
- **dispatchable** no ruling owed
