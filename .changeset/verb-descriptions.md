---
'@cratylus/runtime': minor
---

Every capability, verb and flag is declared with the words its help will print

`@cratylus/runtime/capability` gains `CAPABILITY_SUMMARIES`, one line for each member of `CAPABILITIES`; a capability cannot be added without one. Each capability's `VERBS` maps a verb to `{ summary, positional, flags }`: a one-line summary, the positional the verb acts on (`<unit>`, `[title]`, or `null` for none), and the flags it takes, each `{ takes: 'value' | 'switch', description }` with a one-line description. Flags shared across verbs (`--author`, `--reason`, `--cause`, `--plan`, a note's or concept's fields) are described once where they are declared. A flag taken without a description, or a verb without a summary or a positional, does not compile.

**Breaking for `@cratylus/runtime/verb-flags`.** `Flags` maps each flag to a `Flag` (`{ takes, description }`) instead of to `'value' | 'switch'`, and `VerbFlags` maps each verb to a `Verb` (`{ summary, positional, flags }`) instead of to its `Flags`. `readArgv`, `refused` and `nearest` take the `Verb` rather than its `Flags`. `Flag`, `Verb`, `valueFlag` and `switchFlag` are new. What they read and refuse is unchanged: every refusal text is byte-identical.
