# domain-interface

**Wave 2.** Realizes `domain interface`. Factors at `4610c33f`: `view`, `notebook`, `design`,
`plan`, `unit`.

## Intent

One runtime capability per domain, named for it, in its own verbs — the only way agents and users
meet notes, design and plans:

- `design` — show the whole design or one concept; define, amend, retract, reconcile, trace a
  concept. `amend` on a diverged concept refuses and points to `reconcile`. `trace` presents what
  the design skill's `closure` and `blast` name for the concept, its version history with reasons,
  and how the plans stand on it.
- `plan` — show the whole bound plan or one unit; add, revise, advance units; bind and close a
  plan. No verb authors a plan (`PLAN.md` N6): the first `add` naming a plan that does not exist
  proposes it, together with the design it realizes (N1). `add` resolves `realizes` by anchor and
  takes the pin automatically; `revise` re-pins. With more than one bound plan in the fold (N2),
  `show` reports it before anything else and `bind` refuses.
- `note` — show the whole notebook or one note; capture, retract. A note is addressed by its topic,
  and by kind within a topic; a reference matching several live notes refuses and lists them (N3).
  What a note blocks is named by plan or unit name and resolved here.

Each capability composes the record store, its domain modules, `pin`, and `view` (`PLAN.md`
§ Contract): it maps each fold onto the view's input shapes, wires `design-domain`'s closure into
`pin`'s port, feeds `unit` its plan's liveness, its concepts' liveness and the owed rulings
`notebook` recognises, and feeds `plan-domain` and `unit` their lifecycle vocabularies from the
runtime config (`lifecycle-configuration`). A capability whose configuration is absent refuses and
names the deploy that would supply it; it never falls back to states of its own. Agents never see
record ids, envelopes, heads or files: every input names entities by anchor or name, the capability
resolves them, and every output is a view. The envelope's author, time, reason and cause come from
the invocation. A refusal exits 1 with a message naming the verb that would succeed.

Registration follows the runtime's convention for capabilities that ship inside it (the `eventTap`
precedent): a port module per capability (the keyspace gate's biconditional), keyspace and
`CapabilityPort` members, `RuntimePlugin` fields, a route in `main.ts` ahead of the discovered
dispatch, the `.` barrel's port exports, the README's rows — and canon's `RUNTIME_CAPABILITIES`
gains the three, held equal to the runtime keyspace by `capability-keyspace.test.ts`. The CLI routes
by `CAPABILITIES` and needs no edit.

Permanent tests land here, at the verb surface, where the behaviour becomes consumer-visible: one
file per capability, covering what the W1 modules only smoke-proved. They supply the lifecycle
configuration through `$AGENT_RUNTIME_CONFIG` pointing at a temporary file whose state names are
invented, so no test spells the `plan` skill's vocabulary.

## Static

- `git show 4610c33f:docs/design/record-store.md` § How they are met, § Intent ("Agents and users
  meet only the three domains, never the records"), § Boundaries.
- `packages/runtime/src/{main,loader,plugin,index}.ts`, `packages/runtime/src/ports/event-tap.ts`,
  `packages/runtime/src/capabilities/event-tap/` — the shape of a capability shipped inside the
  runtime, and how it reads `loadRuntimeConfig`.
- `packages/canon/test/capability-keyspace.test.ts` — the three axes and the equality leg.
- The landed W1 modules and their returns' reported signs.

## Deps

`design-domain`, `notebook`, `plan-domain`, `unit`, `pin`, `view`, `lifecycle-configuration`

## Outputs

- `packages/runtime/src/ports/{design,plan,note}.ts` (new)
- `packages/runtime/src/capabilities/{design,plan,note}/**` — new `index.ts` and `dispatch.ts` in
  each; the W1 modules in these directories only where composition exposes a defect
- `packages/runtime/src/view/**`, `packages/runtime/src/record-store/**`,
  `packages/runtime/src/runtime-config.ts` — repairs composition exposes, if any (this wave has no
  other unit)
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

1. `pnpm --filter @cratylus/runtime test -- design plan note` passes. The tests drive the verb
   surface in a temporary git repository and cover: `design` define → show (root to primitive) →
   amend → show one concept in full; two branches amending one concept, merged → `design show`
   lists the divergence before the body, `design amend` exits 1 naming `reconcile`,
   `design reconcile` settles it; a retraction a factor points at → incoherence listed; the first
   `plan add` naming a new plan proposes it → bind → a second plan's bind refuses → close keeps the
   first readable; two branches binding different plans, merged → reported, and bind refuses;
   `plan add` pins, and `plan show` prints the bound plan in wave order with the frontier marked;
   amending the realized concept → the unit shows drifted, amending a concept in its closure →
   suspect; `note capture` of a note blocking a unit → that unit leaves the frontier until
   `note retract`; `plan advance` refuses a skipped step; `note show` groups by kind, then topic;
   an ambiguous note reference refuses and lists candidates; every capability needing lifecycle
   configuration refuses when it is absent; every `show` output is asserted free of
   `[0-9A-HJKMNP-TV-Z]{26}` and of the records root's path.
2. `pnpm --filter @cratylus/canon test -- capability-keyspace gate-convicts` passes.
3. `git grep -nE "'(design|plan|note)'" -- packages/runtime/src/loader.ts packages/canon/src/manifest.ts`
   hits each of the three in both files (at `c501e002`: none).
4. `pnpm build`, then `pnpm exec cratylus design show` in a fresh `git init` directory exits 0 and
   its first line names that repository's `HEAD` commit, with counts of zero.
5. The runtime spells no lifecycle state or note kind:
   `git grep -nE "'(proposed|bound|closed|pending|ready|active|completed|idea|question|decision)'" -- packages/runtime/src/capabilities/design packages/runtime/src/capabilities/plan packages/runtime/src/capabilities/note packages/runtime/src/ports/design.ts packages/runtime/src/ports/plan.ts packages/runtime/src/ports/note.ts packages/runtime/src/view`
   prints nothing.
6. Sole: `main.ts` routes each of `design`, `plan`, `note` exactly once
   (`git grep -cE "first === '(design|plan|note)'" -- packages/runtime/src/main.ts` → 3), and no
   module under the three capability directories writes a file except through `record-store/`
   (`git grep -nE "writeFileSync|appendFileSync|renameSync|rmSync" -- packages/runtime/src/capabilities/design packages/runtime/src/capabilities/plan packages/runtime/src/capabilities/note`
   prints nothing).
7. `pnpm verify` passes.
8. `.changeset/domain-interface.md` names `@cratylus/runtime` and `@cratylus/canon`.
