# @cratylus/memory

## 0.2.0

### Minor Changes

- bf103d9: Plans live only in the plan records; the plan-folder layout is gone

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

### Patch Changes

- e2db96f: The runtime gains the record store, and the one ULID implementation moves into the runtime

  `@cratylus/runtime` holds records as files in the repository: `records/<domain>/<record id>.json`,
  one file per record, each an envelope (record id, entity, operation, the record ids it supersedes,
  author, time, reason, cause) and a whole-state payload. A write whose file exists refuses, and a
  supersession or retraction refuses to name anything but a current head of its own entity, so one
  branch's history stays linear. The fold computes each entity's heads at the moment of the read and
  persists nothing. A head is a version or a retraction that no later record names. Heads carrying
  the same payload have converged and read as one, and a later write names every one of them. An
  entity whose heads read as one is settled: live on versions, withdrawn on retractions, and a
  supersession naming the retraction reinstates the entity. Heads whose payloads differ are
  divergence, which only a merge produces (two versions, or a version and a retraction). It is
  reported, never resolved by picking one, and a reconciliation writes one version superseding every
  head. Incoherence (a reference to a withdrawn entity, or a
  cycle) is reported over a reference relation the caller supplies. A branch merge is the union of
  files and never conflicts. The store is internal: it is exported through neither the `.` barrel
  nor a subpath.

  `@cratylus/runtime/ulid` is a new subpath carrying `ulid`, `monotonicFactory`, `decodeTime` and
  `isValidUlid`, moved unchanged from `@cratylus/memory`, which now imports it from there. The
  record store mints every record id from it.

  `@cratylus/canon`: the test registry classifies the moved `ulid` test and the new record-store
  test under `runtime`.

- Updated dependencies [b34b1c5]
- Updated dependencies [fcf5db6]
- Updated dependencies [52c73fd]
- Updated dependencies [7b71bc8]
- Updated dependencies [36a0511]
- Updated dependencies [6f18d1c]
- Updated dependencies [c5bc3d9]
- Updated dependencies [bf103d9]
- Updated dependencies [eeab4cc]
- Updated dependencies [e2db96f]
- Updated dependencies [0dcbc9a]
- Updated dependencies [235f77d]
  - @cratylus/runtime@0.3.0

## 0.1.2

### Patch Changes

- Updated dependencies [3e9c103]
  - @cratylus/runtime@0.2.0

## 0.1.1

### Patch Changes

- a019716: Every CLI reports the version its manifest declares.

  `0.1.0` shipped with `cratylus-run --version` and `cratylus --version` answering `0.0.0`: the
  number was a literal in TypeScript, and `changeset version` rewrites manifests rather than
  source, so the two diverged at the first release and would have stayed diverged. Each now
  reads its own manifest by package self-reference, and a gate holds the shape.

- Updated dependencies [a019716]
  - @cratylus/runtime@0.1.1

## 0.1.0

### Minor Changes

- 6b471c4: Initial public release of Cratylus — the latent-lexicography toolchain.

  `0.1.0` rather than `1.0.0` deliberately: under semver, `0.x` signals a surface that may still break,
  and several concepts are still being cut. The names, however, are settled —
  scope, packages, and both bin names went through the full round-trip (forward argmin, blind reverse
  decode, occupancy check) before this release, because a name is free until first publish and never
  after.

  - `cratylus` — the build-time command: author, resolve, project and deploy a corpus.
  - `cratylus-run` — the run-time command a deployed agent's shims invoke for a capability.

### Patch Changes

- Updated dependencies [6b471c4]
  - @cratylus/runtime@0.1.0
