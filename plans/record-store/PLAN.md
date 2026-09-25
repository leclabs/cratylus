# record-store

> Notes, design and plans become computed state: immutable records in the repository, folded at
> read time, met only through the three domains.

**Piece.** The whole lattice of `docs/design/record-store.md` — one piece (the design's § Cut).
**Pin.** `c501e002` (the commit carrying the revision; re-pinned from `9cc32431`). **Digest.** blob
`886d7920f38eebe2dc098b175ceb7fd9793fa1b4` = `git rev-parse c501e002:docs/design/record-store.md`
= `git hash-object docs/design/record-store.md` at re-planning, so `pin = digest`. Every unit reads
the design as `git show c501e002:docs/design/record-store.md`, never the working file:
`design-migration` deletes it.

**Bootstrap.** This plan is written in the layout it deletes. It is one of "the existing plans under
`plans/`" the design removes rather than migrates, so `plan-cutover` deletes it with the rest; the
last unit is accepted on its commit, since no plan record for this plan will exist.

## Where this stands

Re-planned 2026-09-25 at `c501e002`: the design decided every ruling and finding the first
revision surfaced, and the delta is applied below. Wave 0 is ready; everything else is pending on
its deps only. No ruling is owed. Not bound: `plans/omp-harness` carries `.bound`; binding is the
architect's act at deliver.

## Units

| wave | state   | unit                      | realizes            | outputs (summary; the shard is the full array)                                                                                                        | deps                                                                                         |
| ---- | ------- | ------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 0    | ready   | `record-store`            | `record store`      | `runtime/src/record-store/**`; memory's `ulid.ts` moved to `runtime/src/ulid.ts` (subpath `./ulid`) and every importer; tests; registry; biome ignore | —                                                                                            |
| 0    | ready   | `scaffold-cutover`        | `plan`              | forge `deploy/{project-template,init}.ts` + 2 tests; canon `tooling/{project-template,scaffold-cli}.ts` + 1 test                                      | —                                                                                            |
| 1    | pending | `lifecycle-configuration` | `plan`              | schema `Skill.runtime` shape; forge `deploy/runtime-config.ts`, `cli/commands/deploy.ts`; runtime `runtime-config.ts`; 2 tests                        | `scaffold-cutover` (contention)                                                              |
| 1    | pending | `design-domain`           | `design`            | `runtime/src/capabilities/design/design.ts`                                                                                                           | `record-store`                                                                               |
| 1    | pending | `notebook`                | `notebook`          | `runtime/src/capabilities/note/notebook.ts`                                                                                                           | `record-store`                                                                               |
| 1    | pending | `plan-domain`             | `plan`              | `runtime/src/capabilities/plan/plan.ts`                                                                                                               | `record-store`                                                                               |
| 1    | pending | `unit`                    | `unit`              | `runtime/src/capabilities/plan/unit.ts`                                                                                                               | `record-store`                                                                               |
| 1    | pending | `pin`                     | `pin`               | `runtime/src/capabilities/plan/pin.ts`                                                                                                                | `record-store`                                                                               |
| 1    | pending | `view`                    | `view`              | `runtime/src/view/**`                                                                                                                                 | `record-store`                                                                               |
| 1    | pending | `immutability-gate`       | `immutability gate` | `record-store/immutability-gate.ts` + test; runtime `package.json`; lockfile; husky `pre-commit`; `gates.yml`; registry                               | `record-store`                                                                               |
| 2    | pending | `domain-interface`        | `domain interface`  | ports + `capabilities/{design,plan,note}` verb surfaces; loader/plugin/main/index; canon `manifest.ts`; 3 tests; registry                             | `design-domain`, `notebook`, `plan-domain`, `unit`, `pin`, `view`, `lifecycle-configuration` |
| 3    | pending | `note-skill`              | `skill routing`     | `canon/src/skills/note/skill.ts` (new); one test header                                                                                               | `domain-interface`                                                                           |
| 3    | pending | `trio-skill-routing`      | `skill routing`     | `canon/src/skills/{design,plan,deliver}/skill.ts` (the `plan` skill becomes the lifecycle states' home); 6 canon tests                                | `domain-interface`                                                                           |
| 3    | pending | `design-migration`        | `design`            | the design records (new); deletes `docs/design/record-store.md`                                                                                       | `domain-interface`, `immutability-gate`                                                      |
| 4    | pending | `plan-cutover`            | `plan`              | deletes plan-states, plan-set, markers, `plans/**` (this plan included), runtime `carryOn`, memory's plan-path handling; migrates callers             | `note-skill`, `trio-skill-routing`, `design-migration`, `scaffold-cutover`                   |

Waves are the earliest-wave closure of R. Within each wave outputs are pairwise disjoint, and no
unit's outputs intersect a wave-mate's refs: the W1 runtime modules import only `record-store/`
files `immutability-gate` does not touch (it adds one file and edits none) and no module another
W1 unit writes; the W3 skills borrow nothing from each other (§ Contract).

**One edge is contention, not meaning.** `lifecycle-configuration → scaffold-cutover`:
`forge/test/deploy/cli.test.ts` exercises both `init` (whose assertions `scaffold-cutover`
rewrites) and `deploy` (whose emission `lifecycle-configuration` changes), so the two cannot share
a wave.

**W2 is a singleton, and it is not a mis-cut.** `domain interface` is a cut vertex of R: it
composes the three domains, `unit`, `pin`, the view and the lifecycle configuration, and every
later unit consumes the capability vocabulary it registers.

## Slices

Cut on the design's seams (§ Boundaries: mechanism · meaning · projection), plus the slice that
moves the existing homes over.

| slice      | units                                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| mechanism  | `record-store`, `immutability-gate`, `design-domain`, `notebook`, `plan-domain`, `unit`, `pin`, `view`, `domain-interface` |
| meaning    | `note-skill`, `trio-skill-routing`                                                                                         |
| projection | `lifecycle-configuration`, `scaffold-cutover`                                                                              |
| cutover    | `design-migration`, `plan-cutover`                                                                                         |

`cross = 8` (`domain-interface→lifecycle-configuration`, `note-skill→domain-interface`,
`trio-skill-routing→domain-interface`, `design-migration→domain-interface`,
`design-migration→immutability-gate`, `plan-cutover→note-skill`,
`plan-cutover→trio-skill-routing`, `plan-cutover→scaffold-cutover`). An exhaustive pairwise-swap
check over the four slices finds no swap that lowers it.

## Lattice coverage

22 anchors at `c501e002` (`git show c501e002:docs/design/record-store.md | grep -oE '^- \*\*[a-z ]+\*\*'`).
Ten are some unit's `realizes`. Twelve are **covered, not cited** — built inside `record-store`,
whose acceptance requires the artifact to spell each — and are surfaced here as the design's law
requires for a concept no unit cites.

| anchor                                                                                                                                   | realized by                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `record store`                                                                                                                           | `record-store`                                                               |
| `immutability gate`                                                                                                                      | `immutability-gate`                                                          |
| `design`                                                                                                                                 | `design-domain`, `design-migration`                                          |
| `notebook`                                                                                                                               | `notebook`                                                                   |
| `plan`                                                                                                                                   | `plan-domain`, `lifecycle-configuration`, `scaffold-cutover`, `plan-cutover` |
| `unit`                                                                                                                                   | `unit`                                                                       |
| `pin`                                                                                                                                    | `pin`                                                                        |
| `view`                                                                                                                                   | `view`                                                                       |
| `domain interface`                                                                                                                       | `domain-interface`                                                           |
| `skill routing`                                                                                                                          | `note-skill`, `trio-skill-routing`                                           |
| `record id` `entity` `payload` `fold` `envelope` `record` `supersession` `retraction` `head` `divergence` `incoherence` `reconciliation` | **surfaced** — covered by `record-store`, no unit cites them                 |

Why covered rather than cited: the twelve are one dependency chain of pure functions over one
record shape (`record id, entity → envelope; envelope, payload → record → supersession,
retraction → head → divergence, incoherence → reconciliation`, with `fold` over them). One unit per
anchor would add five singleton waves before any domain could start, and each would add a test file
to the one shared registry (`gate-convicts.test.ts`), serializing them further.

## Contract

- **Homes.** The record store: `packages/runtime/src/record-store/` — internal to `runtime`, never
  exported from the `.` barrel or a package subpath, never named by `canon` or `forge`. The one ULID:
  `packages/runtime/src/ulid.ts`, exported as `@cratylus/runtime/ulid` so `memory` imports it. Domain
  modules: `packages/runtime/src/capabilities/design/design.ts`, `…/note/notebook.ts`,
  `…/plan/plan.ts` (the plan entity), `…/plan/unit.ts`, `…/plan/pin.ts`; the view:
  `packages/runtime/src/view/`. Capability verb surfaces (`index.ts`, `dispatch.ts` per capability
  dir) and ports (`ports/{design,plan,note}.ts`) are `domain-interface`'s.
- **W1 isolation.** Every W1 runtime module imports only from `record-store/` (never
  `immutability-gate.ts`), never from another capability module, the view or `runtime-config.ts`.
  What a module needs from another domain it declares as a structurally typed parameter: `unit`
  takes its plan's liveness, its pin, and the owed rulings naming it; `pin` takes the concept's
  closure; `plan-domain` and `unit` take their lifecycle vocabularies; `view` declares the shapes it
  renders. `domain-interface` composes them — the lattice's own statement that the interface factors
  view, notebook, design, plan and unit.
- **Lifecycle states are meaning** (§ Boundaries). Their one home is the `plan` skill
  (`trio-skill-routing`), carried on its `Skill` object; `lifecycle-configuration` builds the
  channel that projects them into the runtime config, as the event vocabulary travels today; the
  runtime spells none of them. The runtime modules act on roles the configuration conveys (which
  unit state satisfies a dependency, which plan state admits at most one holder, which is final),
  never on the names.
- **W3 isolation.** `note-skill` and `trio-skill-routing` borrow nothing from each other. `deliver`
  and `plan` reach the notebook through the `note` capability's verbs, not through the `note`
  skill's signs.
- **Signs.** Nothing here coins a name. A sign a unit needs that is neither a lattice anchor nor
  already in the corpus (the records root, the envelope operation for an entity's first version, the
  configuration's role keys, exported identifiers) is derived with `signify` and reported in that
  unit's return. The records root is declared once, in `record-store`.
- **Proof.** W1 runtime modules prove themselves by a smoke script whose text and verbatim output
  the return carries, run as `pnpm --filter @cratylus/canon exec tsx <absolute path>`. Permanent
  tests land at the verb surface in `domain-interface`, where behaviour becomes consumer-visible.
  One unit per wave touches `gate-convicts.test.ts`: `record-store` (W0), `immutability-gate` (W1),
  `domain-interface` (W2), `plan-cutover` (W4); no W3 unit adds or deletes a test file.
- **Durability.** Each executor commits its own paths (pathspec) at coherent steps and adds a
  changeset naming every package its paths changed. `pnpm verify` is the green bar.

## Decided in C at `c501e002` (formerly rulings and findings)

- **R1 → (a).** `plan` is an entity (proposed → bound → closed; at most one bound; closing replaces
  deletion); `unit` is a new concept factoring `plan`, `pin`, `notebook`; an owed ruling is an open
  notebook question naming a plan or unit; `plan` gains bind and close.
- **R2.** The runtime `carryOn` capability is deleted (`plan-cutover`).
- **R3.** Everything under `plans/` is removed, not migrated and not captured as notes.
- **D1 overruled.** Lifecycle states have one home, the `plan` skill; the runtime receives them as
  projected configuration.
- **F1, F2 applied.** `record` factors `envelope`, `payload`; `envelope` factors `record id`,
  `entity`; a name is a label only where the entity has one.
- **F3 in scope.** Memory's plan-path handling is deleted (`plan-cutover`); one ULID, moved down into
  `runtime` (`record-store`).
- `design-migration`'s executor is the architect; binding and closing are the architect's at
  deliver.

## Boundary findings (new at `c501e002`; each planned as noted, none blocks)

- **N1 — what "the design it realizes" is.** A plan's payload names "the design it realizes", but C is
  one per repository and a cut piece is not an entity. Planned reading (`plan-domain`): the plan
  names the concepts of the piece it realizes, by anchor.
- **N2 — two bound plans after a merge.** Two branches can each bind a different plan; the union has
  two bound plans. `divergence` is per entity and `incoherence` covers retracted references and
  factor cycles only, so no concept reports it. Planned (`plan-domain`, `domain-interface`): reported
  in the view's resolve-first layer and never resolved by picking one; `bind` refuses while it
  stands.
- **N3 — naming one note.** Notes have no name (a name is a label "where the entity has one") and
  agents never see ids, yet `note` shows one note and retracts notes. Planned (`domain-interface`,
  `note-skill`): a note is addressed by its topic, and by kind within a topic; a reference matching
  several live notes refuses and lists them.
- **N4 — note kinds and closing an owed ruling.** Recognising an owed ruling needs to know which notes
  are questions, but § Boundaries names only lifecycle states as projected meaning. Planned: the
  runtime treats a note's kind as opaque and recognises an owed ruling by a live note that blocks a
  plan or unit; the `note` skill holds the kinds and the rule that only a question blocks. The
  notebook has no close verb, so closing a question is retracting it — which, unlike closing a plan,
  removes it from the live view. A question naming a plan blocks binding it and every unit of it.
- **N5 — this plan.** Read literally, § Boundaries removes this plan with the others: it is deleted by
  its own last unit and never becomes plan records (the earlier "cut this plan over" instruction
  yields to the design).
- **N6 — no verb authors a plan.** The `plan` interface adds, revises and advances units and binds
  and closes a plan, but nothing proposes one. Planned (`domain-interface`): the first `add` naming
  a plan that does not exist proposes it, with the design it realizes (N1).

## Census (measured at `c501e002`; re-run for today's figure)

- Plan-layout signs outside CHANGELOGs, `plans/` and `docs/design/`:
  `git grep -lE "PLAN_STATES|PLAN_FRONTIER|PLAN_MARKERS|plan-set|plan-states|SUPERSEDED_MARKER|planStates|planMd" -- . ':!*CHANGELOG.md' ':!plans/**' ':!docs/design/**' ':!pnpm-lock.yaml'`
  → **20 files**: `scaffold-cutover` owns 4 (`forge/src/deploy/{init,project-template}.ts`,
  `canon/tooling/project-template.ts`, `canon/test/cratylism.test.ts`), `trio-skill-routing` owns 1
  (`canon/src/skills/plan/skill.ts`), `plan-cutover` owns 15. Root `package.json`'s `plan` script
  and root-config notes about `plans/` fall outside that regex and are in `plan-cutover`'s array.
- `plans/` besides this plan: `git ls-tree -r --name-only c501e002 plans | grep -v '^plans/record-store/'`
  → 14 files (omp-harness 12 including `.bound` and `.ruling-owed`; two loose plan-mode files).
- ULID importers in memory: `git grep -lE "from '(\./|\.\./src/)ulid\.js'" -- packages/memory` → 10
  files (4 `src`, 6 `test`, `ulid.test.ts` among them).
- Memory's plan-path handling: `audit.ts` (the `plan-path` class and its comments), `node.ts`
  (`PLAN.md` in `DEFAULT_MARKERS`), `cli.ts` (help text), `seeds.ts` (plan-scoped prose),
  `runtime/src/ports/memory.ts` (marker comments), tests `audit.test.ts`, `node.test.ts`,
  `session-isolation-integration.test.ts` (a scenario built on the retired state folders and
  `.owner`). `cli.test.ts`'s `plan:demo/x` is an inert scope tag, not plan handling.
- Test registry: `gate-convicts.test.ts` REGISTRY classifies every `*.test.ts` under five package test
  dirs and fails on an unclassified or stale entry.
- Capability registration: `loader.ts` `CAPABILITIES` + `CapabilityPort`, `plugin.ts`
  `RuntimePlugin`, `ports/<kebab>.ts` (the keyspace biconditional), `main.ts` routes, the `.` barrel,
  the runtime README, canon `RUNTIME_CAPABILITIES` (held equal by `capability-keyspace.test.ts`). The
  CLI routes by `CAPABILITIES` and needs no edit.
- The event vocabulary's channel, which the lifecycle vocabulary follows: canon `AgentPlugin.events`
  → forge `cli/commands/deploy.ts` → `deploy/runtime-config.ts` (`emitRuntimeConfig`) →
  `$AGENT_RUNTIME_CONFIG` / `~/.cratylus.json` → runtime `loadRuntimeConfig`; the round trip is held
  by `canon/test/event-vocabulary.test.ts` § (c).
