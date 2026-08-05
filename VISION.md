# VISION

> **Author semantics once. Realize behavior everywhere.**

Discover, validate, and canonize the optimal-signifiers already recognized by foundation models, then compose those anchors into reproducible specifications for agents, skills, and other runtime artifacts.

The practice has a name: **latent lexicography** — the descriptive lexicography of a foundation
model's latent vocabulary. **Cratylus** is its instrument, and this repository is that instrument's
source. The name of the practice and the name of the tool were both discovered by the discipline they
name; neither was chosen. See [The discipline](#the-discipline).

## Problem

Conventional prompt and context engineering treats behavior as an emergent property of authored natural language, meaning is supplied to the model through natural language subject to misinterpretation.

As prompts and contexts evolve through iterative refinement, they accumulate ambiguity, redundancy, hidden assumptions, corrective patches, and contextual noise. The result is greater context consumption with weaker specification integrity: conceptual drift, inconsistent behavior, hidden collisions, unpredictable execution, and cross-model fragility.

Larger context windows, stronger reasoning models, memory, and auxiliary tooling may alleviate some of these symptoms, but they do not address the root cause: meaning is still conveyed by description, in a medium that admits misinterpretation.

This project takes the opposite route - discovering and canonizing the optimal-signifiers a foundation model already recognizes, so intent is **addressed** rather than **described**.

## Thesis

> **For every concept a foundation model encodes, some signifier invokes it more precisely than any other. That signifier — its optimal-signifier, σ\* — is a fact about the model, so naming is discovery rather than invention.**

Foundation models encode rich priors over semantic content, relational structure, and compositional rules. Precision is therefore not uniform across the signifiers that could name a concept: some carry accidental meaning the concept does not have, some fail to carry meaning it does. A minimum exists, and the discipline is finding it.

<!-- ONE CONCEPT, ONE SIGN. This section carried `semantic address` and
     `optimal-signifier` as two names for one thing — "it's optimal-signifier, or
     semantic address" — and the thesis above then defined the first in terms of
     the second, which read as a definition and was a tautology. Retired
     2026-08-05 in favour of `optimal-signifier`, on three grounds: σ* already
     spells it (σ = signifier, * = optimal), so there is no translation step;
     `address` as a NOUN imports content-addressable-memory and network priors,
     the same accidental mass that disqualified `semantic addressing` as a name
     for the discipline; and the substitution made both sentences visibly
     circular, which is the proof they were one concept.

     `address` as a VERB stays. "Addressed rather than described" is the contrast
     that carries the thesis, and a verb is not the noun. -->

The word does real work in the other direction, though: to **address** a concept is to invoke it by the sign the model already binds, as against **describing** it and hoping the reconstruction lands. That contrast is the whole inversion, and it is why this project treats the model as a source of naming truth rather than as an audience for explanation.

### Core Concept: The Theoretical Ideal Optimal-Signifier

```
σ^*(c) = argmin_{σ} μ(I(σ) △ C(c))
```

**Where:**

- **σ** is a candidate signifier
- **σ^\*(c)** is the optimal-signifier for concept c
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

## Anchors

σ\* is an ideal. What a canon actually holds is an **anchor**.

The distinction is load-bearing and was previously lost. [`MODEL.md`](./MODEL.md) already carries it: a
concept's body is `⟨α(c), residue(c)⟩` — the anchor α, plus whatever meaning the anchor does not
already fire. **An anchor whose residue is ∅ _is_ σ\***. Every other anchor is an approximation with
its shortfall stated, which is why the residual is recorded rather than explained away.

So an anchor is not canonical because it is elegant, memorable, or preferred by its author. It earns
canonical status through evidence: it cold-decodes to the intended concept, preserves the required
distinctions, composes without collision, and stays stable across the models and runtimes for which
it claims validity.

Canonical does not mean universal. An anchor may hold across a broad model population or be scoped to
a family, a capability class, or a runtime — and its scope is part of its specification, not a
footnote to it.

The objective is not brevity. It is precision with minimal accidental meaning, which is frequently
_longer_ than the elegant alternative.

## Design Philosophy

> **Context engineering should be centralized within the canon.**

Semantic abstraction does not emerge automatically. Anchors and their boundaries must be discovered, tested, recorded, composed, versioned, and maintained.

The canon concentrates that work so downstream consumers can increasingly declare intent instead of reimplementing its linguistic realization. As the canon matures, operators should require progressively less knowledge of prompting techniques, harnesses, frameworks, and runtime mechanics.

The canon therefore functions as a semantic source language. Agents, skills, prompts, framework configurations, and other executable contexts are deterministic projections of that source into particular deployment targets.

## Approach

The project follows a disciplined lifecycle:

1. **Discover** candidate signifiers already bound to the intended concept by model priors.
2. **Verify** each candidate through cold decoding, contrastive tests, boundary tests, and cross-model evaluation.
3. **Canonize** the validated anchor with its meaning, scope, provenance, constraints, and version.
4. **Compose** anchors into higher-order semantic specifications without duplicating or obscuring their meanings.
5. **Project** those specifications deterministically into runtime-specific artifacts.
6. **Validate** that each projection preserves the canonical semantics under its declared target conditions.

This separates two kinds of uncertainty that prompt-centric systems often conflate. The canonical specification and its projection should be reproducible. Model execution may remain stochastic.

> **The canon guarantees a reproducible semantic specification, not deterministic model behavior.**

## The discipline

The practice this document describes is **latent lexicography**.

The head noun is chosen by its deliverable, not by its atmosphere. A cartographer produces an atlas — coverage, terrain, relation. That is not what this project emits. It emits one entry per concept: a headword, the sense it binds, the evidence that the binding holds, the population it holds for, and the edition in which it was recorded. The practice that produces entries of that shape has a name with three centuries of method behind it, and borrowing it imports the method rather than a metaphor.

Lexicography also carries the exact polemic this project is making. A lexicographer does not legislate what a word means; they report what a speech community has already bound, and they cite the evidence. **Descriptive, not prescriptive** — with the corollary that an entry without attestation is not an entry. Substitute a model's priors for the speech community and the discipline transfers intact, including that ethic.

`latent` carries the rest of the load: the vocabulary exists, unsurfaced, awaiting description. It is not lost, buried, or damaged — which is why _excavation_ and _archaeology_ were rejected, both smuggling in a decay that is not there. Nor is it authored, which is why the practice is not a branch of prompt engineering.

|                         | the question asked             | where meaning comes from |
| ----------------------- | ------------------------------ | ------------------------ |
| prompt engineering      | how should I **describe** it?  | the author               |
| context engineering     | what should **accompany** it?  | the assembled window     |
| **latent lexicography** | what is it **already called**? | **the model**            |

The discipline's extension is the discovery-and-record half: discover, verify, canonize. Composition and projection are ordinary compilation over a novel source language, and are deliberately not smuggled into the name. That is not a narrowing. It locates the novelty precisely — **in where the vocabulary comes from** — and leaves everything downstream boring, which is what a source of truth is for.

### Cratylus

The instrument is named **Cratylus**, after the dialogue in which the question this project answers is first put: whether names are correct by nature or by convention. The mark states the thesis in one word, and it was admitted the same way any other sign is — by cold decode, not by preference. Read blind, with no access to this repository, it returns _"deriving names automatically from structure and semantics rather than letting developers pick them freely"_ and _"correctness is discoverable rather than a matter of convention or consensus."_

That is `σ*(c) INTRINSIC ∧ DISCOVERED ¬coined` recovered from the sign alone, by a reader who had never seen the axiom. It is the strongest reverse decode this project has recorded, and it is the whole warrant for the name.

## Implication

The project is not primarily a prompt library. It is infrastructure for discovering and maintaining the canonical semantic layer from which runtime context can be generated.

Context ceases to be the author of meaning and becomes its deployment representation.

## Philosophical Foundation

This architecture is compatible with a **Cratylist** account of naming, drawn from Plato's _Cratylus_: for the purposes of this project, the canonical sign of a concept is treated as intrinsic and discoverable rather than freely conventional.

This is an engineering constraint, not a claim that all language has one objectively correct name. Within a declared model population, target concept, and validation method, naming is treated as a fact to investigate rather than a preference to settle.

The constraint therefore reaches **every authored surface**, and it recognizes no privileged kind: prose, identifier, and path are one register, each carrying either an optimal-signifier or a composition of them. An enumeration of the surfaces that qualify would be a bound on the discipline, and there is none — anything this project writes is subject to the same cold-verification.

Principles such as `cold-decode-oracle`, `llm-native`, and σ\* follow from this commitment: semantic bindings are tested against model priors before they are admitted to the canon.

## Non-Goals

This project does not seek to:

- invent undocumented prompting tricks;
- claim direct access to a model's internal representations;
- replace foundation models with symbolic systems;
- eliminate stochasticity from model execution;
- assume that one anchor is universal across all models; or
- create another general-purpose programming language.

It seeks to discover, validate, canonize, and compose optimal-signifiers that foundation models already interpret consistently, then realize those semantics across deployment environments without making runtime prose the source of truth.

## Relationship to the Model

This document explains **why** the project exists.

[`MODEL.md`](./MODEL.md) defines **what** exists.

[`ENGINE.md`](./ENGINE.md) defines **how** optimal-signifiers are discovered, validated, canonized, composed, projected, and deployed.

[`CANON.md`](./CANON.md) is the canonical corpus itself: the validated library of optimal-signifiers and compositions.
