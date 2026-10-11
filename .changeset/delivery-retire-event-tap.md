---
'@cratylus/runtime': minor
'@cratylus/canon': minor
'@cratylus/forge': minor
'cratylus': minor
---

Retire the event tap from what cratylus delivers (decision 0108). `cratylus eventTap` is gone and is refused as an unknown command; the runtime's capability keyspace (`CAPABILITIES`) and canon's `RUNTIME_CAPABILITIES` are `concepts` and `workPackage`, and both explain themselves. `@cratylus/runtime` no longer exports the `./events`, `./ports/event-tap` and `./capabilities/event-tap` subpaths, nor `EventName` and the `EventTapHost` port from its `.` barrel. The host runtime config reader carries only each capability's configuration: the lifecycle vocabulary (`events`) and the per-harness native names (`harnesses`), with `nativeEventsOf` and `nativeActsOf`, served only the tap and are removed. Canon no longer ships the `event-tap` skill or installs it as plumbing, so no projection carries its skill or `scripts/eventTap.mjs` shim, and forge's projection no longer warns about the tap on a harness without a tap strategy.
