---
kind: principle
delineation: Name the genuine unknowns in the design document where they get weighed, not as buried TODOs in code; explicit open questions are design hygiene, and candor about what is still undecided is a feature of the artifact, not a flaw.
---

# Surface Open Questions

Why it is hygiene rather than weakness:

- A reader sees the full surface of what is still in play and can contribute to it.
- Silence reads as "decided" — a lie when the question isn't.
- Hiding the uncertainty just relocates it to where it does the most damage.

The design-doc twin of [[doc-mirrors-runtime-truth]]: there the tracked truth is runtime state, here it is the set of undecided questions.

## See also

- [[doc-mirrors-runtime-truth]] — the same honesty discipline at the state-tracking grain.
- [[definitions-over-defaults]] — what _is_ decided becomes a binding convention; what isn't is named as open, not faked as settled.
