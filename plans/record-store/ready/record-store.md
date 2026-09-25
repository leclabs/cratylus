# record-store

**Wave 0.** Realizes `record store`. Covers `record`, `record id`, `entity`, `payload`,
`envelope`, `supersession`, `retraction`, `head`, `divergence`, `incoherence`, `reconciliation`,
`fold` (surfaced in `PLAN.md` § Lattice coverage: no other unit cites them).

## Intent

The internal mechanism of `runtime` that holds records as files in the repository, writes new
ones, folds heads, and detects divergence and incoherence. Everything the design's § Primitives
and § The record model say, as one module family:

- a **record** is one immutable version of one entity — an envelope and a whole-state payload —
  and a write never overwrites: writing a record whose file exists refuses;
- a **record id** is a ULID minted without coordination (`node:crypto`; no new dependency), and
  it names the record's file;
- an **entity** has a minted identity that is neither its name nor its place in history; its
  anchor is a label in the payload and can change;
- a **payload** is the entity's whole state as of the record, never a delta;
- an **envelope** carries the record id, the entity, the operation, the record ids it supersedes,
  author, time, reason and cause;
- a **supersession** names one or more earlier versions of the same entity and refuses a version
  of another entity or an unknown id; a **retraction** withdraws the entity, naming the versions it
  withdraws, with no successor;
- a **head** is a version nothing supersedes or retracts; exactly one head means settled; more
  than one is **divergence**, which is reported and never resolved here;
- **incoherence** is a reference to a retracted entity or a cycle, over a reference relation the
  caller supplies (the store knows no domain's payload);
- a **reconciliation** is one new whole-state version superseding every head of the entity, and
  its envelope marks it an amendment, never an acceptance;
- the **fold** computes current state at the moment of the read and persists nothing;
- the **store** lays records out as one directory per domain under one records root, one file per
  record; a branch merge is the union of files and never conflicts; it resolves the repository
  root itself.

The records root's sign is derived with `signify` and declared once here: the gate, the hook, CI
and every later unit take it from this module. Records are machine-written bytes, so the root is
added to biome's ignore list; a formatter must never own them.

Mechanism only: imports no workspace package (ARCHITECTURE property 4) and is exported through
neither the `.` barrel nor a package subpath — no agent or skill ever names it.

## Static

- `git show 9cc32431:docs/design/record-store.md` § Primitives, § The record model, § Boundaries.
- `ARCHITECTURE.md` properties 1 and 4; `packages/runtime/README.md` ("depends on nothing").
- `packages/memory/src/ulid.ts` — prior art for a monotonic ULID; not importable (memory depends
  on runtime).
- `packages/canon/test/gate-convicts.test.ts` header — GATE versus BEHAVIORAL, and the convicting
  vocabulary.

## Deps

None.

## Outputs

- `packages/runtime/src/record-store/**` (new) — every file except `immutability-gate.ts`, which
  `immutability-gate` owns
- `packages/runtime/test/record-store.test.ts` (new)
- `packages/canon/test/gate-convicts.test.ts` — one REGISTRY row
- `biome.jsonc` — `files.ignore` gains the records root
- `.changeset/record-store.md`

## Accept

1. `pnpm --filter @cratylus/runtime test -- record-store` passes, and its test names cover: a
   write refuses an existing record id; a supersession naming another entity's version refuses; a
   retraction leaves the entity with no head; one head reads settled; two records superseding the
   same version read as divergence and the fold picks neither; a reconciliation leaves exactly one
   head; incoherence reports a reference to a retracted entity and a cycle in a supplied relation;
   two domain directories written independently (simulated branches) union with no file-name
   collision and fold to divergence; a read leaves the records root byte-identical.
2. `pnpm --filter @cratylus/runtime typecheck` and `pnpm --filter @cratylus/runtime typecheck:test`
   pass.
3. `git diff 9cc32431 -- packages/runtime/package.json` is empty.
4. `git grep -n "record-store" -- packages/runtime/src/index.ts packages/runtime/package.json packages/runtime/tsup.config.ts packages/canon packages/forge`
   prints nothing except the `gate-convicts.test.ts` REGISTRY row.
5. Spells: the return names, for each of the thirteen anchors this unit realizes or covers, the
   exported identifier realizing it, and `git grep -nw <identifier> -- packages/runtime/src/record-store`
   hits for every one (print `n/13`).
6. Sole: `git grep -l supersed -- packages/runtime/src` lists at least one file and every listed
   file is under `packages/runtime/src/record-store/` (at `9cc32431` the list is empty).
7. `pnpm --filter @cratylus/canon test -- gate-convicts` passes.
8. `biome.jsonc` names the records root under `files.ignore`, and the return reports the root's
   sign with its `signify` derivation.
9. `.changeset/record-store.md` names every package this unit's paths changed.
