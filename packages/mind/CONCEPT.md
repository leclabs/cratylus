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

## A second densification — formal blocks (hypothesis)

Name-density swaps prose for the best **word**. A **formal block** (set-builder, signature, law) applies the same move to a *process or rule*: it states the concept as its densest faithful sign instead of narrating it. **Hypothesis (held, not proven):** a self-sufficient block is mechanically denser *and* more verifiable than the prose, and the gain comes from structure, not style.

Three structural laws make it self-sufficient, each closing a prose failure:

- **closed** — every symbol resolves (notation table, a defining line above, a named corpus anchor, or a resolved input); no hand-waved term survives.
- **complete** — every behavior of the concept is a *line*; a mechanic that lives only in prose becomes a visible missing line.
- **ordered** — declarations above, laws below; no symbol used before it is defined.

The accept gate is a round-trip: `reconstruct(B) ≽ P` — read the block back to prose with no side knowledge and confirm it recovers the source equivalent-or-better. Unlike "is this paraphrase faithful?", that gate is checkable.

Toy — the prose *"a library lends a book to a member only when the book is on the shelf and the member is in good standing; lending takes the book off the shelf and records it against the member; good standing means no overdue loans"* becomes:

```text
M ≜ members ; B ≜ books ; L ≜ loans
shelf   ⊆ B
holds   : M → ℘(B)
overdue : M → ℘(L)

standing(m)   ⇔ overdue(m) = ∅
lendable(b,m) ⇔ b ∈ shelf ∧ standing(m)
lend(m,b)     ⇒ lendable(b,m)
lend(m,b)     ⊢ shelf' = shelf \ {b} ∧ holds'(m) = holds(m) ∪ {b}
```

Why we credit it: the block **forced** `holds : M → ℘(B)` to be declared — structure the prose implied ("records it against the member") but never made readable. Completeness turned a silent gap into a line. Where we expect it to break: **false precision** (a symbol bound to the wrong anchor reads as rigorous while asserting a falsehood); **completeness is judged, not proven** (a forgotten behavior passes silently); **closure is reader-relative** (a reader without the notation table cannot close it).
