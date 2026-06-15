---
kind: principle
delineation: A formal block is the signum aptissimum of its concept — it carries the whole meaning, so it must be closed (every symbol declared, defined-above, or boundary-bound), complete (every operation and law a line), and ordered (definitions before use); prose reduces to boundary-bindings, and explanatory prose is a defect signalling an incomplete block.
---

# Self-Sufficient Formalism

A formal block (set-builder, signature, law) is the **signum aptissimum** of the concept it states ([[precise-circumscription]] · [[densest-faithful-point]]): the densest sign that carries the *whole* meaning. If prose is still required to explain what the comprehension means, the block is **incomplete** — repair the block, never prop it with prose.

Three conditions make a block self-sufficient — and one law follows:

```text
B ≜ a formal block : its definition and law lines
S ≜ symbols(B)
T ≜ the declared notation table
D ≜ { s │ a line of B defines s }
β ≜ { s │ s is boundary-bound : its anchor named in adjacent prose }

closed(B)   ⇔ S ⊆ T ∪ D ∪ β
complete(B) ⇔ ∀ b ∈ behavior(concept) : ∃ line ∈ B : line ⊨ b
ordered(B)  ⇔ ∀ s ∈ D : definition(s) precedes use(s)

self-sufficient(B) ⇔ closed(B) ∧ complete(B) ∧ ordered(B)

gloss(B) ≜ prose of B beyond its bindings
gloss(B) ≠ ∅ ⇒ ¬complete(B)        ∴ absorb the gloss into a line, never keep it
¬self-sufficient(B) ⇒ ⊥
```

- **Closed** — every symbol resolves: it is in the table (`references/formal-symbolic-notation.md`), defined by an earlier line, or **boundary-bound** — named in prose beside the anchor that homes it ([[signify]]'s move: name the bare symbol, cite the anchor, then use only the symbol inside the fence). Boundary-binding is the integration point, and the *only* prose the block requires.
- **Complete** — every operation, transition, and invariant of the concept is a line. A mechanic that lives only in prose is a hole in the formalism.
- **Ordered** — declarations and signatures above (the hypotheses), comprehensions and laws below; reading top-down, no symbol is used before it is defined.

The test ([[bidirectional-round-trip-fidelity]] · [[self-application-is-mandatory]]): strip every non-binding word. If meaning is lost, the block failed closed/complete/ordered — repair the block. Explanatory prose beside a formal block is therefore either **duplicative** (the block already says it) or a **symptom** (the block fails to) — never a fixture.

## See also

- [[densest-faithful-point]] — the block is the dfp of its concept; this is dfp applied to formal notation.
- [[signify]] — boundary-binding (symbol ⇔ anchor) is signify at the fence boundary.
- [[context-not-prose]] — the same preference one altitude up: dense context over narration.
- [[formalize]] — the skill that converts prose into a self-sufficient block by this convention.
- [[precise-circumscription]] — the block is the densest name's body: it circumscribes exactly.
