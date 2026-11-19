---
'@cratylus/canon': minor
'cratylus': minor
---

The `green-field` ruleset now holds one rule, `green-field`: existing work constrains only where declared. `clean-cutover` is a new ruleset of one rule, `clean-cutover`: make the change the work calls for and migrate every caller with it, removing what it makes obsolete, keeping compatibility with earlier forms only where it is declared a goal. The rules `green-field-declared-constraints` and `green-field-clean-cutover` are no longer offered.

`cratylus install` over an installation whose recorded choice names `green-field-declared-constraints` or `green-field-clean-cutover` drops them from the choice and names them as no longer offered; on a terminal it asks about `green-field` and `clean-cutover` as newly offered. `--rules green-field,clean-cutover` takes them.

The business analyst's stance names green-field ≜ existing work constrains only where declared, and so do the personas over it.

`@cratylus/canon`'s `RULESETS` lists `green-field` and then `clean-cutover`, last.
