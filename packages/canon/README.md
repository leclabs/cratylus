# @cratylus/canon

The **meaning** concern of [cratylus](../../README.md) — the canonical corpus of discovered
optimal-signifiers, authored as typed TypeScript.

The discipline is [latent lexicography](../../VISION.md): describing the vocabulary a foundation model
already holds, rather than authoring prose and hoping it lands. An agent or skill in this corpus is
therefore not a prompt. It is a **vector of values** over the catalog's factors, and the
markdown a harness reads is a projection of these modules.

Canon is harness-agnostic **and** runtime-agnostic: it says what an agent _is_ and what a skill
_means_, never how either is carried. What every package is for is
[ARCHITECTURE.md](../../ARCHITECTURE.md)'s; installing the corpus on a machine, and choosing among
its practices, is [the `cratylus` README](../cli/README.md)'s. This README is for the author of a
corpus, or of a plugin that extends this one.

## Using it

```bash
npm install cratylus @cratylus/canon
```

The package's default export is canon as an agent-plugin. A consumer `extends` it from a
`cratylus.config.ts` and projects it with the `cratylus` command:

```ts
import { defineConfig } from 'cratylus';
import canon from '@cratylus/canon';

export default defineConfig({
  extends: [canon],
  patches: [],
});
```

Addressing is by **imported binding**, never a string id. That holds one level down too: a role or
persona cell imports each value it states, so composition is checked by the compiler rather than
resolved by a registry, and every part of a composite is traceable to its one home.

## What the plugin carries

| field       | what it is                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| `manifest`  | **which factors exist** — 18, in six groups; enforcement level is an attribute of every value        |
| `events`    | **which lifecycle events exist** — the corpus's harness-agnostic event vocabulary                    |
| `fragments` | the factor value modules, filed one per factor directory                                             |
| `agents`    | the composed agents: six generic holders of their roles, and three personas                          |
| `skills`    | the skill cells — each a self-sufficient formal block plus the siblings it composes                  |
| `hooks`     | the hook cells, each carrying its verbatim worker payload                                            |
| `practices` | **which ways of working exist** — each an installable choice, declared as data in `src/practices.ts` |
| `plumbing`  | what every practice is installed with and none is offered as, declared beside them                   |

Canon owns the catalog because a factor is **constitutive**: declaring one makes it part of that
corpus's agent design. The manifest rides the plugin rather than living in the projector, so a
consumer can extend this design — or add a factor to it — without editing the tool that renders
it. The shapes those cells are authored against, and `defineAgentPlugin` that declares the plugin,
are [`@cratylus/schema`](../schema/README.md)'s.

## The agents

The plugin carries nine agents, all in the practice `example-driven-workflow`. `architect`, `lead`,
`builder`, `assayer`, `illustrator` and `check-writer` are the generic holders of their roles. A role
cell (`src/roles/<role>.ts`) states a value for every factor, an explicitly empty set counting as one,
and `agents/<role>.ts` is `holder(<role>Role)`: named for the role, carrying nothing beyond it and no
mark. `holder` refuses a cell missing a factor, a scalar without exactly one value, a slot not filled
exactly once, and empty guardrails.

kino, nico and mav are personas over the architect role, `persona(architectRole, residue)`: each is
an agent named as an individual, with a description and a mark of its own beside the values it
states. A single value it states replaces the role's, a slot only its own slot; a set value is added
after the role's, and restating one the role holds changes only its enforcement level or note. It
never states the role itself, since the contract is the role's. Composition refuses, rather than
ignores, a persona that widens reach (a perception-scope, action-scope or handoff the role does not
hold; it may narrow them), removes a guardrail or lowers its level, removes any other value, names a
factor the catalog does not have, or has no mark or its role's; the `CompositionRefusal` it throws
names what it refused.

A composed agent also says, for the projector, the role it holds (`holds`), the roles its handoffs
name (`dispatches`), its model's tier and effort (`routing`), its typed handoff (`contract`) and the
per-turn persistence protocol every agent re-grounds its stance by (`persistence`). Nothing narrows
its tools: every agent keeps the harness's defaults, and only its handoffs are a permission. Its
`key` is reserved for ipseic agents and is empty. `holder`, `persona`, `guarded`,
`CompositionRefusal`, the six role cells and `MANIFEST` are also named exports, for a corpus that
composes agents of its own over these roles.

