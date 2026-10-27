# @cratylus/canon

The **meaning** concern of [cratylus](../../README.md) — the canon of discovered Cratylic
names, each read in its concept's bounded context, authored as typed TypeScript.

The discipline is cratylic context design: describing the vocabulary a foundation model
already holds, rather than authoring prose and hoping it lands. An agent or skill in the canon is
therefore not a prompt. It is a **vector of values** over the catalog's factors, and the
markdown an agent harness reads is a projection of these modules.

Canon is harness-agnostic **and** runtime-agnostic: it says what an agent _is_ and what a skill
_means_, never how either is carried. Installing the canon on a machine is
[the `cratylus` README](../cli/README.md)'s. This README is for whoever works on
the canon.

## What it is to the command

The package's default export is canon as an agent-plugin: the canon the `cratylus` command is
built with, which `cratylus install` projects and places.

Addressing is by **imported binding**, never a string id. That holds one level down too: a role
profile or a persona imports each value it states, so composition is checked by the compiler rather than
resolved by a registry, and every part of a composite is traceable to its one home.

## What the plugin carries

| field      | what it is                                                                                    |
| ---------- | --------------------------------------------------------------------------------------------- |
| `manifest` | **which factors exist** — 18, in six groups; enforcement level is an attribute of every value |
| `events`   | **which lifecycle events exist** — the canon's harness-agnostic event vocabulary              |
| `rulesets` | **which rulesets exist** — the standard conventions an install offers (`src/rulesets.ts`)     |
| `factors`  | the factors' values, filed one directory per factor                                           |
| `agents`   | the composed agents: five generic holders of their roles, and three personas                  |
| `skills`   | the skills — each a self-sufficient formal block plus the siblings it composes                |

Canon owns the catalog because a factor is **constitutive**: declaring one makes it part of the
canon's agent design. The manifest rides the plugin rather than living in the projector, so the
design — and a factor added to it — changes without editing the tool that renders it. The shapes the canon's units are authored against, and `defineAgentPlugin` that declares the plugin,
are [`@cratylus/schema`](../schema/README.md)'s.

## The agents

The plugin carries eight agents: the industry roles of behaviour-driven development, each a generic
holder of its role, and three personas over the business analyst. An install places every one. Each
role is defined by what it receives and what it hands back, never by steps, and its profile states
only where cratylus departs from the industry's reading of the role:

- **business-analyst** — holds the domain model, `design/model/`: turns the product owner's intent
  into concepts, user stories and examples, answers meaning questions, and confirms a realization
  means what was intended; decides meaning only.
- **tech-lead** — holds a user story's realization: decides how it is built, hands its tasks to
  software engineers and its examples to the test engineer, joins the changes as the story's risk
  calls for (Ship, Show or Ask), and hands back the outcome.
- **software-engineer** — realizes one task and hands back one change; never writes the acceptance
  tests its work is judged by.
- **test-engineer** — writes an acceptance test for each example before the build, sees it fail,
  and gives the verdict whether the realization passes.
- **code-reviewer** — reviews one change it did not write against its user story's acceptance
  criteria and examples, and hands back one code review naming each finding, leaving building and
  repairing the work to the software engineers.

The test engineer and the code reviewer run on another model family than the software engineers
where one is available. A role profile (`src/roles/<role>.ts`) states a value for every factor, an
explicitly empty set counting as one, and its mark; `agents/<role>.ts` is `holder(<role>Role)`:
named for the role, carrying nothing beyond it, its mark the role's. `holder` refuses a profile missing
a factor, a scalar without exactly one value, a slot not filled exactly once, and empty guardrails.

kino, nico and mav are personas over the business analyst role, each named for its expertise (kino
film production and generative video, nico terminology work as cratylic context design practises
it, mav software engineering). The business analyst role holds the domain model of every context it
is given; a persona brings its expertise and owns nothing its role does not.
Each is `persona(businessAnalystRole, overrides)`, stating only its overrides and extensions of the
role: an agent named as an individual, with a description and a mark of its own beside the values it
states. A single value it states replaces the role's, a slot only its own slot; a set value is added
after the role's, and restating one the role holds changes only its enforcement level or note. It
never states the role itself, since the contract is the role's. Composition refuses a malformed
persona: one that states the role, names a factor or slot the catalog does not have, removes a
value its role does not hold, or has no mark or its role's; the `CompositionRefusal` it throws names
what it refused. A persona that removes or lowers a guardrail, or removes a value from a set other
than its reach, is made, and composition warns (a `CompositionWarning`), naming what it changed: no
harm from one is on record.

A composed agent also says, for the projector, the role it holds (`holds`), its model's tier and
effort (`routing`), its typed handoff (`contract`) and the practice skills it loads (`skills`, below).
Nothing narrows its tools or whom it may
dispatch: every agent keeps the agent harness's defaults. Its `key` is reserved for ipseic
agents and is empty. `holder`, `persona`, `CompositionRefusal`, the five role profiles and `MANIFEST` are
also named exports, for a plugin that composes agents of its own over these roles.

