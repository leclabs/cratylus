---
'@cratylus/runtime': minor
'cratylus': minor
---

Warn of implementation leakage in the concept journal: `cratylus concepts leakage [--context <name>]` reports, as `{ "warnings": [...] }`, each live concept's wording, decision not superseded and numbered example in `design/examples` that names code, files, commands, flags, identifiers, tools or libraries instead of what must hold. Each warning names its passage (a concept by context and name, a decision by context and id, an example by file and number), the narrowest words that leak and the rule they break. `define`, `supersede` and `decide` record exactly as before and, when what they recorded leaks, their printed entry also carries its `warnings`; the journal stores none, and nothing is refused for leakage. Detection is lexical, and a context's own concept names are never leakage. The runtime's `.` export now also carries `JOURNAL`, the concept journal's explanation.
