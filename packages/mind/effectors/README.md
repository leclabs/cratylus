# Effectors

**Organ:** Effectors (APPARATUS — _persistent · external_).

Effectors are an agent's **hands** — the standing set of actuators it can invoke to change the
world: read/write a file, run a toolchain, author a diff, dispatch a subagent, invoke a skill,
emit a report. Where _sensors_ are the channels by which the world enters an agent (its eyes),
effectors are what it reaches out and does. They are _persistent_ (an agent carries them across
every turn, not just one) and _external_ (they act on the world outside the agent, not on its own
reasoning). This is the apparatus side of competence: where _competence_ is the know-how an agent
carries, effectors are the concrete instruments through which that know-how lands as action.

Each cell in this directory is one canonical effector — a named bundle of capabilities with a
`holders:` line listing exactly which agents wield it. An effector is a **grant**: holding it is
what lets an agent touch the corresponding part of the world, and _not_ holding it is a real
boundary (a reviewer who lacks `author-diffs-prs` cannot write the code it reviews; an
investigator who holds `run-repros-write-findings` writes findings but, by construction, never the
fix). The set is deliberately narrow so that what each role can and cannot do is legible from its
hands alone.

## The canonical values

Effectors are organized by the kind of work the hand does. Each value below names the capability,
what it lets the agent do, and — in _(parentheses)_ — the agents that hold it.

### Making hands — read/write the thing under construction

- **`artifact-rw`** _(principal-ic)_ — read and write the artifact under construction; the
  maker's general-purpose hands. The broad, kind-agnostic making grant the more specialized
  making hands below specialize from. Effect: the agent can directly shape whatever it is
  building.

- **`run-toolchain`** _(mav)_ — read and write the codebase and run the toolchain (`pnpm`
  build / test / lint, `git`). Effect: the agent can change code and drive the build, test, and
  version-control machinery end to end.

- **`author-diffs-prs`** _(developer)_ — read and write code, author diffs and pull requests, run
  the happy-path test, and integrate at named composition-hubs. Effect: the agent realizes a
  decided plan as a concrete, integrated, tested change shipped as a PR.

- **`corpus-rw`** _(nico)_ — read and write the exemplar corpus (the lexicon primitives plus the
  agents and skills composites); the corpus-mutation hand. Effect: the agent can mint, edit, and
  restructure the canonical culture itself — the one hand that touches the corpus.

### Authoring hands — write the durable written record

- **`write-arch-docs`** _(arch-doc-writer)_ — read and write the architecture docs and
  diagram-sources, and read the codebase to recover the truth they document. Effect: the agent
  keeps the architecture documentation faithful to the system as it actually is.

- **`write-build-record`** _(boswell)_ — read and write the build-record and vault, and invoke the
  memory and praxis skills. Effect: the agent chronicles the history of the build and curates the
  durable knowledge store.

- **`write-sharded-plan`** _(planner)_ — read the goal and architectural frame, write the plan as
  a sharded-plan-layout (per-phase shards with exit-criteria), invoke praxis, and dispatch
  executor agents to carry the phases. Effect: the agent turns an agreed goal into an ordered,
  checkable plan and hands its phases off to be executed.

### Verdict hands — run something, then report a judgment

- **`emit-fenced-review`** _(principal-engineer-reviewer)_ — read the diff, codebase, or plan and
  emit a structured fenced review (a verdict plus severity-ranked findings, each with a
  coordinate, a frame-tag, and a fix). Effect: the agent produces a disciplined, anchored review
  rather than acting on the code itself.

- **`run-oracles-emit-verdicts`** _(tester)_ — run the change-under-test and its suites, execute
  oracles and golden-master comparisons, and emit verdict-tables and structured failure-reports.
  Effect: the agent judges a change against the dimensions of correctness and reports pass/fail,
  never patching.

- **`run-repros-write-findings`** _(investigator)_ — read the codebase, runtime, and logs, run
  reproductions and instrumented traces, and write findings — never the fix. Effect: the agent
  traces a defect to its origin and reports evidence, deliberately stopping short of repairing it.

- **`emit-introspection-dump`** _(cognizant)_ — read the subject-agent's execution-context
  (inputs, instructions, tools, state, constraints) and emit a labeled introspection-dump; may
  invoke skills read-only; performs no corpus-mutation and never acts on the subject. Effect: the
  agent makes another agent's situation legible without changing it.

### Shared hands — held across the society

- **`skill-invoke`** _(nico, mav, principal-ic, principal-engineer-reviewer, developer, planner,
  investigator, arch-doc-writer, boswell)_ — invoke skills (exemplify, praxis, memory, …); the
  canonical-ritual hand. Effect: the agent can run the society's named rituals rather than
  improvising their work ad hoc.

- **`subagent-dispatch`** _(nico, mav, principal-ic, principal-engineer-reviewer, planner,
  investigator, arch-doc-writer, boswell)_ — dispatch subagents and, for the maker-root,
  specialize them; the delegation hand. Effect: the agent can fan work out to other agents instead
  of doing everything itself.

## How an agent composites its effectors

Unlike organs that grant one value per agent, effectors are held as a **set**: an agent's
archetype names every effector it wields, and each cell's `holders:` line is the same membership
read from the other side. Most roles carry one specialized making-or-reporting hand plus the two
shared hands (`skill-invoke`, `subagent-dispatch`) — for example, the planner holds
`write-sharded-plan` together with both shared hands. The narrowness is the point: an agent's
reach is exactly the union of the effectors it holds, and the boundaries between roles are drawn
by which hands they were _not_ given.
