---
kind: principle
delineation: A formal block is the signum aptissimum of its concept — closed (every symbol declared, defined-above, corpus-bound `β`, or input-resolved `ι`), complete (every operation and law a line), ordered (definitions before use); prose reduces to those bindings — `β` the single home for each external anchor (cited once, the cell's composition) and `ι` the input interface — so explanatory or duplicated prose is a defect.
---

# Self-Sufficient Formalism

A formal block (set-builder, signature, law) is the **signum aptissimum** of the concept it states ([[precise-circumscription]] · [[densest-faithful-point]]): the densest sign that carries the _whole_ meaning. If prose is still required to explain what the comprehension means, the block is **incomplete** — repair the block, never prop it with prose.

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

- **Closed** — every symbol resolves through one of four sources: the table (`references/formal-symbolic-notation.md`), an earlier defining line, a **`β` corpus-binding** (its anchor named in adjacent prose — [[signify]]'s move), or an **`ι` input** (its value resolved from the invocation context).
- **Complete** — every operation, transition, and invariant of the concept is a line. A mechanic that lives only in prose is a hole in the formalism.
- **Ordered** — declarations and signatures above (the hypotheses), comprehensions and laws below; reading top-down, no symbol is used before it is defined.
- **One citation, at the binding** — the boundary-bindings are the **single home** for every external reference a formal cell makes. An anchor is cited once, beside the symbol it homes, and the cell's cell-grain composition (the provenance a projector emits — the "built from" line) is **derived** from those bindings, never written again. Re-citing a bound anchor — in an intro, a gloss, a see-also re-list, or a separate composition formula — is the duplication this forbids ([[cite-dont-copy]] at the citation grain). Scope: the test is the **claim, not the concept's identity**. A further mention of an already-bound anchor is a forbidden re-citation only when the binding's claim **already entails it** — a restatement that merely re-homes the anchor (a see-also, a provenance re-list, a duplicate composition line). A separate register — an intent surface, a rationale, a comparison — that asserts a claim **the binding does not establish** (even about the same, already-bound concept) is new content, not a re-citation.

The test ([[bidirectional-round-trip-fidelity]] · [[self-application-is-mandatory]]): strip every non-binding word. If meaning is lost, the block failed closed/complete/ordered — repair the block. Explanatory prose beside a formal block is therefore either **duplicative** (the block already says it) or a **symptom** (the block fails to) — never a fixture.

## See also

- [[formalize]] — the skill that converts prose into a self-sufficient block by this convention.
- [[context-not-prose]] — the same preference one altitude up: dense context over narration.
