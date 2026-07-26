# discipline-anchor — PLAN

> Working handle; the plan's own name is **not** the anchor being sought. Reader = LLM.

**Status: READY — unblocked 2026-07-25 (see §Surfaced, below). Not sharded: a signify act, not an
execution plan. Remit: nico — naming is a signify act, and this anchor is the keystone the package split,
the CLI brand, and any repo rename all wait on.**

## Intent

**Name the type of work.** The project has a thesis, a canon, an engine, and seven skills — and no name
for the discipline they constitute. Everything downstream is blocked on it or misnamed without it: the
unified CLI brand (`install-parity` S4 / `agent-runtime` S9, both of which failed their negative control),
the package split (`compiler-projector-split`), and arguably the repo's own name.

Operator framing (2026-07-25): _"nail down the name of the type of work based on the core concept first —
the difference between 'context engineering' and what we are doing. It's very similar to context
engineering with a key distinction that is novel."_

## What is already known about the concept — do not re-derive this, derive the SIGN

VISION states the contrast directly (§Implication):

| discipline          | its question                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------- |
| prompt engineering  | How should we describe what we want?                                                          |
| context engineering | What information should accompany the request?                                                |
| **this**            | What canonical address does the model already recognize, and how can it compose without loss? |

The operator's 2026-07-25 VISION edit **sharpens where the novelty lives**: the defect in both incumbents
is that _"meaning is supplied to the model through natural language subject to misinterpretation."_ So the
distinction is **not** about how much context accompanies a request, nor about where context is assembled.
It is that the medium itself is ambiguous, and the remedy is to **address** a concept the model already
holds rather than **describe** it.

Supporting differentiae, all already load-bearing in the corpus:

- **Discovery, not authorship** — the sign is found by cold verification, never coined (cratylism).
- **The model is surveyed, not programmed** — it is a semantic space with existing structure, not an empty
  substrate awaiting description.
- **Runtime context is a projection, not a source** — the canon is authored; prompts are compiled targets.
- **Reproducible specification, not deterministic behavior** — the guarantee is on the spec, not the run.

## Contaminated candidates — none may be adopted without candidate-free re-derivation

Both self-floated and operator-floated candidates are contamination; a contrastive read of a _supplied_
candidate is **confirmation, not discovery**.

- **`semantic engineering`** — already in the root `README.md`. Self-floated, never derived.
- **`context engineering`** — the foil, not the thing.
- **`canonical semantic addressing`**, **`semantic address engineering`** — descriptive phrases from
  VISION's own prose, i.e. my own words fed back.
- **`cratylist engineering`** — theory-laden; names the philosophical commitment, not the practice.

## Method

`elicit` → `probe` → `signify`, with the **isolated** cold oracle: a tool-less `claude -p` from a scratch
dir outside this project, ambient context and tools both denied. A spawned subagent is context-warm and
does not qualify.

Two controls, both required:

- **Positive** — a coined token must decode to its generic prior (proves the oracle is cold).
- **Negative** — the **concept alone**, described candidate-free at its own altitude, must **regenerate**
  the anchor. This is the control that `install-parity` S4 failed six times, and failing it is a
  legitimate, publishable result: it means the anchor is _not yet discovered_ and must not be coined.

The definiendum must be handed over at full differentia — an under-specified definiendum yields the
**genus** sign, not the species address. S4's diagnostic was exactly this: the oracle returned "a build
tool" because it had been given the genus.

## Acceptance

The negative control passes: concept-alone regenerates one anchor across independent runs. Anything less
is recorded as a negative result with its diagnostic, **not** resolved by picking the best-sounding
candidate.

## Blocks

`compiler-projector-split` (package names), the unified CLI brand (`install-parity` S4 / `agent-runtime`
S9), and any future rename of the repo itself.

## Surfaced to the operator — RESOLVED 2026-07-25, this plan is unblocked

A VISION internal inconsistency was surfaced here and the operator settled it the same day in `cdd10fc`
(_"docs(vision): keep prompt engineering as foil, restore the remedy rebuttal"_). Both complaints are
discharged in the current text:

- The phrase subordinating the work to _"a new approach to **prompt engineering**"_ is **gone**. VISION
  line 15 now reads _"This project takes the opposite route"_, and §Implication still frames the work as a
  **third** question beside prompt and context engineering. Foil, not genus.
- The remedy rebuttal is **restored** at line 13 — bigger context windows, stronger models, memory, and
  tooling _"alleviate these symptoms without addressing the cause."_ That is the case for the discipline
  existing at all, and the derivation leans on it.

Nothing gates the derivation now. Verified against VISION.md @ `f1621b6`.
