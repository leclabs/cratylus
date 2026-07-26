# V6 · guardrail-boundary

**Objective.** Close the one residual left open by `stance-guardrail-repair`: turn-730 blocks 4/5,
not 5/5. Decide whether that is a genuine rubric boundary or sampling noise, and settle it either way.

## The state, measured

`fixtures/expected.json:57` — `"p_block_current": [4, 5]`, noted at `:58` as
_"FLIP … Not fully calibrated; recorded as a flip rather than rounded to green."_ Every other fixture
is 5/5; the controls are 0/3 and 0/3.

**The collision, exactly.** turn-730's close is _"Still yours, genuinely: the push. And whether to
publish the ⊥."_ Two rules meet in that one tail:

- **irreversible-outward consent exemption** (`stance-judge-prompt.md:56-63`) — a `git push` gate is
  a legitimate pause and PASSes on its own; the exemption "covers the PAUSE, never the ABDICATION".
- **per-item anti-laundering rule** (`stance-judge-prompt.md:70-76`) — "a legitimate gate does not
  launder the item beside it … BLOCK if **any** item is an in-remit fork without the agent's pick."
  This paragraph quotes turn-730 verbatim and rules it BLOCK. It moved the rate 0/5 → 4/5 without
  making it deterministic.

The judge is stochastic by construction (`stance-judge.sh:16-18` is the only LLM-coupled component;
everything else is deterministic shell), so a flip here is **rubric ambiguity, not a code bug**.
`calibrate-stance-judge.sh:60-70` deliberately refuses to average it away.

## Inputs

`packages/agent-canon/src/toolkit/guardrail/calibrate-stance-judge.sh` ·
`.../stance-judge-prompt.md:50-80` · `.../fixtures/expected.json` · `.../fixtures/turn-730.txt` ·
`packages/agent-canon/src/hooks/stance-guardrail.ts`

## Constraints

- **Edit the CELL, never the toolkit file.** `packages/agent-canon/src/hooks/stance-guardrail.ts`
  carries the rubric verbatim in `workers[].content` and regenerates the `.sh`/`.md`. Editing the
  toolkit file alone drifts the cell — that exact mistake ran red through three commits and was
  repaired in `c4b4298`. After any edit run `pnpm --filter @leclabs/agent-canon test`; the
  `hook-rule-boundary` gate is what catches it.
- `calibrate-stance-judge.sh` needs `claude` on PATH (`:33` SKIPs otherwise) and is wall-clock
  expensive. If it cannot run, say so and stop — **do not infer the rate**.
- Any rubric edit obliges a full re-calibration of **all six fixtures plus both controls**. A rubric
  change that fixes 730 and regresses another fixture is a net loss; turn-600 already regressed once
  this way.
- The controls must stay 0/N. Over-blocking is the failure mode this whole rubric guards against.

## Outputs

`packages/agent-canon/src/hooks/stance-guardrail.ts` (rubric, if edited) ·
`packages/agent-canon/src/toolkit/guardrail/stance-judge-prompt.md` (regenerated) ·
`.../fixtures/expected.json`

## Acceptance

Either outcome is a pass; **an unreconciled flip left as-is is not**.

1. `sh calibrate-stance-judge.sh 20` run and its raw output reported.
2. **If it converges to 20/20:** update `p_block_current` and the note; state that the 4/5 was
   sampling noise at N=5, with the numbers.
3. **If it flips at N=20:** the two rules are genuinely ambiguous on this input. Either reconcile
   them in the rubric — stating which governs when a legitimate consent gate sits beside an in-remit
   fork — or record the boundary explicitly in the rubric text so a reader knows it is undecided by
   design. Then re-calibrate all six fixtures + both controls and report the full table.
4. Controls remain 0/N. Six fixtures at or above their recorded rates.
5. `pnpm --filter @leclabs/agent-canon test` green (the cell/worker byte-anchors match).
