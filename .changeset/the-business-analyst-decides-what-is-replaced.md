---
'@cratylus/canon': minor
'@cratylus/runtime': minor
'cratylus': minor
---

A user story names the concepts it replaces, the business analyst's decision: the tech lead's user story and the software engineer's task carry an optional `replaces`, each concept as `<context>/<concept>`, none of a replaced concept's meaning carried over, so its realization is deleted whole, its code, every test of it and their fixtures, and built anew from its examples; every other concept the story touches has its realization changed in place. The tech lead's task with no story carries none. The tech lead's memory is the domain model alone.

`cratylus model check` fails for an example more than one acceptance test names, one failure naming the example and, as `tests`, every test naming it (`<path>:<line>`): an example binds exactly one acceptance test, which records its realization.
