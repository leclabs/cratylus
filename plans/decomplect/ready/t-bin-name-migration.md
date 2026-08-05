# The two bins are the last artifacts wearing the retired `agent-` prefix

> Filed 2026-08-05, in the same act that landed the `@cratylus/*` scope. The brand anchor the bin
> literal was waiting on has converged; this shard is the deferred half of that landing.

## Why this is a separate shard and not part of the rename

`packages/runtime/src/bin-name.ts` had carried, since `install-parity` S4:

> The value is a PLACEHOLDER: the brand anchor is cratylism-gated and has not converged. Nothing here
> decides it. Flipping this one symbol is the whole rename.

The anchor converged — `Cratylus` — and every **package** moved with it. Neither **bin** did. That
split is deliberate and load-bearing:

- **A package name is free.** All seven packages are `0.0.0` and every one 404s on the registry, so
  renaming them costs nothing and is fully reversible.
- **A bin name is a migration.** Deployed skill shims on hosts already invoke
  `agent-runtime <capability>`. Flipping the literal strands every deployed shim until a redeploy
  reaches that host — and the fleet is seven hosts, not one.
- **Attribution.** Renaming packages and bins in one commit makes a host-side failure
  unattributable: a shim that breaks after a 500-file rename could be the scope move or the bin move,
  and the render oracle cannot tell you which.

## What moves

| site                            | now             | after                          |
| ------------------------------- | --------------- | ------------------------------ |
| `runtime/src/bin-name.ts`       | `agent-runtime` | ⊥ — **not yet derived**        |
| `invoke/package.json` `bin` key | `agent-runtime` | same value, by test obligation |
| `forge/package.json` `bin` key  | `agent-forge`   | ⊥ — **not yet derived**        |
| root `package.json` `canon:*`   | `agent-forge …` | follows forge's bin            |

## The naming is NOT settled — do not assume it

`cratylus` and `cratylus-forge` are the obvious guesses and neither has been derived. Both bins land
on a user's `PATH`, which is a different occupancy problem from a scoped package name: the namespace
is every executable on the machine, and it is global and unscoped. Run the full round-trip — forward
argmin, **blind reverse decode**, occupancy check against a real `PATH` — before minting either.

Open questions the derivation must answer, not assume:

- **One bin or two?** The two-entry structure is real (two DAGs, build time and run time) and
  `ARCHITECTURE.md` records why merging them would undo it. But two bins is not the only way to
  surface two entries — one bin with two command groups is a live alternative, and choosing it is a
  design decision, not a rename.
- Whether the run-time bin should name the runtime, the mark, or the act.

## Constraints

- `RUNTIME_BIN` is the one home; `canon/test/bin-name-single-home.test.ts` asserts the manifest agrees
  with it. A rename cannot half-land — that is what the module bought, and it still holds.
- Three of four speaking sites emit the name from **inside an artifact** (a projected
  `scripts/<cap>.mjs`, a generated hook `.sh`) where no compiler can see it. A missed site fails on a
  host at runtime, not at build. This is not hypothetical — it already happened once.
- `forge`'s bin is build-time only and reaches no host, so it is the cheaper of the two. That is a
  reason to sequence it first, **not** a reason to move it alone: leaving one bin prefixed and one not
  is worse than the current state, where both are consistently stale.

## Acceptance

- Both bin names derived by the full round-trip, or explicitly returned `⊥` with the placeholder
  restated and this shard left open. `⊥ IS A RESULT`.
- `pnpm canon:project && pnpm canon:project:codex` re-baselined **in the same commit**, both targets,
  render dirs removed first (`agent-forge project` does not clean — see
  `pending/project-never-cleans-its-out-dir.md`).
- `pnpm canon:deploy` run, and the deployed shims on every host verified to invoke the new name.
  **The redeploy is part of this shard, not a follow-up.**
- No site left interpolating the old literal: `grep -rn 'agent-runtime\|agent-forge'` returns only
  history under `plans/`.
