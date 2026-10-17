# Model Driven Meaning

_context design patterns_

An agent's context is full of concepts: roles, rules, steps, checks. Most prompts spell each one out in prose, even though the model already knows nearly all of them by their established terms. The prose adds length, slant, and room to drift.

**The pattern:** write each concept as the term the model already reads as that concept in your domain, plus a short correction for whatever is missing or spurious.

![An agent's context: terms that point into the model](docs/figures/figure-context.svg)

Each term works like an address: it points to a concept the model already holds, so the context carries only the correction. _Code review_ needs two corrections. _Acceptance criteria_ and _nit_ need none.

## Why it works

![A term already carries most of a concept](docs/figures/figure-gap.svg)

Read in its domain, a term calls most of a concept to mind. The gap that's left has two sides. The correction states what's **missing**, and rules out what's **spurious**: the false expectations a term brings with it. Spurious is the side that misleads. The best term leaves the smallest gap. Which term that is depends on the model, so it is found by asking the model, not picked by taste.

## Finding the term

![Narrow in on what you mean, then confirm the term cold](docs/figures/figure-process.svg)

You know the concept, and the model knows the terms. It proposes, you judge, until one candidate means exactly what you mean. Then a fresh model, given only the term and its domain, must say what it means. Whatever its reading leaves missing or makes spurious goes into the correction. Only you can confirm the meaning, and only a model that hasn't seen the conversation can confirm the term.

## Why adopt it

- **Shorter contexts:** the term carries the concept.
- **The risky part is explicit:** spurious expectations are ruled out by name.
- **Testable:** a cold read shows what a term means. Prose offers no such check.
- **No drift:** each correction lives once, beside its term.
- **Honest scope:** a term's fit is a fact about a model, so note which models it was checked on, and check again when the model changes.
