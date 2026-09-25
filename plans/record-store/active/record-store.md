# record-store

**Wave 0.** Realizes `record store`. Covers `record id`, `entity`, `payload`, `fold`, `envelope`,
`record`, `supersession`, `retraction`, `head`, `divergence`, `incoherence`, `reconciliation`
(surfaced in `PLAN.md` § Lattice coverage: no other unit cites them).

## Intent

The internal mechanism of `runtime` that holds records as files in the repository, writes new
ones, folds heads, and detects divergence and incoherence — everything the design's § Primitives
and § The record model say, as one module family:

- a **record id** is a ULID minted without coordination. There is **one** ULID implementation: this
  unit moves `packages/memory/src/ulid.ts` down to `packages/runtime/src/ulid.ts`, exports it as
  `@cratylus/runtime/ulid`, and points every memory importer at it (§ Boundaries). Its test moves
  with it;
- an **entity** has a minted identity that is neither its name nor its place in history; a name,
  where the entity has one, is a label in its payload and can change;
- a **payload** is the entity's whole state as of the record, never a delta;
- an **envelope** carries the record id, the entity, the operation, the record ids it supersedes,
  author, time, reason and cause;
- a **record** is one immutable entry in one entity's history — a version or a retraction — an
  envelope and a whole-state payload, never edited, moved or deleted once written: a write whose
  file exists refuses;
- **writes name only current heads.** A **supersession** is a new version naming one or more of the
  entity's current heads and replacing them; naming a record that is not a head, a record of
  another entity, or an unknown id refuses, so one branch's history stays linear. Superseding a
  retraction reinstates the entity. A **retraction** withdraws the entity with no successor
  version, naming the heads it withdraws, and itself becomes the entity's head;
- a **head** is a record, version or retraction, that no later record names. One head means
  settled — live when it is a version, withdrawn when it is a retraction; more than one is
  **divergence** (two versions, or a version and a retraction, written to one head on different
  branches and merged), reported and never resolved here;
- **incoherence** is a reference to a retracted entity or a cycle, over a reference relation the
  caller supplies (the store knows no domain's payload);
- a **reconciliation** is one new whole-state version superseding every head of the entity, and its
  envelope marks it an amendment, never an acceptance;
- the **fold** computes current state at the moment of the read and persists nothing;
- the **store** lays records out as one directory per domain under one records root, one file per
  record; a branch merge is the union of files and never conflicts; it resolves the repository root
  itself.

The records root's sign is derived with `signify` and declared once here; the gate, the hook, CI and
every later unit take it from this module. Records are machine-written bytes, so the root joins
biome's ignore list: a formatter must never own them.

Mechanism only: `record-store/` imports no workspace package (ARCHITECTURE property 4) and is
exported through neither the `.` barrel nor a subpath. Only `ulid.ts` gains a subpath, because
`memory` must import it.

## Static

- `git show 4610c33f:docs/design/record-store.md` § Primitives, § The record model, § Boundaries
  ("One ULID implementation").
- `packages/memory/src/ulid.ts`, `packages/memory/test/ulid.test.ts`; the importers listed in
  `PLAN.md` § Census.
- `ARCHITECTURE.md` properties 1 and 4; `packages/runtime/README.md` § Subpaths;
  `packages/runtime/{package.json,tsup.config.ts}` (the event-tap subpath is the precedent).
- `packages/canon/test/gate-convicts.test.ts` header — GATE versus BEHAVIORAL, and the convicting
  vocabulary.

## Deps

None.

## Outputs

- `packages/runtime/src/record-store/**` (new) — every file except `immutability-gate.ts`, which
  `immutability-gate` owns
- `packages/runtime/src/ulid.ts` (moved from `packages/memory/src/ulid.ts`)
- `packages/runtime/package.json` (the `./ulid` export), `packages/runtime/tsup.config.ts` (its
  entry), `packages/runtime/README.md` (its § Subpaths row)
- `packages/runtime/test/record-store.test.ts` (new), `packages/runtime/test/ulid.test.ts` (moved
  from `packages/memory/test/ulid.test.ts`)
- `packages/memory/src/{migrate-memory,migrate,record,store}.ts` — import the runtime's ULID
- `packages/memory/test/{dream,liveness-read-drain,migrate-memory,migrate,store}.test.ts` — the same
- `packages/canon/test/gate-convicts.test.ts` — REGISTRY: `memory/ulid.test.ts` out;
  `runtime/ulid.test.ts`, `runtime/record-store.test.ts` in
- `biome.jsonc` — `files.ignore` gains the records root
- `.changeset/record-store.md`

## Accept

1. `pnpm --filter @cratylus/runtime test -- record-store ulid` passes. The record-store tests' names
   cover: a write refuses an existing record id; a supersession naming another entity's version
   refuses; a supersession or retraction naming a record that is no longer a head refuses; a
   retraction becomes the entity's one head and reads settled-withdrawn; superseding that
   retraction reinstates the entity as settled-live; two independently written record sets
   (simulated branches) that each superseded the same head — and, separately, one that
   superseded it and one that retracted it — union with no file-name collision and fold to
   divergence, the fold picking neither; a reconciliation superseding every head (retraction
   included) leaves exactly one head; incoherence reports a reference to a retracted entity and a
   cycle in a supplied relation; a read leaves the records root byte-identical.
2. One ULID: `git ls-files packages/memory/src/ulid.ts packages/memory/test/ulid.test.ts` prints
   nothing, and `git grep -lE "from '(\./|\.\./src/)ulid\.js'" -- packages/memory` prints nothing
   (at `c501e002`: 10 files); `git grep -l "@cratylus/runtime/ulid" -- packages/memory/src` lists
   the four `src` importers; `pnpm --filter @cratylus/memory test` passes.
3. `pnpm --filter @cratylus/runtime typecheck`, `typecheck:test`, and the same for
   `@cratylus/memory`, pass.
4. No dependency added: the `dependencies` block of `packages/runtime/package.json` is unchanged
   since `c501e002`.
5. The store stays internal: `git grep -n "record-store" -- packages/runtime/src/index.ts packages/runtime/package.json packages/runtime/tsup.config.ts packages/canon packages/forge packages/memory`
   prints nothing except the `gate-convicts.test.ts` REGISTRY row.
6. Spells: the return names, for each of the thirteen anchors this unit realizes or covers, the
   identifier realizing it, and `git grep -nw <identifier> -- packages/runtime/src/record-store packages/runtime/src/ulid.ts`
   hits for every one (print `n/13`).
7. Sole: `git grep -l supersed -- packages/runtime/src` lists at least one file and all of them are
   under `packages/runtime/src/record-store/` (at `c501e002` the list is empty); and
   `git grep -ln "ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'" -- packages` lists only
   `packages/runtime/src/ulid.ts`.
8. `pnpm --filter @cratylus/canon test -- gate-convicts` passes.
9. `biome.jsonc` names the records root under `files.ignore`, and the return reports the root's sign
   with its `signify` derivation.
10. `.changeset/record-store.md` names `@cratylus/runtime` and `@cratylus/memory`, and
    `@cratylus/canon` for its registry row.
