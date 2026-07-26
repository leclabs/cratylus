# R2 — defect census: reproduce each claimed defect, or record that it will not reproduce

**Wave 0 · deps: none · state: ready · delegable**

## Intent

The operator named five symptoms. They are **observations, not findings** — some may be one defect wearing
five faces, some may not reproduce at all. Localize each to a mechanism, with evidence, before anything is
designed. Designing against an unreproduced symptom is how the current implementation got clunky.

## The claimed defects

| #   | claim                                                   | where it would live                            |
| --- | ------------------------------------------------------- | ---------------------------------------------- |
| D1  | `PROCEDURAL` bloat                                      | admission at apply; no compaction              |
| D2  | Duplicate memories                                      | no dedup key; nothing to dedup _on_            |
| D3  | Memories restating what is already in source context    | no admission test vs projected SOUL/skills     |
| D4  | Semantic routing errors at drain                        | 100% deferred inference over free-form prose   |
| D5  | Clunky `agent-memory` ↔ `agent-canon` skill integration | the shim/skill seam; `dream`/`wake` skill defs |

## Inputs

- `packages/agent-memory/src/` — all 18 modules; `route.ts`, `record.ts`, `fold.ts`, `audit.ts`, `store.ts`
  are the load-bearing ones
- `packages/agent-canon/src/skills/{dream,wake,handoff}/skill.ts` — the consumer side of the seam
- **Live store contents** — the real corpus, which is the only honest test data:
  `agent-runtime memory home --name mav` (also `nico`) resolves the home; read `SEMANTIC.md`,
  `PROCEDURAL.md`, and the raw episodic log
- `packages/agent-memory/src/audit.ts` — there is already an audit surface; find out what it measures and
  whether it already convicts any of D1–D4. **Run it before writing new tooling.**

## Method

For each of D1–D5:

1. **Reproduce it against the live stores.** Quote the actual records. "PROCEDURAL is bloated" is an
   opinion until it is a line count, a growth curve, and named entries that should not have been admitted.
2. **Localize to the mechanism** — file and line — that permits it. Not the symptom's location; the
   decision that allowed it.
3. **Classify the cause:** missing mechanism · wrong mechanism · mechanism present but not invoked ·
   agent-behavioral (the writer's fault, not the tool's).
4. **State the deterministic test** that would have caught it, if one exists. If none can exist without a
   model, say so and say why — that boundary is exactly what S3 needs.

Then, across the set: **are these five defects or fewer?** The census's most valuable possible output is
"D1, D2 and D3 are one defect — there is no admission test — and D4 is a second." Say so if true.

## Constraints

- **Measure, do not assert.** Every claim carries a quoted record or a number. This project has already
  been burned twice this session by a plausible mechanism asserted as a cause and later refuted.
- **A symptom that will not reproduce is a finding.** Record it as not-reproduced with what was tried.
  Do not quietly design for it anyway.
- **Read-only.** R2 diagnoses; it changes no behavior and edits no store. Backup before any read that could
  mutate. The live stores are the agents' actual memory — corrupting them is real data loss.
- Distinguish **tool defect** from **writer defect** ruthlessly. If the agent wrote a bad memory that the
  tool had no way to reject, that is D-something-else and belongs to the skill, not the library.

## Outputs

`plans/memory-consolidation/ready/R2-findings.md` — per defect: reproduced (yes/no) · evidence · mechanism
at file:line · cause class · the deterministic test that would catch it, or why none can. Closing section:
the true defect count and their dependency structure.

## Acceptance

- Every one of D1–D5 has a verdict: **reproduced with evidence**, or **not reproduced with what was tried**.
  No defect is left "probably true".
- Each reproduced defect is localized to a **file:line** decision, not a general area.
- The closing section commits to a true defect count and says which claimed defects collapse into one.
- `audit.ts`'s existing coverage is stated — what it already catches, and what it misses.

**Falsifier (this must fail on the pre-state):** today `R2-findings.md` does not exist and no defect has a
verdict, so acceptance fails on every criterion. If it would pass before the work, it is mis-specified.
