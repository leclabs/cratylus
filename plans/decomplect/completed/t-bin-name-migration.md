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

---

## Resolution — landed 2026-08-05

**`agent-forge` → `cratylus` · `agent-runtime` → `cratylus-run`.** Two bins, not one.

### The topology question, answered against this shard's own guess

This shard listed `cratylus` + `cratylus-forge` as "the obvious guesses" and warned against assuming
them. Correctly: the derivation **inverted** the pairing.

Merging into one bin with two command groups was live and was rejected on two grounds. First, the
run-time bin is invoked almost entirely by **generated artifacts** — the projected
`scripts/<capability>.mjs` shims and the generated hook workers. Merging therefore does not take a
human from two names to one; it takes them from `cratylus project` to `cratylus build project`,
lengthening the surface that _is_ typed to shorten one that is machine-written and free. Second, one
bin means one package owns the `bin` key and must depend on **both** DAGs, so a host that only runs
agents drags the whole projection machinery — re-coupling at distribution precisely what `invoke`
exists to keep apart.

So the brevity budget went to the **human** surface: the bare mark on the build-time CLI, the
explicit compound on the shim-invoked one. `-forge` was redundant anyway once `forge` is the only
build-time package.

### Occupancy — the disqualifications did the work

| candidate                   | verdict                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| `invoke`                    | **disqualified** — pyinvoke installs `invoke` and `inv` on PATH. Fine as a package, not a bin  |
| `forge`                     | **disqualified 5×** — Foundry, jboss-forge (brew records the conflict), ArrayFire, npm, crates |
| `lex`                       | **disqualified** — `/usr/bin/lex`, POSIX, present on the fleet                                 |
| `canon`                     | **disqualified** — a crates.io CLI, and the dominant cold prior is Canon Inc.                  |
| `crat`                      | rejected — reads as _-crat_ (rule/authority), a typo of _crate_, or a truncation               |
| `cratylus` / `cratylus-run` | **clear** — npm, PyPI, crates.io, Homebrew, and the fleet PATH                                 |

Accepted residuals, recorded rather than waved away: `cratylus` gives a cold reader zero functional
signal and has genuinely ambiguous pronunciation — the price of a mark, paid also by `git`, `deno`,
`hugo`. And `-run` may lead a reader toward the `runtime` package when the bin ships from `invoke`;
tolerable, since `invoke` **is** the run-time entry, but it is an imprecision.

### One symbol really was the whole rename

`RUNTIME_CONFIG_NAME` (`.cratylus-run.json`) and `TAP_ID` (`cratylus-run-event-tap`) are
template-derived from `RUNTIME_BIN` and moved **without being edited** — exactly what `bin-name.ts`
was built to buy.

**One second home did surface**, and it is a real gap: a `${MEMORY_BIN:-agent-runtime}` fallback in
`toolkit/guardrail/memory-consolidation-nudge.sh`. `bin-name-single-home.test.ts` could not see it
because that gate asserts on **TypeScript source** and this was a `.sh`. The gate's coverage stops at
the language boundary — and emitted artifacts are exactly where a missed rename fails on a host
rather than at build. Filed as `pending/bin-name-gate-stops-at-the-language-boundary.md`.

### Render oracle re-baselined, and the new gate caught it

`f60e936a…` → `0ac8e09fbbd40077f246d4774da60789cc8b3dbd`. This is the first re-baseline the
`pnpm oracle` gate has ever produced rather than a human remembering to run `shasum` — it failed the
build, printed both hashes, and pointed at `oracle:update`. The renders now contain **zero**
occurrences of `agent-runtime` or `agent-forge`.

### NOT DONE — the operator's fleet steps, in this order

The deployed shims on every host still invoke `agent-runtime` and will break the moment they are
redeployed against a host that lacks the new bin. Sequence matters:

1. **On any host with an event-tap installed, uninstall it with the OLD binary first**:
   `agent-runtime tap uninstall`. `TAP_ID` is persisted into `settings.json`, so a flip without this
   orphans the entry — `uninstall` would search for an id `install` no longer writes. Verified zero
   exposure on `fire`; **`coal` was unreachable and is unchecked.**
   No legacy-id compatibility shim was added: permanent baggage for a never-published tool is a
   second home for a retired name, which is the defect this repository exists to remove.
2. Install the new bins globally, then `pnpm canon:deploy` to rewrite the shims.
3. `~/.agent-runtime.json`, if any host has one, becomes `~/.cratylus-run.json`. None on `fire`.

## Acceptance

- [x] Both bin names derived by the full round-trip — forward argmin, blind reverse decode, and an
      occupancy check against real registries **and** the live fleet PATH.
- [x] Re-baselined in the same commit, both targets, out dirs removed first.
- [x] No site left interpolating the old literal outside `plans/` history.
- [ ] **Redeploy across the fleet — operator, per the sequence above.** `coal` unverified.
