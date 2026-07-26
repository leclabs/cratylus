# discipline-anchor — PLAN

> Working handle; the plan's own name is **not** the anchor being sought. Reader = LLM.

**Status: RUN 2026-07-26 — NEGATIVE RESULT. The anchor is not discovered and must not be coined. The
positive control passed; the negative control failed, and its diagnostic is convergent and precise (see
§Derivation record). Not sharded: a signify act, not an execution plan. Remit: nico.**

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

---

# Derivation record — 2026-07-26

## Rig

Cold oracle ≜ `claude -p --safe-mode --tools="" --setting-sources "" --strict-mcp-config --mcp-config
'{"mcpServers":{}}' --no-session-persistence --system-prompt <replaced>`, cwd `/tmp/cold-oracle-da`.
Replaced system prompt is load-bearing: it strips the harness env block (cwd · git status · memory paths).
Isolation smoke-tested before use — oracle confirms no filesystem, no project, no cwd knowledge.
Orchestrated from a warm session; the warm session is never the oracle. Models: opus · sonnet.

## POSITIVE CONTROL — PASS

| token                        | cold decode                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| `semantic engineering`       | ontology engineering / Semantic Web **and** PLT-Redex formal-semantics engineering |
| `cold-decode oracle`         | "not established" → compositional reading from parts                               |
| `cratylist engineering`      | "not established" → Plato/Genette + content-addressing analogy                     |
| `canonical semantic address` | "not established" → compositional reading from parts                               |

Oracle is cold: it holds no project knowledge and says so unprompted.

**Side finding, standing:** `semantic engineering` is **disconfirmed by cold decode** — it collides with
two established fields. It is a genus-collision, not a free sign. It is live in `README.md:3` and
`docs/research/semantic-engineering-research-candidates.md:1`.

## NEGATIVE CONTROL — FAIL

Definiendum handed over at full differentia, candidate-free, foil described but never named, `engineering`
/ `semantic` / `address` / `canonical` all withheld so no morphology was seeded. Differentiae supplied:
D1 model-as-existing-meaning-structure · D2 discovered-not-invented, coinage barred · D3 naive-instance
test is sole standing · D4 versioned record scoped by model range, composes without collision · D5 record
is source, runtime is generated · D6 reproducible spec ≠ deterministic behavior · D7 defined against
description-as-medium.

Differentiae were **received** — every run correctly ruled out prompt engineering, context engineering,
soft prompts / prompt tuning, activation steering / representation engineering, prompt compilation,
ontology design, and DSL design, each on the right grounds. This was **not** the S4 genus failure.

Denotation-forced runs, full definiendum — **6 distinct strings / 8 runs**:

| run | model  | returned                            |
| --- | ------ | ----------------------------------- |
| 1   | opus   | LLM lexicography                    |
| 2   | opus   | Semantic anchoring                  |
| 3   | opus   | Latent-space (model) lexicography   |
| 4   | opus   | Semantic anchoring                  |
| 5   | sonnet | Test-driven prompting               |
| 6   | sonnet | Prompt lexicography                 |
| 7   | opus   | Model-native semantic specification |
| 8   | opus   | Semantic anchoring                  |

Mode `semantic anchoring` 3/8, opus-only. Genus `lexicography` 3/8 heads + invoked in 2 further
rationales. **No convergence on one anchor. Acceptance not met.**

Existence-question runs (escape hatch offered instead of forcing a term) — **2/2, opus and sonnet: "no
established term."**

## ROUND-TRIP — 5/5 candidates FAIL, all on the same differentia

Each oracle-generated candidate decoded cold in isolation (one candidate per run, no candidate set shown)
and scored against D1–D7:

- `semantic anchoring` → domain-vocabulary term binding. **Inverts D2**: "identity must be authored, not
  inferred", "decides meaning before the fact". D1 ✗, D7 ✗.
- `LLM lexicography` → authoring prompt vocabulary. **Inverts D2**: "prescriptive: it decides what X will
  mean and installs it"; "the model is never an authority on its own vocabulary."
