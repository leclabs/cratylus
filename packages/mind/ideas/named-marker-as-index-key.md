---
kind: principle
delineation: Lift each one-off workaround to a stable, greppable named marker that doubles as the index-key into a catalog of detection + fix; the canonical wording in-source is the medium that lets a corpus-wide search find every instance and close it once, instead of re-discovering it per site.
---

# Named Marker as Index-Key

For systematic residue (stubs, dead branches, polyfills), the catalog is a four-part row per pattern:

1. **Classify** the residue into named pattern rows.
2. **Standardize a canonical wording** per row (e.g. a fixed TODO phrasing). The in-source marker text _is_ the index-key — simultaneously the local annotation and the lookup token.
3. **Pair a detection query with a fix** per row.
4. **Impose a fix order** so each step exposes the next.

This converts an open-ended cleanup into a **closed, countable checklist**. Ad-hoc per-site annotations don't compose and a canonical wording does — the standard wording is precisely what makes the cross-corpus search possible. The same move powers status-badge joins across file trees and mode-name vocabularies.

## See also

- [[cite-dont-copy]] — the marker is a pointer into one canonical catalog row, not a restatement of the fix.
- [[canonical-superset-ir]] — one shared name per concept; the marker vocabulary is that discipline at the maintenance grain.
