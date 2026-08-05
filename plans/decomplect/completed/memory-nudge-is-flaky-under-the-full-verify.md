# `memory-nudge` failed once in twelve full runs, and a rare red gate is worse than a red one

> Observed 2026-08-05 during the retired-tree deletion. Not chased — `cost(file) < cost(fix)` —
> but recorded with the evidence, because a gate that fails one run in twelve reads as noise and
> gets re-run rather than diagnosed. This repo has already paid for that shape once: `61b85db7`
> records a defect that "failed roughly one run in five, on identical input, which is the worst
> shape a defect can take: four green runs read as proof."

## Symptom

`pnpm verify` → `@cratylus/canon#test`:

```
× memory-consolidation-nudge — advisory when owed, silent when clear
  > is silent when the home has no stores yet
```

`packages/canon/test/memory-nudge.test.ts:178`. The case seeds an EMPTY agent home and asserts the
hook emits nothing: `expect(out).toBe('')`. It got something. **The actual value was not captured** —
the run was filtered — and that is the first thing the next look must fix: extract what the worker
actually printed before theorising about why.

## Repro budget already spent — do not repeat it

| command                    | runs | failures |
| -------------------------- | ---- | -------- |
| `vitest run` (canon alone) | 5    | 0        |
| `vitest run` (file alone)  | 2    | 0        |
| `pnpm test --force`        | 4    | 0        |
| `pnpm verify`              | 3+1  | **1**    |

**1 in 12+.** It has only ever failed inside `pnpm verify`, never under a bare test run — which is
weak evidence that the trigger is concurrency with the build, not the assertion.

## A mechanism that would explain it — INFERRED, NOT VERIFIED

Stated as a hypothesis to test, not a cause. It fits the evidence and nothing has confirmed it.

`memory-nudge.test.ts:37` binds the fixture's `MEMORY_BIN` to a shim wrapping a REAL built
artifact:

```ts
const runtimeBin = join(here, '..', '..', 'invoke', 'dist', 'bin.js');
```

That is a live build output, and `tsup` is configured `clean: true` — a rebuild **deletes and
recreates** it. The hook worker guards with `command -v "$MEM"`, which tests the SHIM (always
present, written by `beforeEach`), not its target. So during a window where `invoke/dist/` has been
cleaned but not yet rewritten, the guard passes and the exec fails — and a failing exec's output is
not the empty string the case demands.

If that is the mechanism, the defect is **the test's coupling to a mutable build artifact**, not the
hook. Two candidate repairs, both cheap, and the choice is a design call:

1. Copy the dispatcher into the fixture in `beforeEach` instead of pointing at it. The fixture then
   owns an immutable artifact for its lifetime.
2. Make the worker's guard test EXECUTABILITY, not presence (`"$MEM" --version >/dev/null 2>&1`).
   This is the same defect as `pending/the-host-install-is-a-symlink-nobody-authored.md` — _presence
   on `PATH` is not resolvability_ — and repairing it there would repair it here.

**Repair 2 is the interesting one**, because it fixes a real property of the shipped hook rather than
a property of the test rig. Repair 1 alone would make the symptom go away while leaving the hook
still unable to tell a present-but-broken bin from a working one.

## Acceptance

- The actual failing output is captured and quoted before any fix is chosen. A mechanism that
  EXPLAINS a symptom is not thereby its cause.
- Whatever is done, the case is made to fail ON PURPOSE first — a flake that stops reproducing is
  indistinguishable from one that was never fixed.
- If repair 2 is taken, the shipped worker gets a fixture proving it stays silent for a bin that
  exists but cannot execute — the exact state this host was in for the whole of `61b85db7`'s life.

## ▶ OUTCOME 2026-08-05 — the cause is NOT proven, and the shard says so rather than claiming a fix

This shard's own acceptance opens with _"the actual failing output is captured and quoted before
any fix is chosen"_. **It could not be.** The flake did not recur in ~20 further runs, and a direct
probe of the worker against a fresh fixture returns `rc 0`, empty stdout, empty stderr — correct.

**Repair 1 was attempted and FAILED for an instructive reason.** Snapshotting the dispatcher into
the fixture — the obvious way to break the coupling to a mutable build artifact — does not work:
`invoke/dist/bin.js` is an ESM bundle that resolves its capability package through node's module
lookup **from its real location**. A copy parses and cannot run. Copying the whole `dist` fails the
same way for the same reason. So the fixture cannot own an immutable artifact without also owning a
package context, which is a much larger change than a flake justifies.

**Repair 2 is now unnecessary, and that is a real result.** The shard argued for making the worker's
guard test EXECUTABILITY rather than presence. `the-host-install-is-a-symlink-nobody-authored` has
since made deploy REFUSE to place shims whose bin does not run — so the property is enforced once,
at deploy time, instead of on every Stop event. Adding a `--version` probe to the worker would buy
the same guarantee at the cost of a subprocess per hook firing.

**What landed instead**: the fixture now asserts its own precondition. If the dispatcher is absent,
the suite says so BY NAME — _"a concurrent build is mid-clean, not a defect in the hook"_ — rather
than failing as a confusing empty-output mismatch. That does not fix the flake. It makes the next
occurrence identify itself, which is the most this shard can honestly claim without a reproduction.

**Left open deliberately.** If it recurs with that message, the cause is confirmed and repair 1
becomes worth its cost. If it recurs WITHOUT it, the hypothesis in this shard is refuted and the
investigation starts clean — which is worth more than a fix that might have been aimed at nothing.

## ▶ THE HYPOTHESIS WAS CONFIRMED HOURS LATER, BY ACCIDENT

While integrating a later batch, `cratylus-run --version` — the deployed host CLI, not a test —
died with `ERR_MODULE_NOT_FOUND`. The cause was visible on disk: `packages/invoke/dist/` held
`bin.js` and `bin.js.map` **and nothing else**. Its sibling chunks were gone.

That is precisely the state this shard hypothesised and could not reproduce: `tsup` runs
`clean: true`, so a concurrent build leaves a window where `bin.js` exists and what it imports does
not. The shim's guard tests the shim; the target is the thing that vanishes.

**Two things follow.**

1. The mechanism is no longer marked INFERRED. A file that parses and cannot run, for exactly the
   reason predicted, observed outside the test that was failing.
2. **The blast radius is larger than a flaky test.** The same window takes down the real host CLI —
   every deployed skill shim spawns that bin. This session already lost `/wake` to a stranded bin
   once; this is a second, transient path to the same outcome, and it is invisible because it heals
   itself on the next build.

The precondition assertion added here works as designed — it would name this state rather than
present it as an empty-output mismatch. **What it does not do is stop the host CLI breaking**, and
that is now a separate, larger question than a test fixture: filed as the observation above rather
than fixed here, because the repair belongs to whoever owns build/deploy sequencing, not to a
`beforeEach`.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** host-and-config · **wave** 0
- **depends on** `t-manifest-file-basename` · `the-host-install-is-a-symlink-nobody-authored`
- **writes** `packages/canon/test/memory-nudge.test.ts`
- **compiles against** `packages/invoke/src/bin.ts`
- **evidence** `packages/canon/test/memory-nudge.test.ts`
- **dispatchable** no ruling owed
