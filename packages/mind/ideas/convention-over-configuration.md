---
kind: principle
delineation: Derive structure from a known convention (directory layout, naming) instead of demanding it be re-declared in a manifest; the registry should hold only what convention cannot imply — adding a file in the right place should just work.
---

# Convention Over Configuration

The manifest carries **only what convention cannot imply** — schema version, active scope, target list, options, overrides — never an inventory of which files exist; that inventory is walked from the convention ([[cite-dont-copy]]).

The convention must be discoverable and documented: an undocumented convention is worse than explicit config. Spend the configuration budget only on the genuinely free choices.

## See also

- [[minimalism]] — the manifest does the one job (declare the non-derivable); it carries no redundant inventory.
- [[cite-dont-copy]] — a registered file list duplicates the filesystem; let the directory be the single source.
