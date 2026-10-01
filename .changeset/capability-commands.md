---
'@cratylus/runtime': minor
---

Every capability and every verb answers `--help`, and a missing or unknown verb says what to do

`cratylus <capability> --help` lists every verb the capability has, each with its summary. `cratylus <capability> <verb> --help` (or `-h`) documents the verb's positional and every flag it takes, each with its description and whether it takes a value. `cratylus <capability>` with no verb prints that help on stderr and exits 1; an unknown verb is one stderr line naming it, the verbs the capability has and `cratylus <capability> --help`, and exits 1. Help is never wrapped and holds no blank spacer line.

The command surface is built on Commander in place of `cac`, one command per capability and one subcommand per verb, all of it rendered from the declarations put beside each verb: nothing is retyped. Commander does not parse a verb's flags. The tokens after the verb reach that verb's dispatcher exactly as given, so `readArgv` stays their one reader and every `verb flags` refusal is byte-identical. `--help` and `-h` ask for help only as a token of their own, never as the value of a flag that takes one: `note capture t --body -h` keeps `-h` as the body.

`cac` is no longer a dependency of `@cratylus/runtime`; `commander` is.
