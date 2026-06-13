# Concept — what mind does, and why it works

## What

Build a library of **semantic fragments** — small, named ideas — that compose richly while avoiding context rot, bloat, and duplication. Each idea has **one home**; everything that needs it references that home rather than restating it.

## How

Given an input (a doc, a spec, a transcript), reduce it:

1. **Find the best word** for each idea the input expresses — the densest name that already carries that idea's meaning.
2. **Reword** the input in those best words.
3. **Remove** the prose the best words already imply — once the right name is there, the explanation is redundant.
4. **Recut** what remains into **MECE** fragments — non-overlapping, collectively exhaustive, one idea each.

The result is a library keyed by those best words, each a reusable fragment.

## Why it works

The readers are LLMs, and **an LLM already attaches rich meaning to the best word**. A well-chosen name needs no description — the reader already holds it. So swapping prose for the right name loses nothing and gains density: the meaning rides in the name, and the reader unpacks it on arrival.
