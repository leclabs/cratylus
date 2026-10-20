---
"@cratylus/runtime": patch
"cratylus": patch
---

The concept journal calls a concept's text its correction, as cratylic context design does, and no longer says "residue". The summary and `state` give each live concept as `term ≜ correction`, and a retired version as `term retired`. `leakage` inspects each live concept's correction. The `--wording` of `define` and `supersede` is described as the concept's correction: beside its term, as read in its bounded context, the missing meaning supplied and the spurious meaning excluded, each stated once, never restating what the term already carries. A missing `--wording` is refused with `give the correction with --wording`. Both READMEs say the same. The `--wording` flag and the `wording` field keep their names.
