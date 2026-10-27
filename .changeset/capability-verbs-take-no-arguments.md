---
'cratylus': minor
'@cratylus/runtime': minor
'@cratylus/forge': minor
---

A capability's verb only reads and takes no arguments, which is all the two remaining capabilities use; the machinery for anything more is removed.

- `@cratylus/runtime`: a verb's `effect` is `reads` alone (the `appends` effect is gone), and a verb's explanation is its `name`, `concept`, `purpose`, `when` and `effect`, with no `parameters` (`ParameterExplanation` and `ParameterSchema` are gone). `./verb-flags` holds only `Verbs` (was `VerbFlags`) and `Verb`, a verb's purpose: `Positional`, `Flags`, `Flag`, `ValueShape`, `valueFlag`, `switchFlag`, `spelled`, `Argv`, `readArgv`, `refused` and `nearest` are gone. Any token after a verb is refused by `verbOf`, in one line naming each token and the verb's `--help`; `--help`, `-h` and `--explain` are read as any token after the verb. A verb's help lists no arguments or flags.
- `@cratylus/forge`: the omp extension's capability tools are all read-only (approval `read`); a tool takes a required `verb` of the capability's verbs, or nothing where the capability explains one verb alone, and a call runs `<bin> <capability> <verb>`.
- `cratylus`: the README says a capability verb takes no arguments.
