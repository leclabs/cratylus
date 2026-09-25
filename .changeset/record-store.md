---
"@cratylus/runtime": minor
"@cratylus/memory": patch
"@cratylus/canon": patch
---

The runtime gains the record store, and the one ULID implementation moves into the runtime

`@cratylus/runtime` holds records as files in the repository: `records/<domain>/<record id>.json`,
one file per record, each an envelope (record id, entity, operation, the record ids it supersedes,
author, time, reason, cause) and a whole-state payload. A write whose file exists refuses, and a
supersession or retraction refuses to name anything but a current head of its own entity, so one
branch's history stays linear. The fold computes each entity's heads at the moment of the read and
persists nothing. A head is a version or a retraction that no later record names. One head is
settled: live on a version, withdrawn on a retraction, and a supersession naming that retraction
reinstates the entity. More than one head is divergence, which only a merge produces (two versions,
or a version and a retraction). It is reported, never resolved by picking one, and a reconciliation
writes one version superseding every head. Incoherence (a reference to a withdrawn entity, or a
cycle) is reported over a reference relation the caller supplies. A branch merge is the union of
files and never conflicts. The store is internal: it is exported through neither the `.` barrel
nor a subpath.

`@cratylus/runtime/ulid` is a new subpath carrying `ulid`, `monotonicFactory`, `decodeTime` and
`isValidUlid`, moved unchanged from `@cratylus/memory`, which now imports it from there. The
record store mints every record id from it.

`@cratylus/canon`: the test registry classifies the moved `ulid` test and the new record-store
test under `runtime`.
