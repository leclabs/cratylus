---
kind: concept
delineation: The library ships as a versioned, adoptable commons — one canonical home upstream; a consuming scope pins a version and holds references + scope deltas, not copies; drift reconciled via recorded source-version + three-way merge.
---

# Commons Distribution

The `ideas/` library is the shared commons ([[adopt-the-commons]]) — substrate for standing up species ([[archetype-instantiation]]). The composition:

- **One home, many references.** One canonical home upstream ([[cite-dont-copy]]); a consuming scope pins a version + references and holds only its [[scope-grant]] deltas — it does not fork the cell.
- **Drift sync.** [[generated-artifact-provenance]] records the ancestor; [[regenerate-without-clobbering]] runs the merge.
- **Adopt, don't re-derive** ([[adopt-the-commons]] · [[minimalism]]).

## See also

- [[adopt-the-commons]] — the stance: for a solved domain the established commons is the answer.
- [[regenerate-without-clobbering]] · [[generated-artifact-provenance]] — the drift-safe sync machinery.
- [[archetype-instantiation]] — what a consuming scope does with the adopted commons.
