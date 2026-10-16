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

The plugin carries nine agents, all in the practice `intent-based-delegation`, which delivers
intent-based delegation. `architect`, `lead`, `builder` and `reviewer` are the generic holders of
their roles, with `illustrator` and `check-writer` as specialists called in when a story's risk
warrants them. Each role is defined by what it receives and what it hands over, never by steps:

- **architect** — the operator's principal architect, owning the conceptual design: receives intent,
  hands over stories, answers to meaning questions and read-backs; decides meaning only.
- **lead** — owns a story's realization, or a task with no story: orchestrates its tasks to builders
  (orchestrator-workers) and their changes to review as its story's risk calls for (Ship, Show or
  Ask), joins each change by the project's own integration once every check passes and any review
  due before it joins approves it, and hands over the outcome.
- **builder** — receives one task and hands over one change that passes every check.
- **reviewer** — reviews one change it did not write, before or after it joins as its story's risk
  calls for, against the change and, where they apply, its story's acceptance criteria and
  examples, held-out ones included; hands over one review and never builds or repairs the work.
- **illustrator** — writes a story's examples cold from its concepts alone, flagging unclear terms.
- **check-writer** — writes the checks binding a story's examples, each seen failing before the build.

The reviewer, the illustrator and the check-writer run on another model family than the builders
where one is available. A role cell (`src/roles/<role>.ts`) states a value for every factor, an
explicitly empty set counting as one, and `agents/<role>.ts` is `holder(<role>Role)`: named for the
role, carrying nothing beyond it and no mark. `holder` refuses a cell missing a factor, a scalar
without exactly one value, a slot not filled exactly once, and empty guardrails.

kino, nico and mav are personas over the architect role, each named for its expertise (kino film
production, nico the corpus's concept space and the cold-decode oracle, mav any software
repository), `persona(architectRole, residue)`: each is
an agent named as an individual, with a description and a mark of its own beside the values it
states. A single value it states replaces the role's, a slot only its own slot; a set value is added
after the role's, and restating one the role holds changes only its enforcement level or note. It
never states the role itself, since the contract is the role's. Composition refuses a malformed
persona: one that states the role, names a factor or slot the catalog does not have, removes a
value its role does not hold, or has no mark or its role's; the `CompositionRefusal` it throws names
what it refused. A persona that removes or lowers a guardrail, or removes a value from a set other
than its reach, is made, and composition warns (a `CompositionWarning`), naming what it changed: no
harm from one is on record (decision 0142(2)).

A composed agent also says, for the projector, the role it holds (`holds`), its model's tier and
effort (`routing`), its typed handoff (`contract`) and the per-turn persistence protocol every agent
re-grounds its stance by (`persistence`). Nothing narrows its tools or whom it may dispatch: every
agent keeps the harness's defaults (0142). Its `key` is reserved for ipseic agents and is empty.
`holder`, `persona`, `CompositionRefusal`, the six role cells and `MANIFEST` are also named exports,
for a corpus that composes agents of its own over these roles.

## Typed handovers

An assignment and a deliverable are values of their factors, and each carries its contract as JSON
Schema data (`src/contracts.ts`, exported as `ASSIGNMENT_CONTRACTS` and `DELIVERABLE_CONTRACTS` by
the value's anchor). Composition copies the pair onto the agent as `contract`. Each handover states
what it must contain, so one passed without a part shows what is missing (`?` marks an optional
field, `[≥1]` a list that may not be empty):

| Role         | Assignment                                                                                                                                                | Deliverable                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| lead         | story `{story, slice, why, acceptanceCriteria[≥1], outOfScope, path, review, cost, examples?, decisions?, contexts?}`, or a task with no story (as below) | outcome `{story, criteria[≥1], meaningQuestions, followUps, cost}` |
| builder      | task `{task, story?, goal, changes, decisions, done}`                                                                                                     | change `{change, tests, verified}`                                 |
| reviewer     | review request `{change, story?, acceptanceCriteria?, examples?}`                                                                                         | review `{verdict, findings, meaningQuestions}`                     |
| check-writer | examples `{story, examples[≥1]}`                                                                                                                          | checks seen red `{story, checks}`                                  |
| illustrator  | concepts `{story, concepts[≥1]}`                                                                                                                          | examples with flagged terms `{examples, flaggedTerms}`             |

The lead's assignment takes either form, stated as alternatives (`anyOf`); it fits when it fits any
one. Its outcome names the story, or for a task with no story the task, and holds each acceptance
criterion (or, for a task, what done means) with whether it holds and its evidence, and the cost in
agent runs by role, tokens and elapsed time. A review's `verdict` is `approve` or `changes`. The
architect's handovers are a person's — free-text intent in, a read-back to the operator out (where
things stand, with one recommendation) — so it carries no contract. A harness binds the deliverable
as its own output schema, shows the assignment form when an agent is dispatched or launched, and
checks the assignment given (one fenced `assignment` JSON block in the dispatch text) with the
schema package's `checkAssignment`, warning of each missing or ill-typed field, of the closest form
where there are alternatives; it never refuses the dispatch or the launch for it (0142(3)).

## Evaluation and drift

Every agent's behaviour is evaluated in real use, by the operator working with it: its evaluation
factor holds the one value `in-use`, and no guard, hook or model-judged check holds its acts or its
replies (0142(1)). Drift is held by the agent's own text, the persistence protocol naming its tells,
and its definition is revised on the evidence of use.

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

No cell imports the runtime either. A skill names the capability it routes to — `concepts`,
`ledger` or `versionSkew`, the three built into the runtime — as `runtime: { capability: … }`,
never its implementation, and a cell that emits shell invoking the binary carries it as a fact the
projector substitutes at emission. That is the architecture's highest-ranked property — meaning
and mechanism never referencing each other — and [ARCHITECTURE.md](../../ARCHITECTURE.md) records
how it came to hold.
