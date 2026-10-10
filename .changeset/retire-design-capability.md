---
'@cratylus/runtime': minor
'cratylus': minor
'@cratylus/canon': minor
---

Remove the legacy `design` capability (decision 0022): the concept journal is the only account of the design, so `cratylus design` is gone and the concept journal's `cratylus concepts` is where the design is read and recorded (`cratylus concepts design` for the current design). `cratylus design …` is now refused as an unknown command. The runtime's capability keyspace (`CAPABILITIES`) and canon's `RUNTIME_CAPABILITIES` are `eventTap` and `concepts`; a skill can no longer declare `runtime: { capability: 'design' }`. The `.` barrel of `@cratylus/runtime` no longer exports the `DesignHost`, `ConceptInput`, `ConceptChange` and `Invocation` port types, and what only the `design` capability reached — its reading of the record store across plan branches and worktrees, and its views — is removed.
