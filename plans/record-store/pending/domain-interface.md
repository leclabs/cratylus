# domain-interface

**Wave 2.** Realizes `domain interface`. Factors at `0c9da09c`: `view`, `notebook`, `design`,
`plan`, `unit`.

## Intent

One runtime capability per domain, named for it, in its own verbs. These capabilities are the only
way agents and users meet notes, design and plans.

- `design` shows the whole design or one concept. It defines, amends, retracts, reconciles and
  traces a concept. `trace` presents how the concept came to be (its versions with their reasons),
  what it stands on (the design skill's `closure`), and what stands on it (`blast`, plus each plan
  standing on it with that plan's state).
- `plan` shows the whole bound plan or one unit. It adds, revises and advances units, binds and
  closes a plan, and reconciles either. No verb authors a plan (`PLAN.md` N6): the first `add` that
  names a plan which does not exist proposes it, together with the concepts it realizes. `add`
  resolves `realizes` by name and takes the pin automatically, which refuses unless the concept and
  its whole closure are settled and live. `revise` re-pins. Binding a plan returns whichever plan was
  bound to proposed; when a merge has left two plans bound, binding the one to keep resolves it.
- `note` shows the whole notebook or one note. It captures, revises, retracts and reconciles notes.
  A note is addressed by its topic, and by its kind label within a topic; a reference matching
  several live notes refuses and lists them (N3). What a note blocks is named by plan or unit name
  and resolved here.

**Every write keeps its domain's laws on the current branch.** A write that would break one is
refused, so incoherence, like divergence, arises only from merges. An ordinary write on a diverged
item refuses and points to `reconcile`. An incoherence is resolved by an ordinary write to one of
the entities involved (N8). The laws themselves live in the W1 domain modules. This unit enforces
the laws that span domains: a unit's pin and `realizes` name the same concept; an owed ruling naming
a plan blocks binding it and every unit in it; a diverged note blocks whatever any of its heads
blocks.

Each capability composes the record store, its domain modules, `pin` and `view` (`PLAN.md`
§ Contract):

- it maps each fold onto the view's input shapes;
- it wires `design-domain`'s closure into `pin`'s port;
- it feeds `unit` its plan's liveness, its concepts' liveness and the owed rulings `notebook`
  recognises;
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

- `git show 0c9da09c:docs/design/record-store.md` § The record model (`incoherence`,
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
- `packages/runtime/src/view/**`, `packages/runtime/src/record-store/**`,
  `packages/runtime/src/runtime-config.ts`: repairs that composition exposes, if any (this wave has
  no other unit)
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
   surface in a temporary git repository, and together they cover the following.
   - **design**
     - define → show (root to primitive) → amend → show one concept in full.
     - Each of these writes refuses on one branch: a second live concept with an existing anchor
       (including the anchor of a withdrawn concept); an empty gloss or reason; a factor naming a
       withdrawn concept; a factor cycle; retracting a concept another concept factors on.
     - `trace` prints the concept's versions with reasons, what it stands on, and what stands on it.
     - Two branches amending one concept, merged: `design show` lists the divergence before the
       body, `design amend` exits 1 naming `reconcile`, and `design reconcile` settles it.
     - Two branches each defining one anchor, merged, lists an incoherence, and one branch
       retracting a concept while the other factors on it, merged, lists another. An ordinary
       write (retract, or amend) resolves each.
   - **plan** - The first `plan add` naming a new plan proposes it with its concepts. Bind it, then bind a
     second plan: the first returns to proposed. `close` keeps a plan readable. - Two branches binding different plans, merged: the incoherence is listed, and binding the one
     to keep resolves it. - `plan add` pins, and refuses when the concept's closure is diverged or withdrawn. `plan show`
     prints the bound plan in wave order with the frontier marked, and `design show` marks each
     concept's standing plans with their state. - Amending the realized concept makes the unit drifted; amending another concept in its
     closure makes it suspect, and never both. - A dependency on a unit of another plan, or one closing a cycle, refuses. A unit advanced past
     completion still satisfies its dependents. `plan advance` refuses a skipped step. `plan
reconcile` settles a diverged unit.
   - **note**
     - A note blocking a unit takes it off the frontier until `note retract`, or until `note revise`
       makes it block nothing.
     - A note blocking a plan makes `plan bind` refuse and takes all of that plan's units off the
       frontier.
     - A diverged note blocks what either head blocks: `note revise` refuses naming `reconcile`,
       and `note reconcile` settles it.
     - `note show` groups by kind label, then topic. An ambiguous note reference refuses and lists
       the candidates.
   - **everywhere**: every capability needing lifecycle configuration refuses when it is absent,
     and every `show` output is asserted free of `[0-9A-HJKMNP-TV-Z]{26}` and of the records root's
     path.
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
7. `pnpm verify` passes.
8. `.changeset/domain-interface.md` names `@cratylus/runtime` and `@cratylus/canon`.
