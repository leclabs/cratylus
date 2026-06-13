---
kind: concept
delineation: The library ships as a versioned, adoptable commons — one canonical home upstream; a consuming scope pins a version and holds references + scope deltas, not copies; drift reconciled via recorded source-version + three-way merge.
---

# Commons Distribution

The `ideas/` library ships as a **shared commons** that many scopes adopt ([[adopt-the-commons]]) — the substrate for standing up species ([[archetype-instantiation]]). How distributed copies and the one canonical home coexist:

- **One home, many references.** Each exemplar has exactly one canonical home upstream ([[cite-dont-copy]]). A consuming scope **pins a version and references**, holding only its scope deltas ([[scope-grant]]) — it does not fork the cell.
- **Drift is reconciled, not lost** — [[generated-artifact-provenance]] records the ancestor; [[regenerate-without-clobbering]] runs the merge.
- **Adopt, don't re-derive.** A scope leans on the commons for solved exemplars and writes only its genuine delta ([[adopt-the-commons]] · [[minimalism]]).

This resolves the one-home-vs-many-copies tension: downstream pins and references; only the upstream cell is authoritative; reconciliation is mechanical via recorded provenance.

## See also

- [[adopt-the-commons]] — the stance: for a solved domain the established commons is the answer.
- [[regenerate-without-clobbering]] · [[generated-artifact-provenance]] — the drift-safe sync machinery.
- [[archetype-instantiation]] — what a consuming scope does with the adopted commons.