- `model lexicography` → domain-model dictionary. D1 ✗, and **inverts D5**: "downstream of the running
  system… nothing compiles from it."
- `prompt lexicography` → closest. Recovers D3 D4 D5 D7. **Still authored-sense on D2** — corpus is
  observed production usage, not pretraining priors.
- `test-driven prompting` → TDD over prompt strings. D1 ✗ D2 ✗; recovers D5 D6 only.

## ABLATION — the residue, isolated

**ABL-1** (D2-discovery and D3-cold-test removed, all else held): convergence **sharpens** — 2/2 on the
`semantic + ⟨mechanism⟩` form, `semantic compression` and `semantic compilation`. The scatter is caused by
D2/D3 and by nothing else.

**ABL-2** (D2 alone, at its own altitude): nearest attested sign is **`term selection`** — the ISO 704
onomasiological move, concept-first, reportive direction of fit, selection from what is attested,
abstention where nothing is. The oracle judges it insufficient: it is bound to a **human speech community**
as attester, not to a model. Second run: "There is no established term for it… coining a name here would be
exactly the stipulative move the act forbids, so I'll leave it unnamed." Cross-model (sonnet) surfaced
genuine prior art for the **act** in a restricted setting — **`answer engineering` / verbalizer search**
(Liu et al. 2021, _Pre-train, Prompt, and Predict_): fix the class, search candidate words for the one the
pretrained model already binds, adopt whichever tests clean. Scoped to classification labels; names the
move, not the discipline. **Worth checking as prior art.**

**Extension probe** — term selection applied reportively to itself, attester swapped human→model, one
variable changed: **3/3 runs, verbatim, "Nothing is attested for it."** Each independently names the same
neighbour set (probing · elicitation · knowledge extraction · term extraction · prompt engineering), each
gives the same reason — all are bound to _measuring what a model encodes_, none to _concept-first reportive
selection from a model's attested bindings with abstention_. Each independently concludes that the correct
output of the act applied to itself is abstention. **The abstention converges harder (3/3) than any
positive candidate did (3/8).**

## Diagnostic

The priors carry a sign for every part of this concept **except one conjunction**: reportive direction of
fit in naming, with **a trained model as the attesting community**. The available naming-discipline lexicon
is Hermogenean — `anchoring`, `lexicography` as practiced in software, `glossary`, `DSL`, `ontology` all
cold-decode to _an authority decides the sense and installs it_. The reportive direction has exactly one
attested sign, `term selection`, and that sign is bound to human speech communities.

So the species address is not merely unfound: **the location in sign-space is occupied by its own inverse.**
A compositional σ\* cannot rescue this — composition can only combine existing signs, and the
differentiating sign does not exist. This is a property of the model's semantic space, not a defect of the
definiendum or the rig, and it is the empirical confirmation of the operator's framing: the distinction is
novel in the strict sense — **unaddressed**.

## Consequences

- **Do not coin.** Adopting the 3/8 mode would be fiat, and `semantic anchoring` is affirmatively
  disconfirmed by round-trip — it decodes to the inverse of cratylism.
- **`semantic engineering` is disconfirmed**, not merely underived. It remains live at `README.md:3` and in
  `docs/research/`. No replacement is available; flagged, not edited.
- **Downstream plans change character, not just status.** `install-parity` S4 (CLI brand),
  `compiler-projector-split` (package names), `heartbeat-organ` O4, and any repo rename were waiting on
  this anchor. Cold verification says the anchor is not there to be found at this altitude, so **more
  derivation effort at the discipline altitude will not unblock them.** Their live options are (a) name at
  a lower altitude — the artifact, the mechanism, the deliverable, where ABL-1 shows the priors _do_
  converge — or (b) an explicitly declared stipulation held outside the canon and marked as such. Both are
  operator forks.
- **The negative result is the deliverable.** Reporting "not yet discovered" is a success of method under
  `cratylism`; the record above is the evidence.
