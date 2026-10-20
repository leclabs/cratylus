# @cratylus/canon

The **meaning** concern of [cratylus](../../README.md) — the canonical corpus of discovered
optimal-signifiers, each read in its concept's bounded context, authored as typed TypeScript.

The discipline is latent lexicography: describing the vocabulary a foundation model
already holds, rather than authoring prose and hoping it lands. An agent or skill in this corpus is
therefore not a prompt. It is a **vector of values** over the catalog's factors, and the
markdown an agent harness reads is a projection of these modules.

Canon is harness-agnostic **and** runtime-agnostic: it says what an agent _is_ and what a skill
_means_, never how either is carried. Installing the corpus on a machine, and choosing among
its practices, is [the `cratylus` README](../cli/README.md)'s. This README is for whoever works on
the corpus.

## What it is to the command

The package's default export is canon as an agent-plugin: the corpus the `cratylus` command is
built with, which `cratylus install` projects and places.

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
| `practices` | **which ways of working exist** — each an installable choice, declared as data in `src/practices.ts` |

Canon owns the catalog because a factor is **constitutive**: declaring one makes it part of that
corpus's agent design. The manifest rides the plugin rather than living in the projector, so the
design — and a factor added to it — changes without editing the tool that renders it. The shapes those cells are authored against, and `defineAgentPlugin` that declares the plugin,
are [`@cratylus/schema`](../schema/README.md)'s.

## The agents

The plugin carries nine agents, all in the practice `intent-based-delegation`, which delivers
intent-based delegation. `architect`, `lead`, `builder` and `reviewer` are the generic holders of
their roles, with `illustrator` and `check-writer` as specialists called in when a user story's risk
warrants them. Each role is defined by what it receives and what it hands off, never by steps:

- **architect** — the operator's principal architect, owning the conceptual model: receives intent,
  hands off user stories, answers to meaning questions and read-backs; decides meaning only.
- **lead** — owns a user story's realization, or a task with no story: orchestrates its tasks to
  builders (orchestrator-workers) and their changes to code review as the story's risk calls for
  (Ship, Show or Ask), joins each change by the project's own integration once every check passes
  and any review due before it joins approves it, and hands off the outcome. Where the operator has
  asked to review a change before it joins, the operator's review is its code review, and it joins
  on the operator's sign-off, a hold point.
- **builder** — receives one task and hands off one change that passes every check.
- **reviewer** — reviews one change it did not write, before or after it joins as its user story's
  risk calls for, against the change and, where they apply, the story's acceptance criteria and
  examples, held-out ones included; hands off one code review naming each finding, leaving building
  and repairing the work to the builders. A change the operator has asked to review is the
  operator's to review; the operator takes that change's held-out examples directly from the design.
- **illustrator** — writes a user story's examples cold from its concepts alone, flagging unclear
  terms.
- **check-writer** — writes the checks binding a user story's examples, each seen failing before the
  build.

The reviewer, the illustrator and the check-writer run on another model family than the builders
where one is available. A role cell (`src/roles/<role>.ts`) states a value for every factor, an
explicitly empty set counting as one, and its mark; `agents/<role>.ts` is `holder(<role>Role)`:
named for the role, carrying nothing beyond it, its mark the role's. `holder` refuses a cell missing
a factor, a scalar without exactly one value, a slot not filled exactly once, and empty guardrails.

kino, nico and mav are personas over the architect role, each named for its expertise (kino film
production and generative video, nico the corpus and latent lexicography, mav software
engineering). The architect role owns the conceptual model of every context it is given, the
corpus included; a persona brings its expertise and owns nothing its role does not.
Each is `persona(architectRole, overrides)`, stating only its overrides and extensions of the role:
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
effort (`routing`) and its typed handoff (`contract`). Nothing narrows its tools or whom it may
dispatch: every agent keeps the agent harness's defaults (0142). Its `key` is reserved for ipseic
agents and is empty. `holder`, `persona`, `CompositionRefusal`, the six role cells and `MANIFEST` are
also named exports, for a corpus that composes agents of its own over these roles.

