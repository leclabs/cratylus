---
kind: skill
delineation: use this skill to convert prose — especially of a process or skill — into a self-sufficient set-builder block under self-sufficient-formalism: conceptualize the prose to its entities/operations/laws, signify each as a symbol (minting or boundary-binding to an anchor), and emit declarations-above / laws-below with no explanatory prose; accept only on round-trip equivalent-or-better.
trigger: /formalize
---

# Formalize Skill

Render prose into its **signum aptissimum** — a self-sufficient formal block; its accept gate is the [[canonical-semantic-factorization]] round-trip.

Bindings: the operation invokes [[conceptualize]] → [[signify]] and binds [[self-sufficient-formalism]]. The symbol table is `references/formal-symbolic-notation.md`.

Resolve from context: `P` — the source prose (a section, a process, a skill body).

```text
P ≜ the source prose
E ≜ entities(P) ; O ≜ operations(P) ; L ≜ laws(P)

η : E ∪ O ⇀ symbols              signify : mint a symbol, or bind an imported one to its anchor
β ≜ { η(x) | x is imported }     boundary-bound : its anchor named in adjacent prose

B ≜ formalize(P) such that :
    ∀ e ∈ E      : signature(η(e)) ∈ B        declarations above
    ∀ o ∈ O ∪ L  : law(η(o)) ∈ B              comprehensions and laws below
    self-sufficient(B)                        closed ∧ complete ∧ ordered

reconstruct(B) ≽ P                            input-typed ≽ terminus ; accept gate
```
