---
kind: skill
delineation: use this skill to convert prose — especially of a process or skill — into a self-sufficient set-builder block under self-sufficient-formalism: conceptualize the prose to its entities/operations/laws, signify each as a symbol (minting or boundary-binding to an anchor), and emit declarations-above / laws-below with no explanatory prose; accept only on round-trip equivalent-or-better.
trigger: /formalize
---

# Formalize Skill

Render prose into its **signum aptissimum** — a self-sufficient formal block. The inverse of reading a block: where prose narrates, `formalize` defines. Especially apt for a process or skill, whose operations and invariants are exactly what a set-builder block states best.

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
    ordered(B) ∧ closed(B)                    no forward reference ∧ no free symbol

accept(B) ⇔ self-sufficient(B) ∧ reconstruct(B) ≽ P
¬accept(B) ⇒ ⊥
```

## Steps

1. **Conceptualize** — read `P` and resolve its entities `E`, operations `O`, and invariants `L`; substrate (formatting, narration) is not meaning.
2. **Signify** — assign each a symbol `η(x)`; for an imported entity, bind the symbol to its anchor in one line of prose (name the symbol, cite the `[[ ]]`, never restate it — [[cite-dont-copy]]). The bindings are the block's only prose.
3. **Emit** — declarations and signatures above, comprehensions and laws below, ordered so nothing is used before it is defined.
4. **Accept** — strip every non-binding word; if `reconstruct(B) ≽ P` the block is faithful ([[bidirectional-round-trip-fidelity]]); else repair the block, never restore the prose.

## See also

- [[densest-faithful-point]] — the block is the dfp of `P`.
