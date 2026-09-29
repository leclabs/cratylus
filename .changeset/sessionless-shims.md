---
"@cratylus/forge": minor
"cratylus": minor
---

Every projected runtime shim is one plain forwarder, and none needs a session

`cratylus project` now emits the same `scripts/<capability>.mjs` for every
capability on every harness: it passes its arguments to `cratylus <capability>`
with the caller's environment and exits with that command's status. A shim no
longer copies a harness's session variable into `$AGENT_SESSION_ID`, and the omp
shim no longer exits `3` asking for `$AGENT_SESSION_ID` or
`$AGENT_SESSION_ID_FROM`.

**Breaking for `@cratylus/forge`.** `HarnessAdapter.sessionEnvVars` is removed,
so an out-of-tree adapter drops the field. `emitRuntimeShim(skillDir, capability)`
takes no session-variable list. `PlaceReport` loses `seeded` and `present`, which
deploy initialized and never wrote.
