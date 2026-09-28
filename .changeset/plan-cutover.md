---
"@cratylus/canon": minor
"@cratylus/runtime": minor
"@cratylus/memory": minor
"@cratylus/forge": patch
"cratylus": patch
---

Plans live only in the plan records; the plan-folder layout is gone

The state folders, the plan markers and the tooling that read them are
deleted: canon's `plan-states.ts` (`PLAN_STATES`, `PLAN_FRONTIER`,
`PLAN_MARKERS`), `tooling/plan-set.ts` and its CLI and shell mechanism, and the
`plan-set` and `plan` scripts. Plan state has one home, the `plan` capability.

**Breaking.** The runtime `carryOn` capability is removed: its verb surface,
the `CarryOnHost` port, the `carryOn` member of `CAPABILITIES` and canon's
`RUNTIME_CAPABILITIES`, the `RuntimePlugin.carryOn` field and the `carryOn`
route. The `carry-on` skill is unchanged; it declares no capability.

**Breaking.** Memory no longer treats plans specially. `PLAN.md` is not a
boundary marker, so a directory holding one resolves like any other, and the
audit's `plan-path` marker class is gone.

`command-veracity` no longer carries the plan-path and designator laws, whose
subject was the layout. It exempts the records root and changelogs as history.
The owed-signification marker gate's sanctioned home for recorded debt is now
the notebook's records.
