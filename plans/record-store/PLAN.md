# record-store

> Notes, design and plans become computed state: immutable records in the repository, folded at
> read time, met only through the three domains.

**Piece.** The whole lattice of `docs/design/record-store.md` — one piece (the design's § Cut).
**Pin.** `9e7730da` (the commit carrying the revision; re-pinned from `a49ff769`, and before that
from `96aa7ca3`, `9e3e1a6f`, `b3b5a64c`, `0c9da09c`, `4610c33f`, `c501e002` and `9cc32431`).
**Digest.** blob `781dc63953c94224b73aea448f7d6d4e388db564` =
`git rev-parse 9e7730da:docs/design/record-store.md` = `git hash-object docs/design/record-store.md`
at re-planning, so `pin = digest`. Every pending unit reads the design as
`git show 9e7730da:docs/design/record-store.md`, never the working file, because `design-migration`
deletes it. `domain-interface` is carried to the new pin by the design-holder's redispatch.

**Bootstrap.** This plan is written in the layout it deletes. It is one of "the existing plans under
`plans/`" the design removes rather than migrates, so `plan-cutover` deletes it with the rest; the
last unit is accepted on its commit, since no plan record for this plan will exist.

## Where this stands

Re-pinned 2026-09-25 at `9e7730da` (§ Decided in C at `9e7730da`). No wave, dep or unit moved.

- **Pending specs.** `note-skill`, `trio-skill-routing` and `design-migration` now script exactly
  the surface `domain-interface` landed (§ Contract, last bullet). `plan-cutover` was only re-pinned:
  it scripts none of the three capabilities.
- **State.** The plan is bound (`.bound`). W0 and W1 are completed, `domain-interface` (W2) is
  active, and W3 and W4 are pending on it. No ruling is owed.

## Units

| wave | state     | unit                      | realizes            | outputs (summary; the shard is the full array)                                                                                                                                | deps                                                                                         |
| ---- | --------- | ------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 0    | completed | `record-store`            | `record store`      | `runtime/src/record-store/**`; memory's `ulid.ts` moved to `runtime/src/ulid.ts` (subpath `./ulid`) and every importer; tests; registry; biome ignore                         | —                                                                                            |
| 0    | completed | `scaffold-cutover`        | `plan`              | forge `deploy/{project-template,init}.ts` + 2 tests; canon `tooling/{project-template,scaffold-cli}.ts` + 1 test                                                              | —                                                                                            |
| 1    | completed | `lifecycle-configuration` | `plan`              | schema `Skill.runtime` shape; forge `deploy/runtime-config.ts`, `cli/commands/{deploy,install}.ts`, `project/{index,resolve-skills}.ts`; runtime `runtime-config.ts`; 2 tests | `scaffold-cutover` (contention)                                                              |
| 1    | completed | `design-domain`           | `design`            | `runtime/src/capabilities/design/design.ts`                                                                                                                                   | `record-store`                                                                               |
| 1    | completed | `notebook`                | `notebook`          | `runtime/src/capabilities/note/notebook.ts`                                                                                                                                   | `record-store`                                                                               |
| 1    | completed | `plan-domain`             | `plan`              | `runtime/src/capabilities/plan/plan.ts`                                                                                                                                       | `record-store`                                                                               |
| 1    | completed | `unit`                    | `unit`              | `runtime/src/capabilities/plan/unit.ts`                                                                                                                                       | `record-store`                                                                               |
| 1    | completed | `pin`                     | `pin`               | `runtime/src/capabilities/plan/pin.ts`                                                                                                                                        | `record-store`                                                                               |
| 1    | completed | `view`                    | `view`              | `runtime/src/view/**`                                                                                                                                                         | `record-store`                                                                               |
| 1    | completed | `immutability-gate`       | `immutability gate` | `record-store/immutability-gate.ts` + test; runtime `package.json`; lockfile; husky `pre-commit`; `gates.yml`; registry                                                       | `record-store`                                                                               |
| 2    | active    | `domain-interface`        | `domain interface`  | ports + `capabilities/{design,plan,note}` verb surfaces; loader/plugin/main/index; canon `manifest.ts`; 3 tests; registry                                                     | `design-domain`, `notebook`, `plan-domain`, `unit`, `pin`, `view`, `lifecycle-configuration` |
| 3    | pending   | `note-skill`              | `skill routing`     | `canon/src/skills/note/skill.ts` (new); one test header                                                                                                                       | `domain-interface`                                                                           |
| 3    | pending   | `trio-skill-routing`      | `skill routing`     | `canon/src/skills/{design,plan,deliver}/skill.ts` (the `plan` skill becomes the lifecycle states' home); 6 canon tests                                                        | `domain-interface`                                                                           |
| 3    | pending   | `design-migration`        | `design`            | the design records (new); deletes `docs/design/record-store.md`                                                                                                               | `domain-interface`, `immutability-gate`                                                      |
| 4    | pending   | `plan-cutover`            | `plan`              | deletes plan-states, plan-set, markers, `plans/**` (this plan included), runtime `carryOn`, memory's plan-path handling; migrates callers                                     | `note-skill`, `trio-skill-routing`, `design-migration`, `scaffold-cutover`                   |

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

22 anchors at `9e7730da` (`git show 9e7730da:docs/design/record-store.md | grep -oE '^- \*\*[a-z ]+\*\*'`).
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
retraction → head → divergence, incoherence → reconciliation`, with `fold` over them; at `4610c33f`
a retraction is itself a head, so the chain tightened rather than moved). One unit per
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
- **The surface W3 scripts against** (landed by `domain-interface`, fixed for W3). Within plan
  verbs, `--plan <p>` puts the plan in view: `plan show` (the bound plan), `plan show <plan>` (any
  plan), `plan show <unit> --plan <p>`, and add, advance, retract and revise of a unit. Wherever no
  plan is in view, for instance in a note's `--blocks`, a unit is `u of plan p`; `note` has no
  `--plan`. A pin is retaken only by `plan revise <unit> --plan <p> --repin --reason <why>`. Every
  write takes `--author`, `--reason` and `--cause`, and set-valued flags are repeated once per member.
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

## Decided in C at `4610c33f`

- **A retraction is a head.** A record is a version or a retraction; a head is either, named by no
  later record; one head is settled — live if a version, withdrawn if a retraction; superseding a
  retraction reinstates; divergence includes a version against a retraction. Applied to
  `record-store` (Intent, Accept 1), `design-domain`, `notebook`, `pin`.
- **Writes name only current heads.** Naming a non-head refuses, so a single branch stays linear and
  divergence arises only from merges. Every smoke script that produced divergence by writing twice to
  one version now writes two independent record sets and unions them.
- **One sense of supersession.** The `design` skill's `supersede(c, c')` / `supersededBy : C ⇀ C` law
  is restated as a new version of the same concept; a concept becoming another is a retraction plus
  a definition. Lands in `trio-skill-routing` (Intent, Accept 6).

## Decided in C at `0c9da09c`

- **Domain laws hold on every write.** A write that would break a law on the current branch is
  refused, so incoherence arises only from merges. Every smoke script and test that produced
  incoherence with a single-branch write now expects a refusal, and produces incoherence by uniting
  two record sets. Applied to the Accept of `design-domain`, `unit` and `domain-interface`.
- **Incoherence, generalized.** It now covers a withdrawn reference, a cycle, one name on two live
  entities, and more than one bound plan.
- **Reconciliation.** It resolves divergence (a version superseding every head) and incoherence (an
  ordinary write), under domain authority: the architect for design and plans, anyone for notes.
  `plan` and `note` gain `reconcile`, and `note` gains `revise` (`domain-interface`, `note-skill`,
  `trio-skill-routing`).
- **Notebook.** A kind is a label the runtime never interprets. An owed ruling is any live note
  that blocks something, and it ends by retraction or by a revision that blocks nothing. A diverged
  note blocks the union of what its heads block. `note-skill` drops "only a question may block".
- **Design laws.** One live concept per anchor, and a withdrawn concept keeps its anchor. Factors
  are acyclic and name live concepts, so a concept that others factor on cannot be retracted.
  Gloss and reason are non-empty (`design-domain` Accept, `trio-skill-routing`, and
  `design-migration`'s reasons).
- **Plan.** Binding returns the previously bound plan to proposed, and when a merge leaves two
  bound, binding one resolves it. A plan names the concepts it realizes. An owed ruling naming a
  plan blocks binding it and every unit in it (`plan-domain` Accept, `domain-interface`).
- **Unit.** A unit realizes the concept its pin names. A dependency is satisfied at completion or
  beyond it, and dependencies are acyclic, live and within the same plan (`unit` Accept).
- **Pin.** A pin is taken only on a settled, live closure, and drifted and suspect are disjoint
  (`pin` Accept).
- **View.** Every live item gets a line, including one the structure cannot place. The view orders
  the lattice from the factors it is given. A concept shows each standing plan with that plan's
  state, and drilling into a diverged item shows every head (`view` Accept).

## Decided in C at `b3b5a64c`

- **Convergence.** Heads that carry the same payload read as one head and are not divergence.
  `domain-interface` tests both a converged merge and a diverged one.
- **Design.** Factors form a set, and the design knows nothing of plans. `trace` reads the design
  alone, and the plans standing on a concept reach its view only as the view's cross-reference
  (`domain-interface`). The design skill drops its plan borrow (`trio-skill-routing`, N10).
- **Names.** There is one live plan per name, and one live unit per name within its plan
  (`domain-interface`, `trio-skill-routing`).
- **Unit lifecycle.** It moves forward one step at a time, so a step back refuses as a skip does.
- **Drift.** A unit is drifted when its pinned version is no longer the concept's only head. A
  retraction in the design therefore drifts units instead of breaking a plan law, and concept
  liveness is no longer fed to the unit as an incoherence relation (`domain-interface`,
  `trio-skill-routing`).
- **View.** Open questions leave the resolve-first layer. No pending spec restated that layer, so the
  change reaches only the active `view` spec, through the redispatch.
- **Identity where a name fails.** When a merge leaves one name on two live entities, the interface
  shows each entity's identity beside the name and accepts it as input. `domain-interface` Accept 1
  now allows the identity pattern there and only there.

## Decided in C at `9e3e1a6f`

- **Plans are revisable.** A plan's name and the concepts it realizes can be revised; its state
  cannot, and moves only through bind and close (`domain-interface`, `trio-skill-routing`).
- **Note titles.** A note's title is its name, with one live note per title. Notes are addressed by
  title, and after a merge, by identity beside a shared title. **N9 is superseded**: there is no
  body-fragment matching (`domain-interface`, `note-skill`).
- **N10 is confirmed.** The unbuilt-concept law moves from `design` to `deliver`
  (`trio-skill-routing`, unchanged).
- **Converged heads** are read through the store's `Fold.diverged`; the interface never counts heads
  (`domain-interface`).
- **The immutability gate's gloss** now states per-commit judgement against each parent, and judges
  a rewriting push by what it leaves. `immutability-gate` is completed; no pending spec restates the
  gloss.

## Decided in C at `fd0de23d`–`96aa7ca3`

- **A unit can be retracted.** `plan` gains retracting a unit, refused while another live unit
  depends on it (`domain-interface`, `trio-skill-routing`).
- **Repair, one write at a time.** A write is refused only when it introduces a violation whose
  entities were not already bound together in a standing violation of the same law. A write that
  shrinks a violation, or leaves it standing, is allowed. **This supersedes N8's wording**; its
  planned default matched in substance (`domain-interface`).
- **Held names.** A name is held by every live entity carrying it, by a withdrawn entity that keeps
  it, and by a diverged entity for every name its heads carry. An identity is shown and accepted
  only where a name is held by more than one, and an identity for a name held once refuses
  (`domain-interface`, `note-skill`).
- **Plans.** A plan realizes a set of concepts. Closed is final: a closed plan keeps its name, so no
  other plan takes it, and is never revised, bound or re-proposed (`domain-interface`,
  `trio-skill-routing`; `plan-domain` is reopened for it).

## Decided in C at `a49ff769`

- **A closed plan's units are frozen.** A closed plan and its units are never written again. Carried
  by the `plan` skill (`trio-skill-routing`); the interface is `domain-interface`'s redispatch.
- **A unit realizes one of its plan's concepts** (`trio-skill-routing`).
- **Explicit re-pin.** The pin is retaken only by a revise that says so with a reason, never as a
  side effect of editing the spec (`trio-skill-routing`).
- **The view places diverged items, marked, and its header notes uncommitted records.** No pending
  spec restates the view; both are `domain-interface`'s.
- **`plan show` shows any plan named** (`trio-skill-routing`'s verb routing).
- **No substrate words, records included.** The interface speaks only the domain's words. The skills
  follow: `trio-skill-routing` Accept 7 now forbids `record`, `head` and `envelope` as words in the
  three skills (at `a49ff769` it hits `design/skill.ts:22`), and `note-skill` names records among
  what it never mentions.

## Decided in C at `9e7730da`

- **A unit realizing a concept its plan does not is an incoherence kind** after a merge
  (`trio-skill-routing` states it with the plan laws).
- **Resolve-first names causes and what moved, lists only what can still be resolved, and is
  scoped to its plan.** It is also printed by the view, so it is `domain-interface`'s; no pending
  spec restates it.
- **Substrate faults speak plainly**, naming what a person must repair: `domain-interface`'s.
- **Every printed name addresses one entity, with a unit qualified by its plan.** The W3 skills
  script the qualified form (`u of plan p`) wherever no plan is in view (`note-skill`,
  `trio-skill-routing`), and each adds an Accept that runs its quoted command forms against a built
  `cratylus`.

## Boundary findings (N1–N6 at `c501e002`, N7 at `4610c33f`, N8 at `0c9da09c`, N9–N10 at `b3b5a64c`; N9 superseded and N10 confirmed at `9e3e1a6f`; N8 superseded at `96aa7ca3`; none blocks)

N1, N2 and N4 are now decided in C at `0c9da09c`. Their planned defaults below are superseded where
that section says so, and are kept for the record.

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
- **N7 — reinstating a withdrawn concept (new at `4610c33f`).** Supersession "is how a withdrawn
  entity is reinstated", but the `design` interface's verbs are define, amend, retract, reconcile,
  trace. Planned (`design-domain`): amending a withdrawn concept supersedes its retraction and
  reinstates it; no new verb.
- **N8 — writing while a branch is incoherent (new at `0c9da09c`; superseded at `96aa7ca3` by C's repair rule).** "A write that would break a
  law is refused", but after a merge the law is already broken. Read literally, every write would
  refuse, including the ordinary write that is supposed to resolve the incoherence. Planned
  (`domain-interface`, and the W1 domain modules through their redispatch): a write is refused iff
  it introduces a violation the fold did not already hold. Writes to unrelated entities proceed, and
  an ordinary write that removes a standing violation is the reconciliation.
- **N9 — addressing one note (new at `b3b5a64c`; superseded at `9e3e1a6f` by note titles).** Notes carry no name,
  and identity surfaces only where a merge left one name on two entities. Nothing, then, addresses
  one of several live notes that share a topic and a kind label. Planned (`domain-interface`,
  `note-skill`): narrow the reference by a fragment of the note's body; a reference that stays
  ambiguous refuses and lists the candidates. No identity and no invented sign is used.
- **N10 — the design skill's plan-facing law (new at `b3b5a64c`; confirmed at `9e3e1a6f`).** "The design knows nothing of
  plans", yet the `design` skill borrows `realizes @ plan` and states the unbuilt-concept law
  (`∄ unit realizes c ⇒ SURFACE`). Planned (`trio-skill-routing`): the law moves to `deliver`, which
  reads both domains and already borrows `realizes`. Its meaning is kept; only its home moves.

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
