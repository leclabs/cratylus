---
kind: principle
delineation: Lift each one-off workaround to a stable, greppable named marker that doubles as the index-key into a catalog of detection + fix; the canonical wording in-source is the medium that lets a corpus-wide search find every instance and close it once, instead of re-discovering it per site.
---

# Named Marker as Index-Key

When the same workaround, residue, or shape recurs across a corpus, the leverage move is to **lift it to a stable, greppable name** and treat that name as the **index-key into a catalog** — so the next pass, human or agent, _closes_ it instead of re-discovering it.

Mechanically, for systematic residue (stubs, dead branches, polyfills) the move is a four-part catalog row per pattern:

1. **Classify** the residue into named pattern rows.
2. **Standardize a canonical wording** per row (e.g. a fixed TODO phrasing) so the marker is greppable corpus-wide. The in-source marker text _is_ the index-key — it is simultaneously the local annotation and the lookup token.
3. **Pair a detection query with a fix** per row.
4. **Impose a fix order** so each step exposes the next.

This converts an open-ended cleanup into a **closed, countable checklist**. The marker is the medium: it is precisely the standard wording that makes a cross-corpus search possible, which is why ad-hoc per-site annotations don't compose and a canonical one does. The same move powers status-badge joins across file trees and mode-name vocabularies — name the recurring thing once, then index by the name.

## See also

- [[cite-dont-copy]] — the marker is a pointer into one canonical catalog row, not a restatement of the fix.
- [[canonical-superset-ir]] — one shared name per concept; the marker vocabulary is that discipline at the maintenance grain.