## Typed handoffs

An assignment and a deliverable are values of their factors, and each carries its contract as JSON
Schema data (`src/contracts.ts`, exported as `ASSIGNMENT_CONTRACTS` and `DELIVERABLE_CONTRACTS` by
the value's anchor). Composition copies the pair onto the agent as `contract`:

| Role         | Assignment                                                             | Deliverable                                                                         |
| ------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| lead         | cut brief `{cut, concepts[≥1], examples[≥1], decisions[≥1]}`           | outcome with efficiency `{cut, outcomes[≥1], verdicts, efficiency, hardeningNotes}` |
| builder      | work package `{cut, workPackage, outputs[≥1], concepts[≥1], examples}` | done or failing case `{cut, workPackage, done, failingCase?}`                       |
| assayer      | judgment brief `{cut, workPackages[≥1], examples[≥1], decisions}`      | verdict per concept `{cut, verdicts[≥1], hardeningNotes}`                           |
| check-writer | examples `{cut, examples[≥1]}`                                         | checks seen red `{cut, checks}`                                                     |
| illustrator  | concepts `{cut, concepts[≥1]}`                                         | examples with flagged terms `{examples, flaggedTerms}`                              |

The architect's assignment is free-text intent and its deliverable goes to the operator, so it
carries no contract. A builder's `examples` may be empty: a package sharing outputs owns no example.
A harness binds the deliverable as its own output schema, checked strictly, and checks the
assignment (one fenced `assignment` JSON block in the dispatch text) with the schema package's
`checkAssignment` before the agent runs, refusing a misfit and naming each missing or ill-typed
field.

## Guards

A value its behavioral examples showed drifting is held by a guard cell (`src/guards/`), stated in
the role as `guarded(value, guard)`, so the guard binds exactly the agents composing that value.
`hand-back` holds the architect's decisiveness: at turn end it asks a judge whether the last reply
hands an owned decision back to the operator, and refuses the stop when it does, naming the tell.
`descend` holds the architect's conceptual elevation: before each tool call it asks a judge whether
the call opens the work itself (source, tests, builds, commands outside the design records) instead
of the design, the examples, the journal, the ledger or a delegate, and refuses the call when it
does, naming the tell.
`bottom-line` holds the architect's bottom-line-up-front ordering, over what it does as over what it
reports, since an act taken in a turn has happened by the time the turn ends. Before each tool call,
and at turn end, it asks a judge, given the conversation so far in visible text, the decisions
recorded that turn (as `unrecorded` reads them) and the act, whether the act buries the bottom line.
A call does when it takes a second action on a topic the turn has already acted on; recording the
decision the turn takes is that decision, never a second action, and its consequences belong to the
record, not to any action (0102); a reply to the operator does when its conclusion is not first,
a topic has other than exactly one action, a delegate's ruling is not addressed to that delegate, or
its support carries anything but the facts and reasons its conclusions rest on, such as an
instruction, an offer, record identifiers, entry status or how the records were read, written, kept
or replaced (that a decision was recorded is never support). It refuses the call or the stop when it
does, naming the tell `burying`.
A topic is a matter the operator asked about, or an outcome that calls for someone's action; support
states facts and reasons, never instructions. Every act the turn takes or recommends on a topic's
matter, the question or artifact it settles or changes, is one of its actions; only what the reply
itself directs, and the acts the turn takes, count, never a recorded decision's consequences. A decision taken in the turn and reported with its reason, an
approval included, is that topic's one action, and a separate follow-on action on it is a second; a
topic decided before the turn, or a reported outcome that calls for action, keeps exactly one action
of its own. A ruling given to the delegate who asked is its topic's one action, the decision it
delivers included; a candidate set aside in favour of a recommended one gets no action of its own.
An act counts however the reply phrases or divides it (conditional, for later, as an offer or inside
the support), and a short direct answer on one topic still gives it exactly one action.
Both `bottom-line` and `hand-back` refusals tell the rewrite to keep a delegate's ruling addressed to
that delegate (`rulingToDelegate` in `src/guards/owned-question.ts`).
`past-objective` holds the architect's stopping rule: before each tool call it asks a judge, given
the conversation so far in visible text (the operator's requests, the agent's replies and its
delegates' reports) and the call, whether the conversation shows the objective met, its outcome
achieved with nothing open left, and the call takes a further step instead of reporting the outcome, and refuses the
call when it does, naming the tell `procedure past objective`. A call that takes or records a
decision on a meaning question the architect owns is never past the objective, in any turn.
`unrecorded` holds the architect's deliverable, decisions with their reasons: at turn end it asks a
judge, given the decisions recorded that turn (each concept-journal append that took effect since
the operator's last message, as its verb and content) and the reply, whether the reply reports an
owned meaning question settled in that turn with no recorded decision carrying it, and refuses the
stop when it does, naming the tell `holding open`.
Whether the architect holds what an owned meaning question needs is one judgment (0101), the
`owned-question` shared judgment in `src/guards/owned-question.ts`, made once per turn end by its one
rule and read by every guard whose judgment turns on it (`hand-back`, `bottom-line`, `unrecorded`,
each through `judge.reads`): given the conversation so far and the reply, it lists each owned question
the turn takes up with whether the architect holds what it needs. The rule: the architect rules on an
owned question from the design, the examples, the conversation and known practice of the product's
industry; the operator not having spoken to it is never a lack. It lacks what the question needs only
when, with all of those, the ruling would still choose what the product is for, a priority between the
operator's goals, or a fork that is irreversible, about value or beyond its competence. The guards
reading it never weigh a question's grounds themselves; they judge from it what follows: holding it,
the architect settles and records the question in that turn, never only on a condition, and approves
examples that express the design; lacking it, it keeps the question open and reports the one action
that gets what is missing. The harness makes the judgment at most once per act, when the first guard
in force reads it, and gives that one answer to each; a judgment that cannot be made is reported, and
its readers are told none was made, still judge the act, and refuse nothing on it (0091).
An owned question is one of meaning, constraints on realization or a check ruling; priority, such as
which work comes next, is the operator's to decide and the architect's to recommend with its facts and
reasons, recording nothing, and `hand-back` and `unrecorded` never fault it (0102).
`past-objective` takes from `owned-question` only what an owned question is, reads no judgment, and
never judges whether the architect held what a decision needed.
Every guard on the same turn end is judged on that stop, and their refusals reach the agent as one.
A judge answer it cannot read refuses nothing and is reported.

## The first principle

The first principle, the dense `cratylism` axiom, has its one literal home in
`genus/prime-principle.ts` and is not stamped on every cell. It rides only the cells whose laws apply
it: the skills that name concepts by anchor, optimal sign or cold decode set it as their `preamble`,
and an agent carries it once, in plain words, as the `cratylism` stance of the role it holds, where
that role states it. A cell that does not use it
never holds a host's own authored surfaces to this corpus's naming axiom. The axiom is scoped: the
cold-decode oracle decides signs only for the corpus's core agent factor names and values, the
terminology it was built to discover. Every other term is the industry's own, used as the industry
understands it, and no consumer surface is held to the oracle. It is intrinsic to those cells'
projected bytes, so it survives deployment into a foreign repository rather than depending on
ambient context.

Because the plugin object loses its package-root provenance when a consumer imports it, the
directory fields are resolved against `import.meta.url` at definition time and consumed verbatim.

## Dependencies, stated plainly

`@cratylus/schema` for the cell shapes and for `defineAgentPlugin`, which declares the plugin at its
entry. Canon reaches the projector as **data** — the corpus is passed to it as a plugin — and no
cell imports it.

No cell imports the runtime either. A skill names the capability it routes to — `eventTap` or
`concepts`, the two built into the runtime — as `runtime: { capability: … }`,
never its implementation, and a cell that emits shell invoking the binary carries it as a fact the
projector substitutes at emission. That is the architecture's highest-ranked property — meaning
and mechanism never referencing each other — and [ARCHITECTURE.md](../../ARCHITECTURE.md) records
how it came to hold.
