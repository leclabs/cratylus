# stance-guardrail-jurisdiction — the judge must see the dispatch channel

**Lane** Mav (hook machinery) + Nico (rubric doctrine, judge) · **Status** pending · **⊳dep** `stance-guardrail-asktool` H1–H3.

> **RE-SCOPED (nico, session a4d74873, 2026-07-08).** Two corrections from the staleness audit:
> **(1) Stale edit-sites** — the `Static` list below pins `src/toolkit/guardrail/*.sh`, but those are the
> BYTE-LOCKED PROJECTED WORKERS of the `.ts` HookCell `src/hooks/stance-guardrail.ts` (regenerate from its
> `workers[].content`; a hand-edit reds `test/hook-rule-boundary.test.ts`). Edit the SOURCE cell, never the
> `.sh`. **(2) Scope items 2 + 3 ABSORBED** — the PreToolUse binding + dispatch-echo rubric are unified into
> `stance-guardrail-asktool` H2 (one generalized `stance-guardrail-pre` cell matching
> `AskUserQuestion|Agent|SendMessage`; a second parallel PreToolUse cell would violate `PARTITIONED`). This
> shard's LIVE residue is only items **1 (Stop-guard sees `tool_use`)** + **4 (telemetry)**, both landing on
> the EXISTING Stop cell — see Scope below. The dispatch-channel motivation is retained for context.

The stance guardrail is structurally blind to the drift class that matters most. Reviewer evidence
(field, 2026-07-03), three mechanisms, all by construction:

1. **The jq selector drops `tool_use` blocks** (`map(select(.type == "text"))`) — a dispatch prompt
   (the agent→agent artifact where echo/transcription defects live) is never part of the judged
   text; only surrounding prose reaches the judge, which reads as confident narration.
2. **Pure-tool turns are never judged** (`[ -n "$turn" ] || allow_stop`) — a turn that only
   dispatches exits before the judge runs.
3. **The rubric recuses itself** ("judge the stance, not the correctness of technical content") —
   the echo class is defined as a linguistic feature, so a semantically hollow but expert-reading
   dispatch passes by design.

Net: the drift travels through the one channel the extractor deletes, in turns it often skips,
under a rubric that disclaims the call. Deterministic extraction over-corrected until the
LLM-as-judge never sees the evidence.

## Static (SOURCE cell, not the projected `.sh`)

`packages/agent-anatomy/src/hooks/stance-guardrail.ts` — the Stop-cell SOURCE (its `workers[].content`
regenerate `src/toolkit/guardrail/{stance-guardrail.sh, stance-judge.sh, stance-judge-prompt.md}`,
byte-locked by `test/hook-rule-boundary.test.ts`) · the reviewer analysis above (the defect contract).

## Scope — LIVE residue only (items 2,3 absorbed into asktool H2)

(1) **Judged surface**: in the EXISTING Stop cell's worker (`stance-guardrail.ts` →
`stance-guardrail.sh` content), the jq extractor `map(select(.type == "text"))` drops `tool_use` blocks;
include dispatch-class `tool_use` payloads (Agent · SendMessage prompt/message fields) in the judged text,
and judge a pure-tool turn that carries a dispatch payload instead of `allow_stop`-skipping it. This
lands on the Stop cell — a distinct interception point from asktool's PreToolUse pre-hoc block (defense in
depth; the PreToolUse binding is the primary catch, this backstops turns where it failed open).
(4) **Telemetry**: judge failures/timeouts logged (fails-open stays, but a miss becomes observable) —
apply to the Stop worker (asktool H2 adds the same to the Pre worker).

~~(2) PreToolUse binding · (3) dispatch-echo rubric~~ → **absorbed into `stance-guardrail-asktool` H2**
(one `stance-guardrail-pre` cell over `AskUserQuestion|Agent|SendMessage`, shared rubric extension).

## Accept (falsifiers)

- Stop-guard extractor: a turn whose content includes a dispatch `tool_use` carrying a transcribed spec
  (with surrounding prose) → the dispatch payload reaches the judge and BLOCKS; the same with an
  intent-extracted dispatch passes. A pure-tool dispatch turn is judged, not skipped.
- A pure-text collapse still blocks (no regression); `stop_hook_active` loop-safety intact; a judge
  timeout produces a log line and an allow (fails-open observable).
- Edit the SOURCE cell; `pnpm anatomy:project:targets` regenerates the `.sh`; `test/hook-rule-boundary`
  green. `pnpm run stance-guard:test` extended; deployed-artifact mode (`STANCE_WORKER_DIR`) proves the
  shipped worker bites. Deploy Operator-reserved.
