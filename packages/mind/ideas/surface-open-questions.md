---
kind: principle
delineation: Name the genuine unknowns in the design document where they get weighed, not as buried TODOs in code; explicit open questions are design hygiene, and candor about what is still undecided is a feature of the artifact, not a flaw.
---

# Surface Open Questions

The genuine unknowns of a design — the decisions deferred to iteration, the trade-offs not yet resolved — belong **named in the design document**, in one place where they can be weighed, not scattered as `// TODO` comments buried in code where no reviewer sees the shape of what is undecided.

Explicit open questions are **design hygiene**, not an admission of weakness:

- A reader can see the full surface of what is still in play and contribute to it.
- The unknowns don't masquerade as settled by their absence — silence reads as "decided," which is a lie when it isn't.
- Candor about "what we still don't know" is a property of a mature artifact; hiding it just relocates the uncertainty to where it does the most damage.

This is the design-doc twin of keeping the live state honest ([[doc-mirrors-runtime-truth]]): there the truth is runtime state, here it is the set of undecided questions — in both, the written artifact must reflect reality rather than a tidier fiction.

## See also

- [[doc-mirrors-runtime-truth]] — the same honesty discipline at the state-tracking grain.
- [[definitions-over-defaults]] — what _is_ decided becomes a binding convention; what isn't is named as open, not faked as settled.