## Typed handoffs

An assignment and a deliverable are values of their factors, and each carries its contract as JSON
Schema data (`src/contracts.ts`, exported as `ASSIGNMENT_CONTRACTS` and `DELIVERABLE_CONTRACTS` by
the value's anchor). Composition copies the pair onto the agent as `contract`. Each handoff states
what it must contain (`?` marks an optional field, `[≥1]` a list that may not be empty):

| Role         | Assignment                                                                                                                                                     | Deliverable                                                        |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| lead         | user story `{story, slice, why, acceptanceCriteria[≥1], outOfScope, path, review, cost, examples?, decisions?, contexts?}`, or a task with no story (as below) | outcome `{story, criteria[≥1], meaningQuestions, followUps, cost}` |
| builder      | task `{task, story?, goal, changes, decisions, done}`                                                                                                          | change `{change, tests, verified}`                                 |
| reviewer     | review request `{change, story?, acceptanceCriteria?, examples?}`                                                                                              | code review `{verdict, findings, meaningQuestions}`                |
| check-writer | examples `{story, examples[≥1]}`                                                                                                                               | checks seen red `{story, checks}`                                  |
| illustrator  | concepts `{story, concepts[≥1]}`                                                                                                                               | examples with flagged terms `{examples, flaggedTerms}`             |

The lead's assignment takes either form, stated as alternatives (`anyOf`); it fits when it fits any
one. Its outcome names the user story, or for a task with no story the task, and holds each
acceptance criterion (or, for a task, what done means) with whether it holds and its evidence, and
the cost in agent runs by role, tokens and elapsed time. A code review's `verdict` is `approve` or
`changes`. The architect's handoffs are a person's — free-text intent in, a read-back to the
operator out (where things stand, and what it recommends) — so it carries no contract. An agent
harness binds the deliverable as its own output schema and shows every session, each turn, the
assignment form of each agent that takes one: one fenced `assignment` JSON block in the dispatch
text.

## Evaluation and persona drift

Every agent's behaviour is evaluated in real use, by the operator working with it: its evaluation
factor holds the one value `in-use`, and no guard, hook or model-judged check holds its acts or its
replies (0142(1)). Persona drift is a concept of the agents context, judged by the operator in real
use; no agent carries countermeasure text against it.

## The first principle

The first principle, the dense `cratylism` axiom, has its one literal home in
`genus/prime-principle.ts` and is not stamped on every cell. It rides only the cells whose laws apply
it: the skills that give a concept its term, judge a term by its semantic gap or confirm it by a cold
read set it as their `preamble`, and an agent carries it once, in plain words, as the `cratylism`
stance of the role it holds, where that role states it. A cell that does not use it never holds a
host's own authored surfaces to this corpus's naming axiom. The axiom states cratylism as cratylic
context design holds it: names are natural to the model, whose semantic space is the universe of
discourse, so each concept takes its Cratylic name, the term leaving the smallest semantic gap read in
its bounded context; intuition proposes and a cold read confirms; the name is found, never coined, a
coined name only where no established term covers the concept; its correction is stated beside it,
each side of the gap once; and a kept name short of it is recorded as such. It is intrinsic to those
cells' projected bytes, so it survives deployment into a foreign repository rather than depending on
ambient context.

Because the plugin object loses its package-root provenance when a consumer imports it, the
directory fields are resolved against `import.meta.url` at definition time and consumed verbatim.

## Dependencies, stated plainly

`@cratylus/schema` for the cell shapes and for `defineAgentPlugin`, which declares the plugin at its
entry. Canon reaches the projector as **data** — the corpus is passed to it as a plugin — and no
cell imports it.

No cell imports the runtime either. A skill names the capability it routes to — `concepts` or
`versionSkew`, the two built into the runtime — as `runtime: { capability: … }`,
never its implementation, and a cell that emits shell invoking the binary carries it as a fact the
projector substitutes at emission. That is the architecture's highest-ranked property — meaning
and mechanism never referencing each other.
