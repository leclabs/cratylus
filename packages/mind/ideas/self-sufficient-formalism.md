---
kind: principle
delineation: A formal block is the signum aptissimum of its concept — closed (every symbol declared, defined-above, corpus-bound `β`, or input-resolved `ι`), complete (every operation and law a line), ordered (definitions before use); prose reduces to those bindings — `β` the single home for each external anchor (cited once, the cell's composition) and `ι` the input interface — so explanatory or duplicated prose is a defect.
---

# Self-Sufficient Formalism

If prose is still required to explain what a block's comprehension means, the block is **incomplete** — repair the block, never prop it with prose ([[precise-circumscription]] · [[densest-faithful-point]]).

```text
B ≜ a formal block : its definition and law lines
S ≜ symbols(B)
T ≜ the declared notation table
D ≜ { s | a line of B defines s }
β ≜ { s | its corpus anchor named in adjacent prose }
ι ≜ { s | its value resolved from the invocation context }

closed(B)   ⇔ S ⊆ T ∪ D ∪ β ∪ ι
complete(B) ⇔ ∀ b ∈ behavior(concept) : ∃ line ∈ B : line ⊨ b
ordered(B)  ⇔ ∀ s ∈ D : definition(s) precedes use(s)

self-sufficient(B) ⇔ closed(B) ∧ complete(B) ∧ ordered(B)

gloss(B) ≜ prose of B beyond β ∪ ι
gloss(B) ≠ ∅ ⇒ ¬complete(B)
¬self-sufficient(B) ⇒ ⊥

home(a)       ≜ the one boundary-binding of anchor a
composition   ≜ { a | a ∈ β }
cites(a)      ≜ { c | c is a site naming anchor a }
claim(c)      ≜ the proposition asserted at site c
recite(c,a)   ⇔ c ∈ cites(a)  ∧  c ≠ home(a)
distinct(c,a) ⇔ ¬( claim(home(a)) ⊨ claim(c) )
recite(c,a) ∧ ¬distinct(c,a) ⇒ ⊥
```

- **Closed** — `T` is `references/formal-symbolic-notation.md`; `β` names the anchor in adjacent prose ([[signify]]'s move); `ι` resolves from the invocation context.
- **One citation, at the binding** — the boundary-bindings are the single home for each external reference, and the cell's composition (a projector's "built from" line) is **derived** from them, never written again ([[cite-dont-copy]] at the citation grain). Scope: the test is the **claim, not the concept's identity** — a further mention re-cites only when the binding's claim already entails it; a separate register (intent, rationale, comparison) asserting a claim the binding does not establish is new content.

The test ([[bidirectional-round-trip-fidelity]] · [[self-application-is-mandatory]]): strip every non-binding word; if meaning is lost, the block failed closed/complete/ordered — repair it. Prose beside a block is therefore **duplicative** or a **symptom**, never a fixture.

## See also

- [[formalize]] — the skill that converts prose into a self-sufficient block by this convention.
- [[context-not-prose]] — the same preference one altitude up: dense context over narration.
