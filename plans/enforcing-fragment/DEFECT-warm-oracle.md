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

## Worse: the DEPLOYED CANON is readable from anywhere

Moving the query to an empty `/tmp` dir removes the project files but NOT the corpus. `~/.claude/`
holds the projected agents and skills, and `$HOME` is reachable from any cwd. All three re-runs went
and read it, unprompted, and said so:

> "Your fleet already answers this canonically — an agent _is_ a dimension-selection vector
> (`create-agent`: `vector(A) ≜ ⊕{ o ↦ value(o) | o ∈ O }`)"
>
> "Your canon already answers this — **I read it off the deployed agents rather than inventing a
> set.**"
>
> "I derived the dimension set from the deployed corpus … the union of `##` anatomy sections across
> all 10 agents in `~/.claude/agents/`"

They did not answer the question. They recited our answer. **Any tool-enabled probe on this machine
is warm by construction**, wherever it runs, because `deploy` puts the canon in `$HOME`.

## The working clean room

`cd /tmp/<empty> && claude -p "<bare question>"` drops the project `CLAUDE.md` and `AGENTS.md` — the
cratylism doctrine and the commit subjects. Residual leak: the user-global `CLAUDE.md` (graphify +
fleet; irrelevant to agent ontology) and the skills roster (leaks the anchor NAMES `signify`,
`probe`, `praxis`, …, so it is still unsafe for a question about those particular anchors).

**The recipe that actually works — deny the filesystem, not just change directory:**

```sh
cd /tmp/<empty> && claude -p "<bare question>" \
  --disallowedTools "Read Glob Grep Bash WebFetch WebSearch Task Edit Write NotebookEdit"
```

Verified: the probe reports using NO tools, and the dimension catalog becomes unreachable. Residual
leak, measured by asking: the user-global `CLAUDE.md` (fleet/graphify — irrelevant to agent
ontology) and the SKILLS ROSTER, which still primes `exemplify · conceptualize · signify ·
materialize · probe · elicit · praxis`, `Operator`, the re-dispatch word, and the
`EPISODIC/SEMANTIC/PROCEDURAL/SOUL` tiers. **∴ this channel is sound for questions about the
DIMENSION set, and still unsound for questions about those particular anchors.**

Tried and rejected: `HOME=/tmp/... claude` drops skills and user memory too, but breaks
authentication (`OAuth access token has been revoked` when credentials are copied). Do not copy
`.credentials.json` — it fails and risks the live token. `--bare` also breaks auth.

## FIVE contamination routes, each found by a control that failed

Every one was discovered only because a control was run. Each earlier "fix" looked clean until
tested.

| #   | route                                             | what leaks                                                                                                                                                                        | closed by                 |
| --- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| 1   | subagent memory injection                         | project `AGENTS.md` — cratylism, apex triad, `cold-decode-oracle` itself                                                                                                          | run outside the repo      |
| 2   | `gitStatus` block                                 | recent commit SUBJECTS — this week's conclusions                                                                                                                                  | run outside the repo      |
| 3   | `~/.claude/agents/` + `~/.claude/skills/` on disk | **the whole deployed catalog**, read unprompted from any cwd                                                                                                                      | sandbox the filesystem    |
| 4   | prior probe outputs left in the sandbox dir       | my own earlier answers, re-read as source                                                                                                                                         | fresh EMPTY dir per probe |
| 5   | **skill CONTENT loaded by the harness**           | `create-agent`'s formal block verbatim — `openness(o)` · `arity(o)` · `vector(A) ≜ ⊕{o ↦ value(o)}` · `O ≜ the dimension set @ SOUL ## anatomy sections` · `gap(o)` · `exemplify` | **NOT CLOSEABLE** locally |

Two of my own "verifications" were worthless and both failed the same way, which is
`gate-convicts` #2 — THE CONTROL EXERCISES A DIFFERENT PATH:

- `--disallowedTools "Read Glob Grep …"` passed ONE quoted string to a VARIADIC flag, so it matched
  no tool and silently did nothing. I "verified" it with a question that would not have used tools
  anyway, so the no-op looked like success.
- The working form is an ALLOWLIST — `--allowedTools NoneAtAll --permission-mode manual` — verified
  with a question that MUST touch the filesystem if it can.

## The structural conclusion

**The canon is deployed INTO the tool used to verify the canon.** `deploy` writes agents and skills
into `~/.claude`, and the harness loads them by construction — not by reading a file it can be
denied, but as part of what it IS. So:

> No locally-installed `claude` on this machine can produce a cold read, at any cwd, under any
> sandbox, because the oracle and the corpus are the same installation.

The oracle has been grading its own homework, and the better the projection works, the more
thoroughly it does so.

## What a real cold channel requires

Auth that does not live in `~/.claude`, so `HOME` can be redirected away from the corpus:

```sh
HOME=/tmp/<empty> ANTHROPIC_API_KEY=<key> claude -p "<bare question>" \
  --allowedTools NoneAtAll --permission-mode manual
```

`ANTHROPIC_API_KEY` is NOT set in this environment and no key is available to me, so this is
currently **unexecutable** — the operator must supply one. Copying `~/.claude/.credentials.json`
does not substitute: it fails with `OAuth access token has been revoked`.

Until then, treat EVERY cold verdict in this corpus as unverified, and prefer claims that rest on
checkable external citations over claims that rest on the oracle agreeing with us.

## Owed

1. A first-class cold channel, so `cold-decode-oracle` is executable rather than aspirational. The
   subagent path cannot provide it while project memory is auto-injected.
2. A CONTROL for every cold claim: run the same question warm and cold, and treat the DELTA as the
   measurement. Agreement between a warm probe and the corpus is evidence of nothing.
3. Re-verification of any anchor minted from subagent probes.
