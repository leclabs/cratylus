# domain-interface

**Wave 2.** Realizes `domain interface`. **Ruling owed: R1** (PLAN.md) — what "the whole bound
plan" `plan show` presents, and how a plan is bound, depends on it.

## Intent

One runtime capability per domain, named for it, in its own verbs — the only way agents and users
meet notes, design and plans:

- `design` — show the whole design or one concept; define, amend, retract, reconcile, trace a
  concept. `amend` on a diverged concept refuses and points to `reconcile`. `trace` presents what
  the design skill's `closure` and `blast` name for the concept, its version history with reasons,
  and how the plans stand on it.
- `plan` — show the whole bound plan (per R1) or one unit; add, revise, advance units. `add`
  resolves `realizes` by anchor and takes the pin automatically; `revise` re-pins.
- `note` — show the whole notebook or one note; capture, retract.

Each capability composes the record store, its domain module, `pin` where it applies, and `view`
(PLAN.md § Contract): it maps each domain's fold onto the view's input shapes, wires
`design-domain`'s closure into `pin`'s port, and feeds concept liveness to the plan domain's
incoherence relation. Agents never see record ids, envelopes, heads or files: every input names
entities by anchor, the capability resolves them, and every output is a view. The envelope's
author, time, reason and cause come from the invocation. A refusal exits 1 with a message that
names the verb that would succeed.

Registration follows the runtime's existing convention for capabilities that ship inside it (the
`eventTap` precedent): a port module per capability (the keyspace gate's biconditional), keyspace
and `CapabilityPort` members, `RuntimePlugin` fields, a route in `main.ts` ahead of the discovered
dispatch, the `.` barrel's port exports, the README's rows — and canon's `RUNTIME_CAPABILITIES`
gains the three, which `capability-keyspace.test.ts` holds equal to the runtime keyspace. The CLI
routes by `CAPABILITIES` and needs no edit.

Permanent tests land here, at the verb surface, because this is where the behaviour becomes
consumer-visible: one test file per capability, covering what the W1 modules only smoke-proved.

## Static

- `git show 9cc32431:docs/design/record-store.md` § How they are met, § Intent ("Agents and users
  meet only the three domains, never the records").
- `packages/runtime/src/{main,loader,plugin,index}.ts`, `packages/runtime/src/ports/event-tap.ts`,
  `packages/runtime/src/capabilities/event-tap/` — the shape a shipped-inside capability takes.
- `packages/canon/test/capability-keyspace.test.ts` — the three axes and the equality leg.
- The landed W1 modules and their returns' reported signs.

## Deps

`design-domain`, `notebook`, `plan-domain`, `pin`, `view`

## Outputs

- `packages/runtime/src/ports/{design,plan,note}.ts` (new)
- `packages/runtime/src/capabilities/{design,plan,note}/**` — new `index.ts` and `dispatch.ts`
  in each; the W1 domain and pin modules in these directories only where composition exposes a
  defect or ruling R1 revises plan membership
- `packages/runtime/src/view/**`, `packages/runtime/src/record-store/**` — repairs composition
  exposes, if any (this wave has no other unit)
- `packages/runtime/src/{loader,plugin,main,index}.ts`
- `packages/runtime/README.md`
- `packages/runtime/package.json`, `packages/runtime/tsup.config.ts` — only if a subpath export is
  added
- `packages/runtime/test/{design,plan,note}.test.ts` (new)
- `packages/canon/src/manifest.ts` — `RUNTIME_CAPABILITIES`
- `packages/canon/test/capability-keyspace.test.ts`
- `packages/canon/test/gate-convicts.test.ts` — three REGISTRY rows
- `packages/cli/README.md` — the capability-verb examples
- `.changeset/domain-interface.md`

## Accept

1. `pnpm --filter @cratylus/runtime test -- design plan note` passes. The tests run the verb
   surface in a temporary git repository and cover: `design` define → show (root-to-primitive
   order) → amend → show one concept in full; two branches amending one concept, merged →
   `design show` lists the divergence before the body, `design amend` exits 1 naming `reconcile`,
   `design reconcile` settles it; a retraction a factor points at → incoherence listed; `plan add`
   pins, `plan show` prints wave order with the frontier marked, `design amend` of the realized
   concept → the unit shows drifted, of a concept in its closure → suspect; `plan advance` moves a
   unit and refuses an illegal move; `note capture` of each kind, `note show` grouped by kind and
   topic, `note retract`; every `show` output is asserted free of `[0-9A-HJKMNP-TV-Z]{26}` and of
   the records root's path.
2. `pnpm --filter @cratylus/canon test -- capability-keyspace gate-convicts` passes.
3. `git grep -nE "'(design|plan|note)'" -- packages/runtime/src/loader.ts packages/canon/src/manifest.ts`
   hits each of the three in both files (at `9cc32431`: none).
4. `pnpm build`, then `pnpm exec cratylus design show` in a fresh `git init` directory exits 0 and
   its first line names that repository's `HEAD` commit with counts of zero.
5. `plan show` presents the bound plan as ruling R1 defines it.
6. Sole: `main.ts` routes each of `design`, `plan`, `note` exactly once
   (`git grep -cE "first === '(design|plan|note)'" -- packages/runtime/src/main.ts` → 3), and no
   module under `packages/runtime/src/capabilities/` writes a file except through
   `record-store/` (`git grep -nE "writeFileSync|appendFileSync|renameSync|rmSync" -- 'packages/runtime/src/capabilities/design' 'packages/runtime/src/capabilities/plan' 'packages/runtime/src/capabilities/note'`
   prints nothing).
7. `pnpm verify` passes.
8. `.changeset/domain-interface.md` names `@cratylus/runtime` and `@cratylus/canon`.