## The practice skills

The practices the agents work by are bounded contexts of cratylus's own domain model, and each
reaches the agents as a skill named for its context: `cratylic-context-design` and
`behaviour-driven-development`. Neither restates a concept by hand. `build` runs
`tooling/practices.ts` before `tsc`: it reads `design/model/<context>/` — the context's name and
subject from `context.md`, each concept's term and correction from its record, never its examples —
and writes `generated/practices.json`, a sibling of `src/` and `dist/` that ships in the package and
is never committed. `src/practice.ts` reads it when a practice skill loads, and the skill's formal
block is the context's name and subject, then one `<term> ≜ <correction>` line per concept, each
byte for byte as recorded. Composition gives an agent, as `skills`, each practice its procedure
names, in procedure order, so the business analyst and its personas load both and the other four
roles load behaviour-driven development.

## Typed handoffs

An assignment and a deliverable are values of their factors, and each carries its contract as JSON
Schema data (`src/contracts.ts`, exported as `ASSIGNMENT_CONTRACTS` and `DELIVERABLE_CONTRACTS` by
the value's term). Composition copies the pair onto the agent as `contract`. Each handoff states
what it must contain (`?` marks an optional field, `[≥1]` a list that may not be empty):

| Role              | Assignment                                                                                                       | Deliverable                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| tech-lead         | user story `{story, slice, why, acceptanceCriteria[≥1], outOfScope, examples?}`, or a task with no story (below) | outcome `{story, joined, criteria[≥1], meaningQuestions, followUps}`       |
| software-engineer | task `{task, story?, goal, changes, done}`                                                                       | change `{change, tests, verified}`                                         |
| test-engineer     | examples `{story, examples[≥1]}`                                                                                 | acceptance tests `{story, tests: [{example, test, seenFailing, passes?}]}` |
| code-reviewer     | review request `{change, story?, acceptanceCriteria?, examples?}`                                                | code review `{verdict, findings, meaningQuestions}`                        |

An example is named `<context>/<concept>`, standing for all the examples of a concept file of
`design/model/`, or `<context>/<concept>: <example name>` for one, such as
`delivery/install: installs the industry roles`. The tech lead's assignment takes either form,
stated as alternatives (`anyOf`); it fits when it fits any one. Its outcome names the user story, or
for a task with no story the task, says whether the work was `merged` or `dropped`, and holds each
acceptance criterion (or, for a task, what done means) with whether it holds and its evidence. An
acceptance test's `passes` is absent before the build. A code review's `verdict` is `approve` or
`changes`. The business analyst's handoffs are the product owner's — free-text intent in, a report
out — so it carries no contract. An agent harness binds the deliverable as its own output schema and
shows every session, each turn, the assignment form of each agent that takes one: one fenced
`assignment` JSON block in the dispatch text.

## Evaluation and persona drift

Every agent's behaviour is evaluated in real use, by the product owner working with it: its
evaluation factor holds the one value `in-use`, and no guard, hook or model-judged check holds its
acts or its replies. Persona drift is a concept of the agent design context, judged by the
product owner in real use; no agent carries countermeasure text against it.

## The first principle

The first principle, the dense `cratylism` axiom, has its one literal home in
`genus/prime-principle.ts` and is not stamped on every unit of the canon. It rides only the units whose laws apply
it: the skills that give a concept its term, judge a term by its semantic gap or confirm it by a cold
read set it as their `preamble`, and an agent carries it once, in plain words, as the `cratylism`
stance of the role it holds, where that role states it. A unit that does not use it never holds a
host's own authored surfaces to the canon's naming axiom. The axiom states cratylism as cratylic
context design holds it: names are natural to the model, whose semantic space is the universe of
discourse, so each concept takes its Cratylic name, the term leaving the smallest semantic gap read in
its bounded context; intuition proposes and a cold read confirms; the name is found, never coined, a
coined name only where no established term covers the concept; its correction is stated beside it,
each side of the gap once; and a kept name short of it is recorded as such. It is intrinsic to those
units' projected bytes, so it survives deployment into a foreign repository rather than depending on
ambient context.

Because the plugin object loses its package-root provenance when a consumer imports it, the
directory fields are resolved against `import.meta.url` at definition time and consumed verbatim.

## Dependencies, stated plainly

`@cratylus/schema` for the shapes of the canon's units and for `defineAgentPlugin`, which declares the plugin at its
entry. Canon reaches the projector as **data** — the canon is passed to it as a plugin — and no
unit imports it.

No unit imports the runtime either. A skill names the capability it routes to — `model` or
`versionSkew`, the two built into the runtime — as `runtime: { capability: … }`,
never its implementation, and a hook declaration that emits shell invoking the binary carries it as a fact the
projector substitutes at emission. That is the architecture's highest-ranked property — meaning
and mechanism never referencing each other.
