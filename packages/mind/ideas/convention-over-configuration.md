---
kind: principle
delineation: Derive structure from a known convention (directory layout, naming) instead of demanding it be re-declared in a manifest; the registry should hold only what convention cannot imply — adding a file in the right place should just work.
---

# Convention Over Configuration

Prefer **convention** — a known directory layout, a naming pattern — over **explicit configuration** that re-states what the convention already implies. If dropping `rules/foo.md` into the right directory makes the resource exist, the system should discover it by **walking the convention**, with no manifest-registration step to keep in sync.

The manifest (or config) then carries **only what convention cannot imply**: schema version, active scope, target list, options, overrides — never an inventory of which files exist. That inventory is derivable; restating it is duplication that drifts ([[cite-dont-copy]]).

This is deliberate friction removal: every required declaration is a place the user can forget, mistype, or let go stale. The cost is that the convention must be discoverable and documented — an undocumented convention is worse than explicit config. Spend the configuration budget only on the genuinely free choices.

## See also

- [[minimalism]] — the manifest does the one job (declare the non-derivable); it carries no redundant inventory.
- [[cite-dont-copy]] — a registered file list duplicates the filesystem; let the directory be the single source.
