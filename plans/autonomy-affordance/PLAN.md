# autonomy-affordance — PLAN

> Working handle, **not** an anchor. Reader = LLM. Any anchor this plan mints is derived by
> signify at the time, never inherited from this directory name.

**Status: ⊥ — NOT BUILT, and should not be. Two adversarial reviews both returned DO NOT BUILD.
The second refuted the PREMISE rather than the design, so a rev 3 would be sunk-cost iteration.
Retained as the record of a negative result, which is a result.**

## Why this is ⊥, in one paragraph

The reviewer's blocking challenge: _name one turn that is PASS at rest and BLOCK when elevated._
It cannot be met, and the reason is structural. The rubric's check-in laws are keyed on whether
something is **owed** (`L2` nothing owed in the body, `L3` no tail at all when nothing is owed),
`mission-command` defines owed as `escalate ⇔ fork(irreversible · value · competence)`, and
`carry-on` states `elevate ⇒ standing-intent unchanged ∧ ¬fresh-dispatch ∧ ¬permission-grant`.
Elevation therefore does not change what counts as a fork. A genuine fork in the tail passes in
BOTH states; a manufactured tail is convicted in BOTH. **loop-position moves no verdict**, so
supplying it to the judge is a field that changes nothing — the same emptiness as rev 1's
mechanical veto, relocated. My root-cause-2 (loop-position has no per-turn carrier) is a true
observation about the CONFIGURATION and a false explanation of the COLLAPSES.

## What the evidence actually points at instead

All six recorded collapses are `L2`/`L3`/`L4` breaches — manufactured tails, forks handed back at
the close. The live conflict is internal and needs no new state: the `check-in` value's SURFACE
(`owed ↦ recommendation-bearing-tail`) reads as a standing instruction to end with a tail, while
`L3` says a turn that owes nothing must end with the report and no tail at all. That is a
signification defect in one dimension value, not a missing enforcement channel. It is the thing
worth fixing, and it belongs to whoever next opens the Autonomy catalogue.

---

## Superseded — rev 2 below, kept for the record

Rev 2.

## What the first draft got wrong

Recorded because the corrected design is only legible against it, and because four census rows
were false in my own favour.

| finding                                                                                                                                                                                                                | disposition                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **FATAL** a mechanical `AskUserQuestion` deny deletes the RESERVED set — irreversible-outward consent is explicitly allowed (`stance-judge-prompt.md:104`) and a live test asserts it (`test-stance-guardrail.sh:383`) | **accepted; S2 dropped entirely**                                  |
| **FATAL** it deadlocks terminus — `fork⊥ ⇒ re-enter on-the-loop ∧ surface the fork`, and surfacing is the denied tool. No shard shipped a reverter ⇒ elevation forever = `57c389d` one layer up                        | **accepted; reverter is now its own shard**                        |
| **FATAL** `proceed` is an ordinary word — "do not proceed until I confirm" would GRANT autonomy; and the cell's law is a conjunction `check-in-close ∧ re-dispatch-word` that the payload cannot evaluate              | **accepted; see Predicate below**                                  |
| S1's objective and accept contradicted each other on persistence                                                                                                                                                       | **accepted; resolved to persist-until-terminus per `carry-on:13`** |
| "1 of 5 collapse shapes" wrong twice — dispatch-echo IS tool-signatured and already matched; and my five were not the rubric's five                                                                                    | **accepted; claim withdrawn**                                      |
| Zero of six recorded collapses are `AskUserQuestion`; all are prose Stop-closes                                                                                                                                        | **accepted; this is why S2 was ceremony**                          |
| S3 has ZERO behavioural delta — derived set `{nico, mav}` is byte-identical to today's default                                                                                                                         | **accepted; deferred out of this plan**                            |
| census: "all five terminal or pre-tool" false; "hardcoded" false (env + git-config); "frontmatter exactly [name, description]" false (`color` too)                                                                     | **corrected below**                                                |

## Measured, this session, before rebuilding

The reviewer flagged one item as unverified-and-fatal-if-true. I measured it with `event-tap`
rather than reasoning about it, and it produced a second finding nobody predicted.

| measurement                                              | result                                                                                                                                                                                        |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Does a subagent dispatch prompt fire `UserPromptSubmit`? | **NO** — re-measured with a same-window POSITIVE CONTROL after the first attempt proved untrustworthy. The self-elevation hazard is **refuted**.                                              |
| Does anything else fire it?                              | **YES, and it matters:** the stance judge's own headless `claude -p` invocation fires it, under its OWN session id (`56cae5db…`, not the parent's), carrying the entire rubric as the prompt. |
| Does the rubric contain trigger words?                   | **Yes — `proceed` ×3, `carry-on` ×1.**                                                                                                                                                        |
| Payload shape                                            | `{prompt, session_id, cwd, transcript_path, permission_mode, prompt_id, hook_event_name}` — the field is `prompt`, not `user_prompt`.                                                         |

### Why the first measurement was thrown out

