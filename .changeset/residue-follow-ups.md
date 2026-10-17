---
"@cratylus/canon": minor
"@cratylus/forge": minor
---

A cold read gives the reader the sign with its bounded context's name and subject and nothing of the intended concept (decision 0305). `@cratylus/forge/validate` exports `BoundedContext` (`name`, `subject`), and `DecodeOpts` requires a `context`, which `decodeCold` and `nonceControl` send to the isolation script. canon's `cold-oracle.sh` requires `--context-name` and `--context-subject` and puts both in its mood-neutral prompt, isolation unchanged; canon's `decodeCold` and `nonceControl` take the context from their caller, and `corpusContext` in `tooling/cold-oracle/policy.ts` declares the context the corpus's own cells are read in. The symbol probe gate's obligations and readouts carry their bounded context: `obligationsOf(context, cell, formalBlock)`, `ledgerKey(context, cell, symbol)`, and a readout recorded in another context leaves an obligation `needs-probe`.

A persona states its overrides and extensions of its role, and the canon no longer calls them its residue: the exported type `Residue` is now `Overrides`, `persona(over, overrides)`, and ENGINE.md and the canon README say the same. Persona composition is unchanged.
