# canon-promotion — PLAN

> Working handle, **not** an anchor. Reader = LLM. The plan names a concern, not a concept; every anchor
> this plan mints is derived by signify at the time, never inherited from this directory name.

**Status: COMPLETE — collision ledger closed 13 → 1 (twelve paid, `read` refused as ⊥, zero anchors minted). Stance-collapse root cause measured and filed; the budget-silence half fixed and deployed. Originally: COMPLETE for this plan's remit — S1, S2, S4–S10 DONE. S3 WITHDRAWN (already carried — the survey's ABSENT verdict was about the law's WORDING, and the mechanism existed under different words). F1 (ENGINE intake) remains owed to the operator and is the only item outside my remit. S3–S9 are the promotion campaign, each gated on a
signify pass (see §The constraint that reshapes this plan). F1 is owed to the operator and is the only item
outside my remit.** Elected by nico 2026-07-27 at wake, under WAKE law `∄ P : bound(P) ⇒ bind(elect)` — the
frontier was empty, all 16 prior plans retired.

**Do S10 before trusting any CARRIED verdict** — it is done, and it is what makes the rest safe: acting on
the survey's 5 CARRIED verdicts under the old undefined `projection-carries` would have dropped 4 laws that
nothing carries where PROCEDURAL applies.

## Intent

25 laws that bind multiple agent-types live only in nico's private PROCEDURAL store. MODEL requires
`CANONICAL : ¬private(c)` and `PARTITIONED : |home(c)|=1`. A law binding tester ·
principal-engineer-reviewer · investigator · principal-ic · developer that has no home in the canon is a
MODEL violation: every one of those agents must re-derive it privately, and most never will.

**The byte-pressure that surfaced this is NOT the objective.** PROCEDURAL sits ~1400B over its 8000B
ceiling, and that is what made the problem visible, but see the carriage-radius finding below — promotion
into gates will not shrink it. The plan stands on `¬private(c)` alone.

## Census — measured, do not re-derive

Coverage survey of all 25 laws against the live canon: `evidence/coverage-survey.md` (verbatim delegate
return, filed before adjudication).

| fact                                                                                          | source                |
| --------------------------------------------------------------------------------------------- | --------------------- |
| 5 laws CARRIED, 13 PARTIAL, 7 ABSENT — my "these are uncarried" claim was substantially wrong | survey §VERDICTS      |
| Every law's own σ\* anchor: **0 hits** in the canon region                                    | survey §CONTROLS      |
| Those same anchors **do** appear in `plans/.retired/**`                                       | survey §CONTROLS      |
| `register` is already taken at the ARTIFACT altitude (`σ* ∨ human`)                           | `signify/skill.ts:25` |
| `probe` let the set-borne read decide σ\* — contradicted `llm-native`                         | fixed, `232ce47`      |
| stance-guardrail had NO vitest gate; a dead judge read as a clean turn                        | fixed, `27d6df2`      |

### Two adjudications that outrank the seam table

**CARRIAGE HAS A RADIUS.** The survey reports CARRIED without distinguishing who carries. A repo-local
GATE enforces a law only inside the corpus it guards; a PROJECTED dimension cell rides into every context
via SOUL. PROCEDURAL is cross-project law. ∴ dream's `projection-carries(i) ⇒ drop` is under-specified —
**a gate-carried law licenses no drop from cross-project memory.** Of the 5 CARRIED, only V7 is genuinely
projection-carried (verbatim in SOUL as `cold-decode-oracle`). This is itself a defect in the dream cell.

**NOT A CONFLICT, recorded so no future reader "resolves" it wrongly.** V6 `sweep-rubrics-first` vs
`cold-decode-oracle`'s `corpus = defendant · cold-read = oracle` only looks contradictory. cold-read is
the ultimate oracle; a RUBRIC is an authored, fallible proxy. V6 says the proxy is a defendant too — it
strengthens cold-decode-oracle rather than opposing it.

## The constraint that reshapes this plan

The survey's SEAM CANDIDATES table says **where** each law goes. It says nothing about **what it is
called**, and under the prime principle that is the hard half.

Every one of these 25 anchors — `persist-on-arrival`, `entailment-not-vocabulary`, `spec-not-source`,
`grep-false-green`, `altitude`, `rejection-binds-the-sign` — is a **private coinage of mine that has never
been cold-verified**. `cratylism` forbids importing them by fiat: names are discovered, never coined, and
`∀ name : cold-derivable ∨ ⊥` with **⊥ a legitimate result**. Copying my private vocabulary into the canon
would be precisely the category error the ground axiom exists to prevent — and it would poison the
signification gate, whose whole claim is that every declared symbol round-trips.

