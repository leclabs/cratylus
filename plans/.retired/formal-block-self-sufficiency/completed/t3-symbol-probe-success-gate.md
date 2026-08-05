# t3 — symbol probe round-trip success-gate

## Objective

Wire a per-symbol `probe` round-trip into the CANON/ENGINE lifecycle so every symbol in a skill's formal
block is verified — `concept_R(symbol) = intended C` — before canonization. Formal blocks become the
symbolic-σ\* regression suite: a mis-signified symbol fails the gate.

## Inputs (static)

- `packages/canon/src/skills/probe.ts` — `probe(w) ≜ ⟨fired_R(w) · concept_R(w)⟩`; the round-trip
  primitive (`concept_R(w)` vs intended C). Now carries the U3 `coverage`/`crystallize` laws.
- `packages/canon/test/symbols.test.ts` — existing per-symbol scan; the natural host or sibling.
- `ENGINE.md`, `CANON.md` — the lifecycle docs where the success-gate is declared.
- `.scratchpad/signify-review-jul-22/signify-symbolic-notation-verdict.md` §7.4 — the gate's rationale.

## Constraints

- The round-trip is reader=LLM (`probe`'s `fired_R` at R=LLM). A symbol passes iff the concept its priors
  circumscribe matches the concept the block assigns it (its σ\* target).
- Deterministic harness where mechanizable; where the round-trip needs an LLM judgment, define the gate's
  contract + failure surface even if the judgment step is a documented manual/agent check (do not fake a
  deterministic oracle over a semantic equality — independent-leg honesty).
- Additive: must not weaken the existing symbols.test.ts gate.

## Dependencies

none (wave 0; independent of t1/t2).

## Outputs

- A lifecycle success-gate (test + ENGINE/CANON declaration) running the per-symbol probe round-trip.
- Documented contract: what a symbol must satisfy to canonize; what a failure looks like.

## Acceptance (blind, falsifiable)

1. The gate exists, is wired into the canon lifecycle (ENGINE/CANON references it), and runs.
2. A fixture symbol whose priors circumscribe a DIFFERENT concept than assigned **fails** the gate.
   (Falsifier: a deliberately mis-signified symbol passes ⇒ gate is vacuous.)
3. A correctly-signified reference symbol (e.g. `σ*`, `circ`) **passes**. (Falsifier: a known-good symbol
   fails ⇒ over-strict.)
4. Existing `pnpm --filter @leclabs/canon test` remains green.
