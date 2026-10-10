# 0001 · Adopt the example driven workflow

Status: accepted · 2026-10-09

## Context

Agents working over long efforts lose the meaning of what they build: the concept is stated once and is crowded out by errors, diffs and test output; agents have no lasting memory, subagents start blank, and compaction sheds what was stated once. Two earlier designs (north-star, concept-driven development) froze the concepts but not the criteria for judging against them, so every assay re-derived what "realized" means, and they kept roles apart with prose instructions; neither converged.

## Decision

Cratylus ships the **example-driven workflow**: the meaning is a conceptual design per bounded context; before any build, concepts are illustrated as concrete examples (given, when, then) that are confirmed by the meaning-holder and frozen, with a share held out; builders iterate until the visible examples pass; one judgment runs the held-out examples and the assayers judge what cannot execute; one whole check; the operator releases. It composes established practice: Specification by Example (Adzic), test-driven development, eval-driven development with held-out cases (OpenAI evaluation best practices), orchestrator-workers and evaluator-optimizer (Anthropic, _Building effective agents_), domain-driven design's bounded contexts with consumer-driven contract tests, and continuous integration.

## Consequences

The design lives in `design/` until the concept journal holds it (decision 0014). The north-star and concept-driven development designs are superseded; their branches are archived as `archive/north-star-workflow` and `archive/concept-driven-development`.
