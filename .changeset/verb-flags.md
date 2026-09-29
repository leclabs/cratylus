---
"@cratylus/runtime": minor
"cratylus": minor
---

An unknown flag on `design`, `plan` or `note` is refused, and nothing is written

Each verb of the three domain capabilities declares, beside the verb, the flags
it takes. A flag the verb does not take used to be dropped without a word, and a
single-dash token such as `-x` was read as a name; each is now refused before
the verb acts, so nothing is written, and the call exits `1`. One refusal names
every such flag as given, the verb's nearest flag to each when one is close
(`--glose` and `-gloss` suggest `--gloss`), and every flag the verb takes, and
asks for the call to be corrected and run again. `--name`, `--state` and
`--repin` on `plan add`, and `--state` on `plan revise`, are refused the same
way, as flags those verbs do not take.

The refusal has one home, the new subpath `@cratylus/runtime/verb-flags`, which
every capability's verbs read their arguments through.
