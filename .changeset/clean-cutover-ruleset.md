---
'@cratylus/canon': minor
'cratylus': minor
---

The `green-field` ruleset is replaced by `clean-cutover`, which holds one rule, `clean-cutover`: make the change the work calls for, migrate every caller with it and remove what it makes obsolete, keeping compatibility with earlier forms only where it is declared a goal. The rule `green-field-declared-constraints` is no longer offered. The business analyst's stance names `clean-cutover` in place of `green-field`, and so do the personas over it.

`cratylus install` over an installation whose recorded choice names `green-field-declared-constraints` or `green-field-clean-cutover` drops them from the choice and names them as no longer offered; on a terminal it asks about `clean-cutover` as a newly offered rule. `--rules clean-cutover` takes it.

`@cratylus/canon` exports `cleanCutover` from its rulesets in place of `greenField`.
