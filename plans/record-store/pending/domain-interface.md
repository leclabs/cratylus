# domain-interface

**Wave 2.** Realizes `domain interface`. Factors at `96aa7ca3`: `view`, `notebook`, `design`,
`plan`, `unit`.

## Intent

One runtime capability per domain, named for it, in its own verbs. These capabilities are the only
way agents and users meet notes, design and plans.

- `design` shows the whole design or one concept. It defines, amends, retracts, reconciles and
  traces a concept. `trace` presents how the concept came to be (its versions with their reasons),
  what it stands on (the design skill's `closure`), and what stands on it (`blast`). The design
  knows nothing of plans, so `trace` reads the design alone. The plans standing on a concept, each
  with its state, reach the design view only as the view's cross-reference, which this unit
  composes from the plan fold.
- `plan` shows the whole bound plan or one unit. It adds, advances and retracts units, revises a
  unit or a plan, binds and closes a plan, and reconciles either.
  - No verb authors a plan (`PLAN.md` N6). The first `add` that names a plan which does not exist
    proposes it, together with the set of concepts it realizes.
  - There is one live plan per name, and one live unit per name within its plan. A closed plan
    keeps its name, so no other plan can take it.
  - Closed is final. A closed plan is never bound, revised or re-proposed, and stays readable.
  - Retracting a unit that another live unit depends on refuses, because dependencies name live
    units.
  - `add` resolves `realizes` by name and takes the pin automatically. The pin refuses unless the
    concept and its whole closure are settled and live. Revising a unit re-pins.
  - Revising a plan that is not closed changes its name or the set of concepts it realizes, never
    its state. State moves only through `bind` and `close`.
  - `advance` moves a unit forward exactly one step; skipping or going back refuses.
  - Binding a plan returns whichever plan was bound to proposed. When a merge has left two plans
    bound, binding the one to keep resolves it.
  - A retraction or divergence in the design never breaks a plan's laws; it drifts the units pinned
    to that concept.
- `note` shows the whole notebook or one note. It captures, revises, retracts and reconciles notes.
  A note's title is its name, and there is one live note per title, so a note is addressed by its
  title like any other named entity. There is no body-fragment matching; N9 is superseded. What a
  note blocks is named by plan or unit name and resolved here.

**Identity only where a name fails.** Per C at `96aa7ca3`, a name is held by several parties:

- every live entity carrying it;
- a withdrawn entity that keeps it (a withdrawn concept keeps its anchor, a closed plan its name);
- a diverged entity, for every name any of its heads carries.

When a merge leaves a name held by more than one entity, the interface shows each holder's identity
beside the name, and accepts an identity for that name. It shows and accepts identity nowhere else:
an identity given for a name held once refuses. This is the one place an identity surfaces, and
nothing else is invented to stand for it. It covers concept anchors, plan and unit names, and note
titles alike. Converged heads, which carry the same payload, read as one head and
are neither divergence nor a reason to show anything. The interface reads divergence from the
store's `Fold.diverged` and never counts heads itself.

**Every write keeps its domain's laws on the current branch.** A write that would break one is
refused, so incoherence, like divergence, arises only from merges. An ordinary write on a diverged
item refuses and points to `reconcile`. **Repair, one write at a time** (C's reconciliation at
`96aa7ca3`, superseding N8's wording): a write is refused only when it introduces a violation, one
whose entities were not already bound together in a standing violation of the same law. A write
that shrinks a standing violation, or leaves it standing, is allowed, so every incoherence can be
repaired by ordinary writes, one at a time. The laws themselves live in the W1 domain modules. This
unit enforces the laws that span domains: a unit's pin and `realizes` name the same concept; an owed
ruling naming a plan blocks binding it and every unit in it; a diverged note blocks whatever any of
its heads blocks.

**The repair rule gets one home, in the record store.** Today it has four homes: `design.ts`,
`plan.ts`, `unit.ts` and `notebook.ts` each implement "refuse a violation that no standing
violation of the same kind binds". This unit replaces the four copies with one generic check in the
record store. The check takes the violations before and after a write, each expressed as a kind
plus its bound entities. It returns the introduced ones: those whose entities are not a subset of
the entities of some standing violation of the same kind.

Each domain keeps its own laws. It computes its violations in that shape and calls the check;
it keeps its own refusal wording. The check knows no law and no domain, like the rest of the
store. It stays internal to `runtime`: the domains import it relatively, so it gets no package
subpath and the barrel stays untouched. Its identifiers are derived with `signify` and reported.

**Residue from the accepted W1 units, settled here:**

- The header of `pin.ts` (lines 21–22 at `85d02326`) says "`unit` reads only its `concept`".
  That is stale: `unit.ts` types its stored pin as `Pin`, a type import from `pin.ts`. The header
  is rewritten to say what `unit` actually takes from `pin.ts`.
- `Concept` is declared twice, in `capabilities/design/design.ts` and `view/design.ts`. It gets one
  home. The view keeps its structural input shapes, so the one declaration lives where the view may
  import it without importing a capability, or the view's input shape is renamed for what it is.
  The choice is made with `signify` and reported.
- The lifecycle channel's two ends are unused. `RuntimeConfig.configuration` has no reader, and
  `PlanLifecycle` and `UnitLifecycle` have no builder. The `plan` capability wires them: it reads
  `configuration.plan` from `loadRuntimeConfig`, builds both lifecycles from it, and refuses
  (naming the deploy) when the block is absent or malformed.

Each capability composes the record store, its domain modules, `pin` and `view` (`PLAN.md`
§ Contract):

- it maps each fold onto the view's input shapes;
- it wires `design-domain`'s closure into `pin`'s port;
- it feeds `unit` its plan's liveness and the owed rulings `notebook` recognises. Concept liveness
  is not a unit law at `b3b5a64c`: it reaches the unit only through the pin, as drift.
- it feeds `plan-domain` and `unit` their lifecycle vocabularies from the runtime config
  (`lifecycle-configuration`).

A capability whose configuration is absent refuses and names the deploy that would supply it; it
never falls back to states of its own. Agents never see record ids, envelopes, heads or files:
every input names entities by name, the capability resolves them, and every output is a view. The
envelope's author, time, reason and cause come from the invocation. A refusal exits 1 with a message
naming the verb that would succeed.

Reconciliation's authority (the architect for design and plans, anyone for notes) is skill
routing's, not this unit's: the runtime records the author and does not check it.

Registration follows the runtime's convention for capabilities that ship inside it (the `eventTap`
precedent):

- a port module per capability (the keyspace gate's biconditional);
- keyspace and `CapabilityPort` members;
- `RuntimePlugin` fields;
- a route in `main.ts` ahead of the discovered dispatch;
- the `.` barrel's port exports;
- the README's rows;
- the three new members in canon's `RUNTIME_CAPABILITIES`, which `capability-keyspace.test.ts`
  holds equal to the runtime keyspace.

The CLI routes by `CAPABILITIES` and needs no edit.

Permanent tests land here, at the verb surface, where the behaviour becomes consumer-visible: one
file per capability, covering what the W1 modules only smoke-proved. They supply the lifecycle
configuration through `$AGENT_RUNTIME_CONFIG`, pointing at a temporary file whose state names are
invented, so no test spells the `plan` skill's vocabulary.

## Static

- `git show 96aa7ca3:docs/design/record-store.md` § The record model (`incoherence`,
  `reconciliation`), § The three domains, § How they are met, § Intent ("Agents and users meet only
  the three domains, never the records"), § Boundaries.
- `packages/runtime/src/{main,loader,plugin,index}.ts`, `packages/runtime/src/ports/event-tap.ts`
  and `packages/runtime/src/capabilities/event-tap/`: the shape of a capability shipped inside the
  runtime, and how it reads `loadRuntimeConfig`.
- `packages/canon/test/capability-keyspace.test.ts`: the three axes and the equality leg.
- The landed W1 modules and their returns' reported signs.

## Deps

`design-domain`, `notebook`, `plan-domain`, `unit`, `pin`, `view`, `lifecycle-configuration`

## Outputs

- `packages/runtime/src/ports/{design,plan,note}.ts` (new)
- `packages/runtime/src/capabilities/{design,plan,note}/**`: a new `index.ts` and `dispatch.ts` in
  each; the W1 modules in these directories only where composition exposes a defect
- `packages/runtime/src/record-store/`: one new module holding the repair check. Also repairs that
  composition exposes, if any (this wave has no other unit).
- `packages/runtime/test/record-store.test.ts`: the repair check's legs
- `packages/runtime/src/capabilities/design/design.ts`, `packages/runtime/src/capabilities/plan/plan.ts`,
  `packages/runtime/src/capabilities/plan/unit.ts` and
  `packages/runtime/src/capabilities/note/notebook.ts`: each calls the one repair check, and its own
  copy is deleted
- `packages/runtime/src/capabilities/plan/pin.ts`: the stale header lines
- `packages/runtime/src/view/**`, including `view/design.ts`, whose `Concept` gets one home with
  `design.ts`'s; plus repairs that composition exposes
- `packages/runtime/src/runtime-config.ts`: only if reading the `plan` configuration exposes a defect
  in the reader
- `packages/runtime/src/{loader,plugin,main,index}.ts`
- `packages/runtime/README.md`
- `packages/runtime/package.json`, `packages/runtime/tsup.config.ts`: only if a subpath export is
  added
- `packages/runtime/test/{design,plan,note}.test.ts` (new)
- `packages/canon/src/manifest.ts`: `RUNTIME_CAPABILITIES`
- `packages/canon/test/capability-keyspace.test.ts`
- `packages/canon/test/gate-convicts.test.ts`: three REGISTRY rows
- `packages/cli/README.md`: the capability-verb examples
- `.changeset/domain-interface.md`

## Accept

1. `pnpm --filter @cratylus/runtime test -- design plan note` passes. The tests drive the verb
   surface in a temporary git repository and cover the cases below.

   **design**
   - define → show (root to primitive) → amend → show one concept in full.
   - Each of these writes refuses on one branch: a second live concept with an existing anchor
     (including the anchor of a withdrawn concept); an empty gloss or reason; a factor naming a
     withdrawn concept; a repeated factor; a factor cycle; retracting a concept another concept
     factors on.
   - `trace` prints the concept's versions with reasons, what it stands on, and what stands on it,
     and names no plan.
   - Two branches amend one concept differently and are merged: `design show` lists the divergence
     before the body, `design amend` exits 1 naming `reconcile`, and `design reconcile` settles it.
     Two branches making the same amendment and merged list no divergence.
   - Two branches each define one anchor and are merged: an incoherence is listed, `design show`
     prints each entity's identity beside the shared anchor, and `design retract` given one identity
     resolves it. One branch retracting a concept while the other factors on it, merged, lists
     another incoherence, which an ordinary write resolves.

   **plan**
   - The first `plan add` naming a new plan proposes it with its concepts. Bind it, then bind a
     second plan: the first returns to proposed. `close` keeps a plan readable.
   - A second live plan with an existing name, and a second live unit with an existing name in the
     same plan, each refuse. The same unit name in another plan is accepted.
   - `plan revise` renames a plan and changes its set of concepts, and the state it prints is
     unchanged. These refuse: a revision that sets the state; renaming onto another plan's name,
     including a closed plan's; revising, binding or re-proposing a closed plan.
   - `plan retract` withdraws a unit that nothing depends on, and refuses one another unit depends
     on.
   - Repair one write at a time. A merge leaves a dependency cycle among units `A`, `B` and `C`.
     Then an unrelated revision of `D` succeeds, and removing `A`'s dependency on `B` (a repair
     write) succeeds. Adding a dependency that closes a new cycle between `D` and `E`
     refuses.
   - Two branches binding different plans, merged: the incoherence is listed, and binding the one to
     keep resolves it.
   - `plan add` pins, and refuses when the concept's closure is diverged or withdrawn. `plan show`
     prints the bound plan in wave order with the frontier marked, and `design show` marks each
     concept's standing plans with their state.
   - Amending the realized concept makes the unit drifted, as do retracting it and diverging it.
     Retracting it lists no plan incoherence. Amending another concept in its closure makes the unit
     suspect, never both drifted and suspect.
   - A dependency on a unit of another plan, or one closing a cycle, refuses. A unit advanced past
     completion still satisfies its dependents. `plan advance` refuses a skipped step and a step
     back. `plan reconcile` settles a diverged unit.

   **note**
   - A note blocking a unit takes it off the frontier until `note retract`, or until `note revise`
     makes it block nothing.
   - A note blocking a plan makes `plan bind` refuse and takes all of that plan's units off the
     frontier.
   - A diverged note blocks what either head blocks: `note revise` refuses naming `reconcile`, and
     `note reconcile` settles it.
   - `note show` groups by kind label, then topic, and a note is shown and addressed by its title.
     Capturing, or revising to, the title of another live note refuses. Two branches each capturing
     one title, merged, list an incoherence; `note show` prints each identity beside the shared
     title, and `note retract` given one identity resolves it.

   **everywhere**
   - Every capability that needs lifecycle configuration refuses when it is absent.
   - Every `show` output is free of the records root's path.
   - Every `show` output matches `[0-9A-HJKMNP-TV-Z]{26}` only beside a name held by more than one
     entity. The holders include a withdrawn concept keeping its anchor against a live namesake from
     another branch. Every other fixture's output matches it nowhere, and an identity supplied for a
     name held once refuses.

2. `pnpm --filter @cratylus/canon test -- capability-keyspace gate-convicts` passes.
3. `git grep -nE "'(design|plan|note)'" -- packages/runtime/src/loader.ts packages/canon/src/manifest.ts`
   hits each of the three in both files (at `c501e002` it hit none).
4. After `pnpm build`, `pnpm exec cratylus design show` in a fresh `git init` directory exits 0,
   and its first line names that repository's `HEAD` commit with counts of zero.
5. The runtime spells no lifecycle state and no note kind:
   `git grep -nE "'(proposed|bound|closed|pending|ready|active|completed|idea|question|decision)'" -- packages/runtime/src/capabilities/design packages/runtime/src/capabilities/plan packages/runtime/src/capabilities/note packages/runtime/src/ports/design.ts packages/runtime/src/ports/plan.ts packages/runtime/src/ports/note.ts packages/runtime/src/view`
   prints nothing.
6. Sole:
   - `main.ts` routes each of `design`, `plan` and `note` exactly once:
     `git grep -cE "first === '(design|plan|note)'" -- packages/runtime/src/main.ts` prints 3.
   - No module under the three capability directories writes a file except through
     `record-store/`:
     `git grep -nE "writeFileSync|appendFileSync|renameSync|rmSync" -- packages/runtime/src/capabilities/design packages/runtime/src/capabilities/plan packages/runtime/src/capabilities/note`
     prints nothing.
7. **The repair rule has one home.**
   - The subset test that decides "introduced" appears in one record-store module only.
     `git grep -nE "\.every\(\(?\w+\)? => [^;]*\.(includes|has)\(" -- packages/runtime/src/capabilities packages/runtime/src/view`
     prints only `unit.ts`'s wave-placement line (`deps.every((dep) => placed.has(dep))`). At
     `85d02326` it also printed `design.ts:384`, `notebook.ts:149`, `plan.ts:196` and `unit.ts:244`.
   - The same pattern over `packages/runtime/src/record-store` hits exactly one module.
   - The return names the check's function, and `git grep -l <it> -- packages/runtime/src/capabilities`
     lists `design.ts`, `plan.ts`, `unit.ts` and `notebook.ts`.
   - `pnpm --filter @cratylus/runtime test -- record-store` passes with legs covering these cases: a
     violation whose entities are a subset of a standing one of the same kind is not introduced; the
     same entities under another kind are introduced; a violation that grows beyond its standing
     one is introduced; with no standing violations, every one is introduced.
8. **The W1 residue is gone.**
   - `git grep -n "reads only its" -- packages/runtime/src/capabilities/plan/pin.ts` prints nothing.
   - `git grep -nE "(interface|type) Concept\b" -- packages/runtime/src` hits once. At `85d02326` it
     hit `capabilities/design/design.ts:66` and `view/design.ts:34`.
   - `git grep -n "configuration" -- packages/runtime/src/capabilities/plan` hits the reader that
     builds `PlanLifecycle` and `UnitLifecycle` from `loadRuntimeConfig().configuration`. Accept 1's
     absent-configuration refusal and its invented-state fixtures exercise that reader end to end.
9. `pnpm verify` passes.
10. `.changeset/domain-interface.md` names `@cratylus/runtime` and `@cratylus/canon`.
