---
"@cratylus/runtime": minor
"cratylus": minor
---

A flag that takes no value never takes the next token

Each verb of `design`, `plan`, `note` and `eventTap` now declares, beside the
verb, whether each flag it takes takes a value, and one reader in
`@cratylus/runtime/verb-flags` reads every verb's arguments against that
declaration. A flag that takes a value is given as `--flag value` or
`--flag=value`, and takes the next token unless it begins with `--`. A flag
that takes none, `plan`'s `--repin`, is given alone and never takes the next
token: `plan revise u --plan p --repin -x …` used to read `-x` as `--repin`'s
value and write, and now refuses `-x` and writes nothing. `--repin=x` is refused
rather than having its value dropped.

`@cratylus/runtime/verb-flags` now carries `VerbFlags`, in which each verb maps
each flag it takes to `'value'` or `'switch'`, the per-verb `Flags`, the reader
`readArgv` and the `Argv` it returns, and `refused` and `nearest`, which take a
verb's `Flags`. `refuseUnknown` is gone: the reader refuses.
