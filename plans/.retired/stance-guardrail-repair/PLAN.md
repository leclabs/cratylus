# stance-guardrail-repair — PLAN

> Working handle. Reader = LLM. Retrospective: the work landed before the plan existed, because it
> started as an incident and not a project.

**Status: LANDED 2026-07-26** — five commits, `429553a` · `7f51811` · `d5af947` · `94f20c9` · `fa6b9f5` ·
`c72828e`. All six live fixtures convict; 26 hermetic cases green on source and on the deployed hook. One
residual open, below.

## What happened

`mav` and `nico` have carried the `checkIn` autonomy value since `8d11749` — `check-in ⟨conclusion-first ·
owed ↦ recommendation-bearing-tail⟩`, four laws. Across one long session the agent broke L2/L3/L4
repeatedly and the Stop-hook guardrail did not stop it. The operator caught it, four separate times. This
repository exists to prevent exactly that degradation, so the misses are the defect, not the behavior alone.

## Defects found and fixed (each measured, none asserted)

| #   | defect                                                                                                            | fix                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | `stop_hook_active=true → allow_stop` skipped **judging** after a block — an escape hatch, and it never terminated | judge every turn; budget the BLOCKS + no-progress detector, failing open loudly |
| 2   | Rubric could not see **announce-without-act** — it only asked whether the close OFFERS vs STATES                  | deterministic Layer-1 pre-filter + rubric section                               |
| 3   | Rubric had never heard of `checkIn` — the declared dimension had no enforcement surface                           | the four laws are in the rubric                                                 |
| 4   | Judge emitted `EVIDENCE`; **its own normalizer stripped it**, so the confabulation check never once ran           | normalizer admits it; an unevidenced block is discarded                         |
| 5   | Extraction judged the **last text block** — 1 of 20, usually a mid-turn preamble (measured 47% of a turn)         | assemble the whole turn with `[tools: …]` markers                               |
| 6   | Operator slot **poisoned** by skill bodies — 2.8 kB of `/wake` read as the operator's instruction                 | filter skill bodies, system reminders, task notifications                       |
| 7   | Irreversible-outward exemption **swallowed L4** — bare push gate blocked 0/8                                      | the exemption covers the pause, never the abdication                            |
| 8   | L4 scope-leaked from collapse-signal 1 — "not my remit, want me to take it?" passed 4/8                           | L4 is remit-independent                                                         |
| 9   | Whole-turn extraction **regressed** turn-600 5/5→2/5 — a buried recommendation read as compliance                 | position is the law; a buried pick aggravates, never discharges                 |
| 10  | **Laundered tails** — one legitimate consent gate passed the in-remit fork beside it                              | the exemption is per-item; block if any item lacks a pick                       |
| 11  | Yielding the turn to **wait on the agent's own background job**                                                   | collapse-signal 5                                                               |

Two meta-findings worth more than any single fix:

- **The test suite was defending the bug.** Case 5 asserted "stop_hook_active suppresses block" and passed
  every run for weeks. A green test had converted the defect into a guarantee.
- **The suite proved the gate BITES and never that it does not bite WRONGLY.** `d7649c7` established that a
  gate with no convicting fixture is a dark gate; the mirror is equally true and was not internalized.
  False-positive fixtures (5d/5e/5f/5h) exist now.

## Calibration — measured, not asserted

`calibrate-stance-judge.sh`, 5 samples/fixture. The hermetic suite cannot cover this: it swaps in a
deterministic fixture judge, so it proves the worker's control flow and says nothing about the rubric, which
only an LLM ever reads.

| fixture  | before | after |
| -------- | ------ | ----- |
| turn-193 | 20/23  | 5/5   |
| turn-282 | 4/8    | 5/5   |
| turn-554 | 0/8    | 5/5   |
| turn-600 | 2/5    | 5/5   |
| turn-730 | 0/5    | 4/5   |
| turn-772 | PASS   | 5/5   |

Controls, which must NOT block: consent-gate-with-a-pick **0/3**, plain done-report **0/3**. The carve-outs
convict without over-blocking.

## Residual — OPEN

**`turn-730` is a FLIP at 4/5, not a pass.** Mixed tail: a legitimate push gate beside an in-remit fork
("whether to publish the ⊥"). The per-item rule took it from 0/5 to 4/5 but has not made it deterministic.
Recorded as a flip in `fixtures/expected.json` rather than rounded green — `turn-282` sat at 4/8 reading as
mostly-fine for weeks, and that is precisely how this rot hides. A flip is an unreconciled boundary between
two rules, not noise.

Next: re-measure at higher N to distinguish a genuine boundary from sampling, then either reconcile the
rules or record the boundary explicitly.

## Standing constraint for anyone editing the rubric

Re-run `calibrate-stance-judge.sh` after **any** rubric edit. A rate that does not move means the edit
changed nothing real. Tuning a stochastic classifier without measurement is how the rubric drifted away from
the agents' own declared `checkIn` laws with nobody noticing.
