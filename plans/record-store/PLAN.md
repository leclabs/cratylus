# record-store

> Notes, design and plans become computed state: immutable records in the repository, folded at
> read time, met only through the three domains.

**Piece.** The whole lattice of `docs/design/record-store.md` — one piece (the design's § Cut: the
lattice is connected and every domain factors down to the record store).
**Pin.** `9cc32431` (the commit that adds the design). **Digest.** blob
`adcb7aab0ed98fb8e265b4dc560ec02fc4cfe71e` = `git rev-parse 9cc32431:docs/design/record-store.md`
= `git hash-object docs/design/record-store.md` at authoring, so `pin = digest` and the plan is
not drifted. Every unit reads the design as `git show 9cc32431:docs/design/record-store.md`, never
the working file: `design-migration` deletes it.

**Bootstrap.** This plan is written in the layout it deletes. `plan-cutover` (the last wave)
re-authors every unit below as plan records and deletes this directory; until then this file is the
mirror and folder placement is state.

## Where this stands

Authored 2026-09-25 at `9cc32431`. Wave 0 is ready. Everything else is pending on its deps, and
three units also wait on rulings (§ Rulings owed). Not bound: `plans/omp-harness` carries `.bound`,
and binding this plan is `deliver`'s act, not the planner's.

## Units

| wave | state   | unit                 | realizes            | outputs (summary; the shard is the full array)                                                                                     | deps                                                                             | ruling   |
| ---- | ------- | -------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------- |
| 0    | ready   | `record-store`       | `record store`      | `runtime/src/record-store/**`, its test, one registry row, the biome ignore                                                        | —                                                                                | —        |
| 0    | ready   | `scaffold-cutover`   | `plan`              | forge `deploy/{project-template,init,index}.ts` + 2 tests, canon `tooling/{project-template,scaffold-cli}.ts`, 1 test              | —                                                                                | —        |
| 1    | pending | `design-domain`      | `design`            | `runtime/src/capabilities/design/design.ts`                                                                                        | `record-store`                                                                   | —        |
| 1    | pending | `notebook`           | `notebook`          | `runtime/src/capabilities/note/notebook.ts`                                                                                        | `record-store`                                                                   | —        |
| 1    | pending | `plan-domain`        | `plan`              | `runtime/src/capabilities/plan/plan.ts`                                                                                            | `record-store`                                                                   | —        |
| 1    | pending | `pin`                | `pin`               | `runtime/src/capabilities/plan/pin.ts`                                                                                             | `record-store`                                                                   | —        |
| 1    | pending | `view`               | `view`              | `runtime/src/view/**`                                                                                                              | `record-store`                                                                   | —        |
| 1    | pending | `immutability-gate`  | `immutability gate` | `record-store/immutability-gate.ts`, its test, runtime `package.json`, lockfile, husky `pre-commit`, `gates.yml`, one registry row | `record-store`                                                                   | —        |
| 2    | pending | `domain-interface`   | `domain interface`  | ports + `capabilities/{design,plan,note}` verb surfaces, loader/plugin/main/index, canon `manifest.ts`, 3 tests                    | `design-domain`, `notebook`, `plan-domain`, `pin`, `view`                        | R1       |
| 3    | pending | `note-skill`         | `skill routing`     | `canon/src/skills/note/skill.ts` (new), one test header                                                                            | `domain-interface`                                                               | —        |
| 3    | pending | `trio-skill-routing` | `skill routing`     | `canon/src/skills/{design,plan,deliver}/skill.ts`, 5 canon tests                                                                   | `domain-interface`                                                               | R1       |
| 3    | pending | `design-migration`   | `design`            | the design records (new); deletes `docs/design/record-store.md`                                                                    | `domain-interface`, `immutability-gate`                                          | —        |
| 4    | pending | `plan-cutover`       | `plan`              | deletes plan-states / plan-set / markers / state folders; migrates every caller; this plan → plan records                          | `trio-skill-routing`, `design-migration`, `scaffold-cutover`, `domain-interface` | R1 R2 R3 |

Waves are the earliest-wave closure of R (`wave(0)` = no deps). Every wave's outputs are pairwise
disjoint, and no unit's outputs intersect a wave-mate's refs: the W1 modules import only
`record-store/` files that `immutability-gate` does not touch (it adds one new file and edits
none), and the W3 skills borrow nothing from each other (§ Contract).

**W2 is a singleton, and it is not a mis-cut.** `domain interface` is a cut vertex of R: it
factors all three domains and the view, and every later unit consumes the capability vocabulary it
registers (`RUNTIME_CAPABILITIES`, the keyspace, the routes). No re-slice puts a second unit
beside it without a dependency edge running through it.

## Slices

Cut on the design's own seams (§ Boundaries: mechanism · meaning), plus the slice that moves the
existing homes over.

| slice     | units                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| mechanism | `record-store`, `immutability-gate`, `design-domain`, `notebook`, `plan-domain`, `pin`, `view`, `domain-interface` |
| meaning   | `note-skill`, `trio-skill-routing`                                                                                 |
| cutover   | `scaffold-cutover`, `design-migration`, `plan-cutover`                                                             |

