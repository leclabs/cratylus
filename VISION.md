# VISION

> **Author semantics once. Realize behavior everywhere.**

Discover, validate, and canonize the semantic addresses already recognized by foundation models, then compose those addresses into reproducible specifications for agents, skills, and other runtime artifacts.

## Problem

Conventional prompt and context engineering treats behavior as an emergent property of authored natural language, meaning is supplied to the model through natural language subject to misinterpretation.

As prompts and contexts evolve through iterative refinement, they accumulate ambiguity, redundancy, hidden assumptions, corrective patches, and contextual noise. The result is greater context consumption with weaker specification integrity: conceptual drift, inconsistent behavior, hidden collisions, unpredictable execution, and cross-model fragility.

Larger context windows, stronger reasoning models, memory, and auxiliary tooling may alleviate some of these symptoms, but they do not address the root cause: meaning is still conveyed by description, in a medium that admits misinterpretation.

This project takes the opposite route - discovering and canonizing the semantic addresses a foundation model already recognizes, so intent is **addressed** rather than **described**.

## Thesis

> **The semantic address for a concept within a foundation model's semantic space is the optimal signifier that most precisely invokes that concept.**

Foundation models possess a latent semantic space built by encoding rich priors over semantic content, relational structure, and compositional rules. There must exist a signifier for every encoded concept that most precisely invokes that concept - it's optimal-signifier, or **semantic address**.

### Core Concept: The Theoretical Ideal Optimal-Signifier

```
σ^*(c) = argmin_{σ} μ(I(σ) △ C(c))
```

**Where:**

- **σ** is a candidate signifier
- **σ^\*(c)** is the optimal signifier for concept c
- **μ** is the semantic distance metric — semantic mass, not count
- **I(σ)** is the inferred concept from σ, i.e. σ's actual meaning-in-effect
- **C(c)** is the target concept c
- **△** is the symmetric difference

## The Inversion

This vision rests on three related inversions.

### Ontological Inversion

The conventional view treats the foundation model primarily as an inference engine that receives instructions. Our approach inverts this by assuming that foundation models have already encoded high fidelity representations of the concepts we want to express and optimal-signifiers which invoke them. By using the optimal-signifiers, we can invoke the intended concepts precisely, minimizing ambiguity and maximizing the reliability of the model's response.

The model is therefore treated as the semantic source of truth for concepts and their optimal-signifiers; a shared semantic vocabulary.

### Epistemic Inversion

The conventional view locates meaning in the prompt: the author explains a concept, and the model reconstructs it from that explanation.

This project begins from the opposite direction. Relevant meaning may already be encoded in the model's priors. The task is to identify the signifier that reliably selects it. Knowledge of how to express the concept is derived from empirical discovery of the model's semantic bindings—not merely from an author's preferred wording.

### Engineering Inversion

The conventional pipeline authors a prompt and observes behavior:

```text
intent → author → prompt → runtime → behavior
```

This project establishes a canonical semantic layer before deployment:

```text
intent → discover → verify → canonize → compose → project → deploy → prompt → runtime → behavior
```

The runtime representation is compiled from the canon. It is not the primary artifact and does not define the underlying meaning.

## Canonical Semantic Addresses

A canonical semantic address is the smallest optimal-signifier, or structured composition of optimal-signifiers, that reliably evokes an intended concept within the target foundation model's semantic space.

An address is not canonical because it is elegant, memorable, or preferred by its author. It earns canonical status through evidence: it cold-decodes to the intended concept, preserves the required distinctions, composes without semantic collision, and remains stable across the models and runtimes for which it claims validity.

Canonical does not necessarily mean universal. An address may be model-invariant across a broad population, or explicitly scoped to a model family, capability class, or runtime. Its scope is part of its specification and provenance.

The objective is not simply brevity. It is semantic precision with minimal accidental meaning.

## Design Philosophy

> **Context engineering should be centralized within the canon.**

Semantic abstraction does not emerge automatically. Addresses and their boundaries must be discovered, tested, recorded, composed, versioned, and maintained.

The canon concentrates that work so downstream consumers can increasingly declare intent instead of reimplementing its linguistic realization. As the canon matures, operators should require progressively less knowledge of prompting techniques, harnesses, frameworks, and runtime mechanics.

The canon therefore functions as a semantic source language. Agents, skills, prompts, framework configurations, and other executable contexts are deterministic projections of that source into particular deployment targets.

## Approach

The project follows a disciplined lifecycle:

1. **Discover** candidate signifiers already bound to the intended concept by model priors.
2. **Verify** each candidate through cold decoding, contrastive tests, boundary tests, and cross-model evaluation.
3. **Canonize** the validated address with its meaning, scope, provenance, constraints, and version.
4. **Compose** addresses into higher-order semantic specifications without duplicating or obscuring their meanings.
5. **Project** those specifications deterministically into runtime-specific artifacts.
6. **Validate** that each projection preserves the canonical semantics under its declared target conditions.

This separates two kinds of uncertainty that prompt-centric systems often conflate. The canonical specification and its projection should be reproducible. Model execution may remain stochastic.

> **The canon guarantees a reproducible semantic specification, not deterministic model behavior.**

## Implication

The project is not primarily a prompt library. It is infrastructure for discovering and maintaining the canonical semantic layer from which runtime context can be generated.

Prompt engineering asks:

> How should we describe what we want?

Context engineering asks:

> What information should accompany the request?

This project asks:

> What canonical address does the model already recognize for the intended concept, and how can that address be composed without loss?

The distinction is foundational. Context ceases to be the author of meaning and becomes its deployment representation.

## Philosophical Foundation

This architecture is compatible with a **Cratylist** account of naming, drawn from Plato's _Cratylus_: for the purposes of this project, the canonical sign of a concept is treated as intrinsic and discoverable rather than freely conventional.

This is an engineering constraint, not a claim that all language has one objectively correct name. Within a declared model population, target concept, and validation method, naming is treated as a fact to investigate rather than a preference to settle.

The constraint therefore reaches **every authored surface**, and it recognizes no privileged kind: prose, identifier, and path are one register, each carrying either an optimal signifier or a composition of them. An enumeration of the surfaces that qualify would be a bound on the discipline, and there is none — anything this project writes is subject to the same cold-verification.

Principles such as `cold-decode-oracle`, `llm-native`, and σ\* follow from this commitment: semantic bindings are tested against model priors before they are admitted to the canon.

## Non-Goals

This project does not seek to:

- invent undocumented prompting tricks;
- claim direct access to a model's internal representations;
- replace foundation models with symbolic systems;
- eliminate stochasticity from model execution;
- assume that one address is universal across all models; or
- create another general-purpose programming language.

It seeks to discover, validate, canonize, and compose semantic addresses that foundation models already interpret consistently, then realize those semantics across deployment environments without making runtime prose the source of truth.

## Relationship to the Model

This document explains **why** the project exists.

[`MODEL.md`](./MODEL.md) defines **what** exists.

[`ENGINE.md`](./ENGINE.md) defines **how** semantic addresses are discovered, validated, canonized, composed, projected, and deployed.

[`CANON.md`](./CANON.md) is the canonical corpus itself: the validated library of semantic addresses and compositions.
