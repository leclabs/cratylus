# The cold-decode oracle is not cold when it runs in a subagent

**Severity: instrument-level.** `cold-decode-oracle` is a GROUND axiom — `truth(f) ≜ decode_cold(f)`
with **zero project-K**. Every probe dispatched via the Agent tool violates that precondition, and
the violation is invisible in the return.

## Measured

A diagnostic subagent was asked to report verbatim what was injected into its system prompt before
it received any instruction. It returned:

- `/Users/lex/.claude/CLAUDE.md` — user-global
- `/Users/lex/workspaces/agent-factory/CLAUDE.md` — project
- **`/Users/lex/workspaces/agent-factory/AGENTS.md`** — which carries the ENTIRE prime principle:
  `cratylism`, the apex triad `cratylism ≻ VISION ≻ MODEL`, **`cold-decode-oracle` itself**,
  `llm-native`, `signify`, "all naming … is discovered, never decided"
- `gitStatus` with recent commit SUBJECTS — including `activation is instance-level` and
  `substrate-relative`
- the full skills roster — `signify · probe · exemplify · conceptualize · elicit · materialize ·
formalize · praxis · dream · wake` — and agent names `nico · mav · boz`

So a "cold" probe is handed the doctrine it is supposed to be independent of, plus this week's
conclusions, before it reads the question.

## The contamination is VISIBLE in returns, once you look

Three probes were run on the bare question "what are the dimensions of a generic AI agent". They
returned, unprompted:

| returned phrase                                                | actual source                                      |
| -------------------------------------------------------------- | -------------------------------------------------- |
| "autonomy is an instance-level property, not a type-level one" | commit `1aa1779`/`1b3c6ed` subject, in `gitStatus` |
| "refusal law … substrate-relative"                             | commit `5d705d7` subject, in `gitStatus`           |
| "a value drawn either from a closed enum … or an open set"     | our `Classification = enum \| open \| coined`      |
| "episodic / semantic / procedural, or your factorization"      | our `memory` dimension                             |
| "what re-affirms authority after a check-in"                   | the `carry-on` skill description                   |
| "your cratylism ground" (an EARLIER probe, verbatim)           | `AGENTS.md`                                        |

**I read that agreement as independent confirmation.** It was an echo. This is
`uncontrolled-test-manufactures-defects` at instrument scale, and by `sweep-rubrics-first` a
corrupted oracle outranks any artifact defect it was used to judge.

## What is and is not invalidated

NOT invalidated: claims resting on checkable EXTERNAL sources — the guardrail taxonomy (NeMo rails,
Llama Guard, Bedrock), persona-drift (Li et al., COLM 2024), conformance checking (van der Aalst),
the instruction hierarchy (Wallace et al.), PSP→PSA, Rails `attr_accessible`. Those are citations,
verifiable independently of who asked.

INVALIDATED as _cold_: every naming judgement, every "the concept is real / not real" verdict, and
every apparent convergence with our own vocabulary. Those must be re-run cold before they ground an
anchor.

## The working clean room

`cd /tmp/<empty> && claude -p "<bare question>"` drops the project `CLAUDE.md` and `AGENTS.md` — the
cratylism doctrine and the commit subjects. Residual leak: the user-global `CLAUDE.md` (graphify +
fleet; irrelevant to agent ontology) and the skills roster (leaks the anchor NAMES `signify`,
`probe`, `praxis`, …, so it is still unsafe for a question about those particular anchors).

Tried and rejected: `HOME=/tmp/... claude` drops skills and user memory too, but breaks
authentication (`OAuth access token has been revoked` when credentials are copied). Do not copy
`.credentials.json` — it fails and risks the live token.

## Owed

1. A first-class cold channel, so `cold-decode-oracle` is executable rather than aspirational. The
   subagent path cannot provide it while project memory is auto-injected.
2. A CONTROL for every cold claim: run the same question warm and cold, and treat the DELTA as the
   measurement. Agreement between a warm probe and the corpus is evidence of nothing.
3. Re-verification of any anchor minted from subagent probes.