`cross = 6` (`note-skill→domain-interface`, `trio-skill-routing→domain-interface`,
`design-migration→domain-interface`, `design-migration→immutability-gate`,
`plan-cutover→domain-interface`, `plan-cutover→trio-skill-routing`). Exhaustive pairwise-swap check
over the three slices: no swap lowers it.

## Lattice coverage

21 anchors at `9cc32431` (`git show 9cc32431:docs/design/record-store.md | grep -oE '^- \*\*[a-z ]+\*\*'`).
Nine are some unit's `realizes`. Twelve are **covered, not cited** — built inside `record-store`,
whose acceptance requires the artifact to spell each — and are surfaced here as the design's law
requires for a concept no unit cites.

| anchor                                                                                                                                   | realized by                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `record store`                                                                                                                           | `record-store`                                               |
| `immutability gate`                                                                                                                      | `immutability-gate`                                          |
| `design`                                                                                                                                 | `design-domain`, `design-migration`                          |
| `notebook`                                                                                                                               | `notebook`                                                   |
| `plan`                                                                                                                                   | `plan-domain`, `scaffold-cutover`, `plan-cutover`            |
| `pin`                                                                                                                                    | `pin`                                                        |
| `view`                                                                                                                                   | `view`                                                       |
| `domain interface`                                                                                                                       | `domain-interface`                                           |
| `skill routing`                                                                                                                          | `note-skill`, `trio-skill-routing`                           |
| `record` `record id` `entity` `payload` `envelope` `supersession` `retraction` `head` `divergence` `incoherence` `reconciliation` `fold` | **surfaced** — covered by `record-store`, no unit cites them |

Why covered rather than cited: these twelve are one dependency chain of pure functions over one
record shape (`record → supersession, retraction → head → divergence, incoherence → reconciliation`,
with `fold` over all of them). One unit per anchor produces four singleton waves before any domain
can start, and each would add a test file to the one shared registry (`gate-convicts.test.ts`),
which serializes them further. The lattice also under-declares this cluster: `record` and
`envelope` are marked primitive while their glosses name `envelope`, `payload`, `record id` and
`entity` (finding F1).

## Contract

- **Homes.** The record store: `packages/runtime/src/record-store/` — internal to `runtime`: never
  exported from the `.` barrel or a package subpath, never named by `canon` or `forge`. Domains:
  `packages/runtime/src/capabilities/design/design.ts`, `…/note/notebook.ts`, `…/plan/plan.ts`;
  the pin: `…/plan/pin.ts`; the view: `packages/runtime/src/view/`. The capability verb surfaces
  (`index.ts`, `dispatch.ts` in each capability dir) and ports (`ports/{design,plan,note}.ts`) are
  `domain-interface`'s.
- **W1 isolation.** Every W1 module imports only from `record-store/` (never
  `immutability-gate.ts`), never from another capability dir or the view. Cross-domain needs are
  parameters the module declares structurally: `pin` takes the concept's closure from its caller;
  `view` declares the shapes it renders; `plan-domain` stores the pin as an opaque value. The
  composition is `domain-interface`'s — which is the lattice's own statement that the interface
  factors view, notebook, design and plan.
- **W3 isolation.** `note-skill` and `trio-skill-routing` borrow nothing from each other (no
  `X @ note` in the trio, no borrow from design/plan/deliver in `note`). `deliver` reaches the
  notebook through the `note` capability's verb, not through the `note` skill's signs.
- **The lifecycle vocabulary.** Stored unit states are `pending`, `active`, `completed`; `ready`
  is computed (`pending` ∧ every dep `completed` ∧ no ruling owed) and never stored; `frontier` =
  `ready` ∪ `active`. Their one home is `plan-domain`'s module — the capability's own vocabulary,
  as `EventTapVerb` is `eventTap`'s — and the `plan` skill restates them (decision D1).