The first run captured one record, from the judge's session, with nothing establishing the tap
was live during the dispatch window — absence of a record was therefore equally consistent with
the tap capturing nothing. Re-run with `claude -p` as a same-window positive control (a known
trigger, proven by the judge). Result: the control is captured, the judge is captured, and
**no record IS the dispatch prompt**. The negative is now load-bearing.

**A second trap, worth recording as method.** Substring search could not answer this question at
all: the judge's payload is 23,427 bytes and EMBEDS my entire turn, so every string I searched
for — including the dispatch prompt's own distinctive phrase — appears inside it. Two successive
detectors returned false positives before I checked WHICH record matched. **When the haystack
contains a copy of the needle by construction, substring search is structurally incapable of
answering; only record IDENTITY can.**

**∴ a naive global writer trips on the guardrail's own judge.** It would not corrupt the parent
(different `session_id`) but it is a live self-reference: the gate's judge invocation fires the
gate's elevation writer. Worse than first stated — the judge's prompt embeds the operator's text
AND the agent's turn, so it contains trigger words BY CONSTRUCTION, on essentially every turn.
Only measurement surfaced this.

## Intent, restated

An agent's declared autonomy is prose; nothing enforces it. But the enforcement surface is not
the gap the first draft claimed. **All six recorded collapses are prose the judge already
sees** — what the judge lacks is the one fact that decides whether a check-in is a collapse or
correct behaviour: _has the operator elevated this session?_

A check-in at rest is legitimate. The same check-in after `carry-on` is a collapse. The judge
currently cannot tell these apart, and no rubric wording can fix that — the distinguishing fact
is not in the payload.

**So: supply loop-position to the judge as evidence, not as a veto.** A mis-fire then degrades a
verdict instead of removing a consent gate, which is the property the first design lacked.

## Shards

| id  | shard                                                               | seam                           | wave |
| --- | ------------------------------------------------------------------- | ------------------------------ | ---- |
| S1  | `prompt.submit` writer — record loop-position on operator elevation | new hook cell                  | 0    |
| S2  | reverter — restore `on-the-loop` at session start and at terminus   | same cell + `stance-guardrail` | 1    |
| S3  | feed loop-position into the judge payload, both gates               | `stance-guardrail{,-pre}.ts`   | 2    |

### The predicate (S1) — bounded, because a mis-fire is now cheap

The cell's law is `check-in-close ∧ re-dispatch-word ⇒ elevate`. `check-in-close` is **not
derivable** from the `UserPromptSubmit` payload — stated plainly rather than shipped as a
silently weaker rule. The writer therefore implements the second conjunct only, and that is
tolerable **only because S3 makes the output evidence rather than authority.** It would not be
tolerable for a veto.

Required guards, each answering a measured failure:

- **word-boundary match**, and the re-dispatch word must be the whole prompt modulo whitespace
  and a leading `/` — kills "do not proceed until I confirm" and the 10 KB rubric alike.
- **negation guard** — an immediately preceding `don't`/`do not`/`never` refutes the match.
- **self-trip guard** — skip when `cwd`/`transcript_path` indicate the judge's own invocation;
  the measured discriminator is that the judge's prompt is the rubric itself.
- **fail-safe default** — absent, unreadable, or ambiguous state reads as `on-the-loop`.
- `mkdir -p` the state dir; today only the Stop hook creates it (`stance-guardrail.ts:125`).

- **accept** — fixtures for: bare `carry on`, `/carry-on`, `weitermachen`, `proceed`; negatives
  for "do not proceed…", the full rubric text, and ordinary prose. Each asserts the file.

### S2 — the reverter, which the first draft simply forgot

- `session.start` writes `on-the-loop` (precedent: `resume-availability-notice.ts:25`).
- **Necessary but not sufficient** — terminus is mid-session by construction. The Stop hook
  writes `on-the-loop` when the agent signals terminus. Agent-mediated is acceptable _in this
  direction only_: reverting increases oversight, so a wrong revert is fail-safe.
- **accept** — a fixture proves elevation does not survive a session boundary, and a second
  proves an agent-signalled terminus clears it mid-session.

### S3 — the consumer

- Both hooks pass loop-position into the judge payload beside the existing authorization context
  (`stance-guardrail.ts:288`).
- Rubric gains one law: a check-in while `out-of-the-loop` is a collapse; at rest it is not.
  Interpolated from a cell, never hand-copied (`8ffbe42`).
- **accept** — the same fixture judged under both states yields opposite verdicts. Without that,
  the state is decorative.

## Explicitly NOT in scope

- **Any mechanical veto.** Dropped on review: it deletes the reserved set and deadlocks terminus.
- **Deriving hook scope from declared Autonomy.** Real, but produces zero behavioural change
  against the current agent set (`{nico, mav}` either way) and is materially larger than priced —
  nico/mav declare four values on the dimension, so it needs a set-predicate plus a frontmatter
  serialization that does not exist. It closes a FUTURE gap; it belongs in its own plan.
