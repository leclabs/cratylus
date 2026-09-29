---
"@cratylus/runtime": minor
"cratylus": minor
---

An unknown flag on `design`, `plan` or `note` is refused, and nothing is written

Each verb of the three domain capabilities declares, beside the verb, the flags
it takes. A flag the verb does not take used to be dropped without a word; it is
now refused before the verb acts, so nothing is written, and the call exits `1`.
The refusal names the flag, the verb's nearest flag when one is close (`--glose`
suggests `--gloss`), and every flag the verb takes, and asks for the call to be
corrected and run again. `--name`, `--state` and `--repin` on `plan add`, and
`--state` on `plan revise`, are refused the same way, as flags those verbs do
not take.

`@cratylus/runtime/verb-flags` is the one home of that refusal: `VerbFlags`,
the shape in which a capability declares its verbs' flags, and `refuseUnknown`,
`refused` and `nearest`.