- **Signs.** Nothing here coins a name. A sign a unit needs that is neither a lattice anchor nor
  already in the corpus (the records root directory, the envelope operation naming an entity's
  first version, a module's exported identifiers) is derived with `signify` and reported in that
  unit's return. The records root is declared once, in `record-store`; the gate, the hook, CI and
  every later unit import or read it from there.
- **Proof.** W1 domain modules prove themselves by a smoke script whose text and verbatim output
  the return carries, run as `pnpm --filter @cratylus/canon exec tsx <absolute path>` (canon ships
  `tsx`); permanent tests land at the verb surface in `domain-interface`, where the behaviour is
  consumer-visible. Only `record-store`, `immutability-gate`, `domain-interface` and `plan-cutover`
  touch `gate-convicts.test.ts`, one per wave.
- **Durability.** Each executor commits its own paths (pathspec) at coherent steps and adds a
  changeset naming every package its paths changed. `pnpm verify` is the green bar.

## Rulings owed

**R1 — plan-level lifecycle has no concept in the lattice.** The `domain interface` gloss has
`plan` show "the whole bound plan", and `deliver` acts on whole plans: `bound(P)` (WIP = 1,
persists across sessions), `elect`, `terminal(P) ⇒ retire(P)`. Today `.bound`, the plan-tier
`.ruling-owed` and `plan-set.sh bind | elect | retire` carry them, and the cutover deletes all
three. The lattice's entities are concepts, units and notes; a plan is not an entity, and no `plan`
verb binds, elects or retires. Options: (a) amend C so a plan is an entity of the plan domain whose
payload names it and says whether it is bound, with bind and retire as `plan` verbs; (b) amend C
so binding is derived (for example, the plan holding an active unit) and retirement is folding away
a plan whose units are all completed; (c) rule plan-level lifecycle out of this piece, leaving
`deliver`'s WIP law without a carrier. Choosing redraws C, so it is the architect's. Blocks
`domain-interface`, `trio-skill-routing`, `plan-cutover`. (`plan-domain` stays ready: it carries a
unit's plan membership by name, derived from "plans (DAGs of units)"; ruling (a) makes that a
revision, which `domain-interface`'s outputs include.)

**R2 — the runtime `carryOn` capability.** Its terminus reads plan state from the state folders
and `.bound` / `.ruling-owed` markers through flags; no canon cell has declared it since `carry-on`
decoupled from plans, and the cutover deletes its only data source. Options: (a) delete the
capability — port, capability dir, keyspace and plugin members, route, canon
`RUNTIME_CAPABILITIES` member, tests, README rows — accepting the loss the `carry-on` cell already
records; (b) rebase its terminus onto the plan domain's fold of the bound plan (needs R1).
Recommended: (a). Blocks `plan-cutover`.

**R3 — `plans/omp-harness`.** It is the bound plan and holds an open plan-tier ruling, but it
cannot move into plan records: its units realize no concept in any design record, and a unit
cannot be authored without a pin. Options: (a) retire it (git keeps it), capturing its open fork
and its two pending units as notes; (b) design its concepts first so its units can be re-authored
— design work outside this piece. Recommended: (a). Blocks `plan-cutover`.

## Findings (not blocking)

- **F1.** `record` is declared primitive but glossed as "an envelope and a whole-state payload";
  `envelope` is declared primitive but its gloss names `record id` and `entity`. The factorization
  under-declares these edges; the plan follows the glosses.
- **F2.** A note's payload is glossed as "kind, topic and body", while `entity` says every entity
  carries an anchor as its label. `notebook` follows the entity gloss, so a note is named by its
  anchor.
- **D1.** The lifecycle vocabulary's home is the runtime plan domain (event-tap precedent). If
  ARCHITECTURE property 4 is read as making it corpus-owned, the plan domain instead receives it as
  configuration from canon (the carry-on precedent), and `plan-domain`, `domain-interface` and
  `trio-skill-routing` change accordingly.
- **F3 (beside the path, filed rather than planned).** `memory` treats `PLAN.md` as a plan-node
  marker and audits `plans/<x>` references, and both go dark once no plan writes `PLAN.md`.
  `docs/*.md` holds notes filed before the notebook existed. `memory/src/ulid.ts` and the record
  id's ULID become two implementations (runtime cannot import memory; memory could later import
  runtime's).
- **F4.** The `note` hypothesis (`ssh upmav cat …/.agents/skills/note/SKILL.md`) was unreachable
  at census (connection timed out twice). `note-skill` retries it and, failing that, authors from
  the design alone and says so.

## Census (measured at `9cc32431`; re-run for today's figure)

- Plan-layout signs outside CHANGELOGs, `plans/` and `docs/design/`:
  `git grep -lE "PLAN_STATES|PLAN_FRONTIER|PLAN_MARKERS|plan-set|plan-states|SUPERSEDED_MARKER|planStates|planMd" -- . ':!*CHANGELOG.md' ':!plans/**' ':!docs/design/**' ':!pnpm-lock.yaml'`
  → **20 files**. `scaffold-cutover` owns 4 (`forge/src/deploy/{init,project-template}.ts`,
  `canon/tooling/project-template.ts`, `canon/test/cratylism.test.ts`); `trio-skill-routing` owns
  1 (`canon/src/skills/plan/skill.ts`); `plan-cutover` owns the other 15. Root `package.json`'s
  `plan` script and root-config notes about `plans/` are outside that regex and in
  `plan-cutover`'s array.
- Tracked plan-layout files: `git ls-files plans` → 14 before this plan (omp-harness 12
  including its two markers, plus two loose plan-mode files at the root).
- Test registry: `gate-convicts.test.ts` REGISTRY classifies every `*.test.ts` under five package
  test dirs and fails on an unclassified or stale entry.
- Runtime capability registration spans `loader.ts` `CAPABILITIES` + `CapabilityPort`,
  `plugin.ts` `RuntimePlugin`, `ports/<kebab>.ts` (biconditional with the keyspace in
  `capability-keyspace.test.ts`), `main.ts` routes, the `.` barrel, the runtime README, and canon
  `RUNTIME_CAPABILITIES` (held equal to the keyspace by the same gate). The CLI routes by
  `CAPABILITIES` and needs no edit.
