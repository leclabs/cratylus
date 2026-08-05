# T1 — derive-verbs (SURVIVES → feeds `runtime/S5` · was ready · wave 0 · deps ∅)

> **✅ SURVIVES.** event-tap reshapes into an `runtime` runtime capability (see
> `plans/event-tap/PLAN.md` STATUS + `plans/runtime/SUPERSESSION.md`). This slice's deliverable —
> the cold-derived, cratylism-gated sub-verb set + confirmed anchor — is a live INPUT to
> `runtime/S5` (event-tap-capability), where the verbs become `cratylus-run tap <verb>`. Execute
> or reuse as the naming input to S5; nothing here is dead. Spec follows unchanged.

---

## Objective

Settle, by cratylism DERIVATION (not confirmation), the `event-tap` sub-verb set and confirm the
anchor. The tool exposes four sub-actions; name each at its true altitude, candidate-free.

## Static inputs (pinned)

- `.scratchpad/tap-skill-draft.md` — the settled concept + provisional verb set `install|inspect|uninstall|status`.
- `packages/canon/test/cratylism.test.ts` (skills leg L117-133) — structural gate: `basename(file) == cell.name`, kebab `[a-z0-9-]+`.
- `packages/canon/src/toolkit/cold-oracle/` (`decodeCold`, `sweep.mjs`) — the isolated-oracle instrument for the SEMANTIC leg.
- `packages/canon/src/skills/handoff.ts` — a live skill exemplar (`name`, verb-H1 convention).

## Constraints

- **Derive, don't confirm.** For the non-convention verbs (`inspect`, `status`), run the isolated
  cold-oracle (`claude -p` from a scratch dir, tools+context denied) on the sub-action concept ALONE
  — **no leading-candidate-set**, at the correct altitude (the sub-action of a passive event-tap).
  Positive control (coined token → unknown) AND, per the naming-fix lesson, the negative control
  (concept-alone must regenerate the verb). `install`/`uninstall` are cited as settled convention
  (the `continuity` toolkit `install|uninstall|status` precedent) — cite, don't re-oracle.
- Confirm the anchor: filename `event-tap.ts` ⟺ `name: 'event-tap'` (cratylism structural regex).

## Outputs

- A verb-set decision note: each of `{install, inspect, uninstall, status}` with its provenance —
  convention-cited or candidate-free-derived (with the oracle framings + what emerged).
- Confirmation the anchor passes the cratylism structural leg.

## Accept (blind falsifier)

Return is REJECTED if: any non-convention verb (`inspect`/`status`) is asserted without a
candidate-free cold-derivation note (framings shown, no candidates supplied); OR a leading-candidate
set was fed to the oracle; OR `install`/`uninstall` lack the convention citation; OR the anchor
check is missing or wrong. Return is ACCEPTED only when every verb's sign is traceable to derivation
or cited convention, and `basename==name` is shown to hold.

---

**DISPOSITION (mav, 2026-07-26) — EXECUTED, by `close-out`/N1.**

This shard was retired unexecuted and the verbs shipped un-derived (mirrored from the port
method names). The derivation has now RUN, candidate-free, in a cold rig:
`plans/.retired/close-out/completed/N1-derivation-record.md`.

Result: **`install` · `uninstall` · `read` · `status`**. `remove` refuted **14/14**,
`inspect` **0/14**, modal in both framings, every rival a prefix-negated pair.

Stronger than the counts: six trials volunteered, unprompted, that `remove` does not read as
an exact inverse and could imply _partial_ deletion — while `ports/event-tap.ts` requires the
tap detach "cleanly (zero residue)". **`remove` mis-signified the contract.** Adopted in
`731e510`; `tap remove` now fails loud.