**∴ each promotion is a signify pass, not a paste.** Probe the concept strictly-bare (per `232ce47`, the
set-borne read is diagnostic only), derive the anchor, verify the round-trip, and accept ⊥ — the law may
be real while my name for it is merely a habit. Expect some of these 7 to promote under a different sign
than the one I have been using, and expect at least one to refuse a sign entirely (L1 passes, language
short).

## Shards

MECE. S1–S2 are done. S3–S9 are one signify pass each and are mutually independent — they touch different
seams, so `∀ t,u ∈ wave : outputs(t) ∩ outputs(u) = ∅` holds and they may be dispatched concurrently.

| id  | shard                                                                                                         | seam (from survey)                                                   | wave | state                                                      |
| --- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---- | ---------------------------------------------------------- |
| S1  | probe set-borne contradiction                                                                                 | `src/skills/probe/skill.ts`                                          | 0    | **DONE** `232ce47`                                         |
| S2  | guardrail dark-judge + class gate                                                                             | `src/hooks/stance-guardrail.ts` + new test                           | 0    | **DONE** `27d6df2`                                         |
| S3  | V4 count-vs-line-diff                                                                                         | GATE `test/gate-convicts.test.ts`                                    | 1    | **WITHDRAWN** `381683b` — already carried by `shrink-only` |
| S4  | V5 falsified-premise-as-entailment                                                                            | cell `dimensions/…/cold-decode-oracle.ts`                            | 1    | **DONE** `4ea384e`                                         |
| S5  | C2 append-loud / edit-silent                                                                                  | cell `src/skills/dream/skill.ts`                                     | 1    | **DONE** `4ea384e`                                         |
| S6  | C3 fan-in producer-confirmation                                                                               | cell `src/skills/praxis/skill.ts`                                    | 1    | **DONE** `4ea384e`                                         |
| S7  | C6 persist-return-before-judging                                                                              | cell `src/skills/praxis/skill.ts`                                    | 1    | **DONE** `4ea384e`                                         |
| S8  | S4 cross-altitude collision — **26 live violations MEASURED**, see `evidence/cross-cell-symbol-divergence.md` | GATE `test/symbol-probe-gate.ts` (per-cell keying is the blind spot) | 1    | **DONE** `9e712d2`                                         |
| S9  | S5 rejected-sign-not-reassignable                                                                             | GATE `test/cratylism.test.ts`                                        | 1    | **DONE** `381683b`                                         |
| S10 | dream cell: carriage radius — define `projection-carries`                                                     | cell `src/skills/dream/skill.ts`                                     | 1    | **DONE** `7fa7c1c`                                         |

S6/S7 share `praxis/skill.ts` and S8/S9 share `cratylism.test.ts` — those pairs must serialize against each
other (one writer per file), or merge into single shards.

### Shard spec — common to S3–S10

- **objective** — the law has a home in the canon under a cold-derived anchor, or a recorded ⊥.
- **inputs** — the law text in `evidence/coverage-survey.md`; the named seam; the incumbent block.
- **constraints** — anchor derived by signify, probed **strictly-bare**; no glyph minted that the operator
  lexicon lacks; a new declared symbol owes a symbol-probe round-trip (CANON.md §Signification-gate); the
  projected target is regenerated, never hand-edited; every new gate is calibrated against a known-failing
  artifact before it is trusted.
- **outputs** — the edited cell or gate, its regenerated target, and the probe transcript as evidence.
- **accept** — full cold suite green (turbo cache deleted); the new gate convicts when the fix is reverted;
  `projection-carries(i)` genuinely holds before anything is dropped from PROCEDURAL.

## Blocked — owed to the operator

**F1 — the ENGINE intake question. The only item outside my remit; ENGINE is LOCKED grounding.**

Every law anchor returns 0 hits in the canon and non-zero hits in `plans/.retired/**`. These laws were
derived during plan EXECUTION and died at plan RETIREMENT. ENGINE's pipeline
`⟨discover, author, normalize, validate, select, compose, deploy⟩` has no intake from execution
experience — `discover : Intent → Sign` is fed by Intent only.

That leak is the _cause_; these 25 laws are one symptom, and this plan only treats the symptom. Left
unfixed, the next 16 plans will strand their own laws the same way. The fork is whether ENGINE gains a
feedback edge (execution → discover), and it is a VISION/ENGINE-altitude decision, not mine to take.
