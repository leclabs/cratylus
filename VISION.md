# VISION

> **Author semantics once. Realize behavior everywhere.**

Discover, validate, and canonize the semantic primitives encoded within foundation models, enabling deterministic construction of agents through composition of meaning rather than generation of prompts.

## Problem

Prompt engineering treats behavior as an emergent property of natural language.

As prompts evolve through iterative refinement, they accumulate ambiguity, redundancy, hidden assumptions, corrective patches, and contextual noise. This increases context consumption while simultaneously reducing determinism, producing conceptual drift, inconsistent behavior, hidden context collisions, and unpredictable execution.

Larger context windows, stronger reasoning models, memory, and auxiliary tooling alleviate these symptoms but do not address their underlying cause: behavior is still specified indirectly through prose.

## Thesis

> **Semantic engineering treats a foundation model not as a language model to be instructed, but as a semantic space to be addressed.**

![thesis.png](./thesis.png)

Foundation models encode rich semantic priors for concepts, abstractions, and formal systems.

The objective is therefore not to maximize descriptive fidelity, but to discover the canonical semantic representations that most precisely correspond to those latent semantics.

This shifts the source of truth upstream.

> **The source of truth is not runtime context; it is canonical semantics. Runtime context is a projection of canonical semantics, not its author.**

The challenge is therefore not to invent meaning, but to discover, validate, canonize, and compose the smallest set of semantic primitives that faithfully and reproducibly realize the intended behavior.

## Design Philosophy

> **Context engineering should be centralized within the canon.**

Semantic abstraction does not emerge automatically. It must be discovered, validated, authored, and maintained.

The purpose of the canon is to concentrate this work once so downstream consumers increasingly specify intent rather than implementation.

As the canon matures, operators should require progressively less knowledge of prompting, harnesses, frameworks, and runtime mechanics.

## Implication

> **The role of this project is to discover the canonical semantic layer from which context declarations become deterministic deployment artifacts.**

## Approach

Agent behavior should be authored as semantic canon rather than runtime prompts.

Runtime prompts, framework configurations, and harness-specific artifacts are deployment targets—not sources of truth.

The canonical source is a library of composable semantic primitives from which every runtime representation can be deterministically regenerated. Determinism is a property of the source and its projection, not of the model's stochastic execution—what the canon guarantees is a reproducible specification, not deterministic behavior.

## Non-Goals

This project does not seek to invent undocumented prompting techniques, replace foundation models with symbolic systems, or create another programming language.

Instead, it seeks to discover, validate, canonize, and compose semantic primitives that foundation models already interpret consistently.

## Relationship to the Model

This document explains **why** the project exists.

[`MODEL.md`](./MODEL.md) defines **what** exists.

[`ENGINE.md`](./ENGINE.md) defines **how** the model is authored, validated, composed, and deployed.

[`CANON.md`](./CANON.md) is the canonical corpus itself—the validated library of primitives.
