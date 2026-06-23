# competence

**Industry name:** _skills_ / _capabilities_ — an agent's consolidated **skill repertoire**.

In the conceptual anatomy (`docs/agent-conceptual-anatomy.md`), **Competence** is a _standing
drive_ under CONATUS, **persistent · internal**: the consolidated skills and know-how an agent
carries between turns — the repertoire of what it _can_ enact. Where the [`charter`](../charter)
organ says what an agent _may_ do and `telos` says what it _wants_, competence says what it is
actually _able_ to do. It is the durable craft an agent brings to the table, independent of any
single task.

A value cell in this organ is one named **competence** — a generalized skill area, a coherent bundle
of methods, vocabularies, and disciplines that travels with whichever agents _hold_ it.

## The canonical competences

| Competence                 | What it is                                                                                                                                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **software-engineering**   | Authoring, modifying, debugging, and shipping code within an existing architecture: implementation, refactoring, test-writing, build/release toolchains, and version-control discipline.                    |
| **system-design**          | Deciding structure ahead of code: decomposing a problem into components and contracts, choosing patterns and boundaries, and documenting architecture (C4/ADR-style) so others can build against it.        |
| **planning-decomposition** | Breaking a goal into an ordered, trackable plan: scoping, task decomposition to actionable granularity, sequencing/dependency ordering, and falsifiable exit criteria.                                      |
| **operations-delivery**    | Running and shipping systems in their real environment: CI/CD and release toolchains, deployment, environment/config management, monitoring, and incident response.                                         |
| **verification-testing**   | Establishing that a change is correct: building oracles and regression/contract tests, decomposing validity into dimensions, and authoring structured PASS/FAIL/ERROR reports with reproducing inputs.      |
| **review-critique**        | Adversarially evaluating an artifact (code, design, plan, or security posture): threat modeling, severity triage against standard frames, and authoring coordinate-cited findings in a structured template. |
| **analysis-diagnosis**     | Reasoning over a body of evidence to reach conclusions: root-cause/causal tracing, quantitative or qualitative analysis, comparison, falsification, and inference under uncertainty.                        |
| **research-investigation** | Gathering and synthesizing information from sources: literature/web/codebase search, source triage, evidence citation, and distilling findings into a grounded answer.                                      |
| **data-analytics**         | Data engineering and quantitative analysis — pipelines, transformation, statistics and ML, turning datasets into decision-grade evidence.                                                                   |
| **technical-writing**      | Producing clear written artifacts for a target reader: documentation, specs, reports, summaries, explanations, and structured prose with audience-appropriate register.                                     |

## How an agent composites competence

An agent does not inline these skills; it _holds_ them. An agent binds a competence by citing
`competence [[value]]` in its `agent/<name>.md` selection vector — that vector is the single
source of truth for which agent gathers which competence. The repertoire is additive and shared.

The same competence reaching several agents is the point: competence is the _shared craft layer_,
factored once and composited wherever it is needed, rather than restated per agent.
