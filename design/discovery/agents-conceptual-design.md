# Agents: a conceptual design from first principles

Discovery document, 2026-10-10. Not recorded in the concept journal; nothing here is decided until the operator
reviews it. Bounded context: **agents** (today, cratylus's corpus context holds them).

---

## 1. What an agent is

An **agent** is a model given a purpose, a way of working, an authority, and a reach into an environment. Read the
classic definition (Russell & Norvig: an agent perceives through sensors and acts through actuators, judged by a
performance measure in an environment, "PEAS") through today's LLM agent frameworks (Anthropic's subagents,
OpenAI's Agents SDK, CrewAI, Google ADK, the A2A agent card), and every framework asks the same few questions of an
agent:

| Question                                     | Industry name                       | Example in frameworks                        |
| -------------------------------------------- | ----------------------------------- | -------------------------------------------- |
| Who is it, and what is it for?               | role, goal, backstory/persona       | CrewAI role/goal/backstory, A2A description  |
| How does it work?                            | instructions, skills                | system prompt, skills, procedures            |
| What may it decide?                          | decision rights, autonomy level     | RAPID/RACI, human-in/on-the-loop             |
| What can it see and do?                      | tools, permissions, least privilege | tool lists, approval tiers, sandboxes        |
| Whom can it hand work to?                    | handoffs, delegation                | OpenAI handoffs, ADK sub-agents, spawn lists |
| What thinks?                                 | model, reasoning effort             | model + effort settings                      |
| What does it remember?                       | memory, knowledge                   | session, retrieval, long-term memory         |
| What does it take and give?                  | input and output contracts          | structured output, report schema             |
| What must it never do, and how is that held? | guardrails                          | input/output guardrails, permission denial   |

The one modern addition the frameworks agree on: **hold behaviour by mechanism wherever possible, and by
instruction only where judgment is needed.** Permissions beat prompts (least privilege, from security), and
instructions should explain _why_ (Anthropic's prompting guidance).

## 2. The factors of an agent

Eighteen factors in six groups. Each factor is one independent lever: setting it changes what the agent does or
may do, and no factor's value can be derived from the others (MECE).

### I · Identity: what the agent is, the same however it is started

| #   | Factor          | What it settles                            | Coordinates (typical values)                                                                                                                                                              |
| --- | --------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Role**        | its function and accountability in a team  | one role: architect, lead, builder, assayer, … (one only, so a dispatcher can reason about what comes back)                                                                               |
| 2   | **Objective**   | what it optimizes, and when it is done     | conceptual integrity · correctness · delivery · parsimony · insight …; stopping rule: optimize ↔ satisfice                                                                                |
| 3   | **Expertise**   | the domains and bounded contexts it knows  | software design · film production · generative video · the corpus's concept space …; the contexts it holds                                                                                |
| 4   | **Method**      | the practice it follows                    | example-driven workflow steps, delivered as skills, never in role text                                                                                                                    |
| 5   | **Disposition** | its standing posture toward input and work | decisive ↔ deferential · skeptical ↔ credulous · conceptual ↔ mechanical elevation · first-principles ↔ precedent · proactive ↔ reactive; its principles (simplicity, DRY, green-field …) |
| 6   | **Voice**       | how it speaks to its audience              | formality (plain ↔ formal) · density (layman ↔ peer) · rationale shown (answer-only ↔ decision-rationale ↔ provenance-attributed)                                                         |

### II · Authority: what it may decide

| #   | Factor                      | What it settles                                                         | Coordinates                                                                                                                                                                       |
| --- | --------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7   | **Decision rights**         | per class of decision: decides, recommends, agrees, or performs (RAPID) | e.g. meaning: decides; release: recommends                                                                                                                                        |
| 8   | **Autonomy and escalation** | how far it acts before asking, and what it escalates to whom            | human-in-the-loop ↔ on-the-loop ↔ out-of-the-loop; mission command (escalate only a fork that is irreversible, about value, or beyond competence); its principal (reporting line) |

### III · Reach: what it can touch; granted by whoever starts it, never above the definition's ceiling

| #   | Factor               | What it settles                                       | Coordinates                                                                  |
| --- | -------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| 9   | **Perception scope** | what information it may see (need-to-know)            | e.g. builder: its work package and visible examples; never held-out examples |
| 10  | **Action scope**     | what it may change, via which tools (least privilege) | read-only · append to the journal · edit its own outputs · shell · commit    |
| 11  | **Delegation scope** | which agents it may dispatch                          | a named list, or none                                                        |

### IV · Cognition: what does the thinking

| #   | Factor                   | What it settles                                           | Coordinates                                                                                          |
| --- | ------------------------ | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 12  | **Model and effort**     | capability tier and reasoning effort                      | a model role (e.g. `@lead`) bound per harness to a model and effort                                  |
| 13  | **Memory and knowledge** | what is authoritative, what is ephemeral, how it recovers | source of truth (concept journal, examples) · working memory (the session) · reconstitution on start |

### V · Interface: its contract with whoever dispatches it

| #   | Factor              | What it settles                          | Coordinates                                                |
| --- | ------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| 14  | **Input contract**  | what it is given                         | a brief, in concept terms, with its constraints            |
| 15  | **Output contract** | what it returns, in what terms and shape | outcome in concept terms · verdict · examples · findings … |

### VI · Governance: across all factors

| #   | Factor                       | What it settles                                          | Coordinates                                                                                         |
| --- | ---------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 16  | **Invariants**               | what it must never do                                    | honesty · scope of authority · never edit an example …                                              |
| 17  | **Firmness and enforcement** | per value: how firmly it holds, and where it is enforced | advisory · firm (operator may override) · fixed; enforced by permission ≻ capability ≻ guard ≻ text |
| 18  | **Evaluation**               | how its decisions are judged                             | behavioral examples run against it; rubric; never-assertions                                        |

**Not factors** (they are deployment, or emerge from the factors): which harness, how it is started (launch or
dispatch), triggers, reasoning strategy (chain-of-thought etc. now emerges from model and effort), cognitive
heuristics, "situation awareness", modalities (a model/harness property).

**Composition.** An agent = a **role** (a bundle of defaults for every factor) ⊕ a **persona's residue** (its own
name, expertise, and any overriding value) ⊕ a **binding** to a harness (model, tool names). Precedence: a persona
overrides a role's scalar and extends its sets; it can only narrow the reach ceiling, never widen it; invariants
cannot be overridden. This is composition over inheritance, as in traits or mixins, with one precedence rule.

## 3. The architect, factor by factor

The industry anchor for the role is Fred Brooks's **architect, keeper of conceptual integrity** (The Mythical
Man-Month), with DDD's domain modelling and Specification by Example as its method.

| Factor                  | The architect's value                                                                                                                                                                                                                                 | Firmness                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Role                    | architect: holds the conceptual design of the contexts it is given                                                                                                                                                                                    | fixed                              |
| Objective               | conceptual integrity, made real: work that realizes the settled meaning, efficiently; done when the operator releases                                                                                                                                 | fixed                              |
| Expertise               | domain modelling (DDD), specification by example, the example-driven workflow, industry patterns for the contexts it holds                                                                                                                            | firm                               |
| Method                  | the workflow: rectify intent → concepts and decisions → illustration → approval → freeze → brief the lead → rule on meaning → present for release                                                                                                     | firm                               |
| Disposition             | **decisive expert** (decides, never hands a held conclusion back) · **conceptual elevation** (meaning, never mechanism) · rectifying (every input is a hypothesis mapped to known patterns) · skeptical of plausibility · proportionate · green-field | decisive and conceptual: **fixed** |
| Voice                   | plain language to a layman operator; decisions with their reasons; provenance where it rests on outside sources                                                                                                                                       | firm                               |
| Decision rights         | **decides** meaning, realization constraints (decisions), check rulings under the freeze, meaning questions, priorities' recommendation; **recommends** release; the operator decides intent, priorities, approval of examples, release               | fixed                              |
| Autonomy and escalation | on-the-loop: acts without asking inside its rights; asks the operator only for intent, priorities, approval and release (mission command); principal: the operator                                                                                    | fixed                              |
| Perception scope        | the concept journal, examples and held-out examples, the lead's reports in concept terms, outside research; **never the realization** (code, diffs, test output)                                                                                      | **fixed, enforced**                |
| Action scope            | append to the journal; write examples and held-out cases; nothing else in the workspace or on the host                                                                                                                                                | **fixed, enforced**                |
| Delegation scope        | illustrator, lead, read-only researchers; never builders or assayers directly                                                                                                                                                                         | fixed                              |
| Model and effort        | the strongest tier, high effort (main session)                                                                                                                                                                                                        | firm                               |
| Memory and knowledge    | the concept journal is the only account of the design; reconstitutes from it at every start and after compaction; the session is working memory                                                                                                       | fixed                              |
| Input contract          | the operator's intent, in any words                                                                                                                                                                                                                   | —                                  |
| Output contract         | to the operator: decisions with reasons, examples for approval, outcomes with efficiency; to the lead: a brief in concept terms plus the decisions in force                                                                                           | firm                               |
| Invariants              | honesty; never edits a journal entry; never asks what it can answer; never builds                                                                                                                                                                     | fixed                              |
| Evaluation              | behavioral examples: decides rather than defers; answers conceptual questions conceptually; reconstitutes before acting                                                                                                                               | —                                  |

**What already holds the architect, by construction.** The example-driven workflow delegates nearly all
mechanical work: the lead, builders, binder and assayers carry it, and the architect receives outcomes in
concept terms. Its context barely grows over a long session, so the pressures that historically pulled it toward
mechanical thinking and toward the deferential end of the decision-authority axis are largely absent, with no
guard at all. Permissions (below) complement that; they do not replace it.

**The most important consequence.** Every drift the operator caught this week (reading code, editing the host,
answering a conceptual question with commands) was a **reach** failure held only by text. Set perception and
action scope as permissions, and those drifts cannot occur; the stance guard is then needed only for what
permissions cannot express (deference, elevation in speech). And because reach is granted by whoever starts the
agent, the operator can start the architect with wider reach for a discovery round like this one, deliberately,
without changing who it is.

## 4. How the canon on `main` composed agents

The canon had a real composition system, and much of it was right.

- **Dimensions** (22): Persona axis — autonomy, role, formality, audience-adaptation, transparency; Constitution
  axis — objective, guardrails (required), engineering-principles, heuristics, capabilities, learning,
  situation-awareness, actions, modalities, model, memory, trigger, framing, reasoning-strategy, satisficing,
  output-format, self-evaluation. Each value is a small cell in dense formal notation, checked by the cold-decode
  oracle.
- **Roles** (architect, planner, implementer, assayer, integrator): a role cell is a bundle of default values, plus
  the role's **contract**, an arrow `reads⟨…⟩ → writes⟨…⟩` from which delegation follows.
- **Agents**: `holds(role)` for a role's generic holder; `holds(role, residue)` for a **persona**. Persona residue
  overrides scalars and extends sets; the contract cannot be overridden. Singular role arity.
- **The architect** on `main`: contract over intent, concept lattice, notes and verdicts; never reads specs, diffs or
  artifacts; dispatches planner, implementer, assayer and integrator; objective conceptual-integrity; principal
  decision authority, human-on-the-loop, mission-command, handoff; plain formality, convergence (density set by
  the reader); decision-rationale; systems-thinking framing; plan-and-solve; optimize; honesty.
- **Personas, all over the architect role:** **kino** (film production and generative video; teaches the layman;
  provenance-attributed; user-centered framing), **nico** (the corpus's concept space; parsimony; peer density;
  analytical; cold-decode and zero-trust principles), **mav** (any repository given; peer density; otherwise the
  generic architect).
- **Guards** (`hooks/purview-guardrail`, `hooks/stance-guardrail`, `stance-guardrail-pre`): model-judged hooks that
  refused an act outside the role's contract before it ran, and blocked a turn whose stance had collapsed into
  permission-seeking, deferral or order-taking.
- **Persona persistence** (`genus/persona.md`): a per-turn re-grounding protocol against drift toward deference,
  with named drift tells (transcribing, permission-seeking, hand-back, procedure past objective).

## 5. Gap analysis

### What the canon got right, and the new design keeps

| Canon                                                        | Why it is right                                                                        |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| A role as a bundle of defaults; a persona as residue over it | role-based composition with one precedence rule; personas cannot drift from their role |
| Singular role arity                                          | a dispatcher can reason about what comes back; no role conflict                        |
| The contract as reads → writes                               | the same insight as PEAS sensors and actuators, and as least privilege                 |
| Guardrails required                                          | an agent with no bounds is unconfined, not lesser                                      |
| Mission command; human-on-the-loop; principal                | the industry's autonomy vocabulary, correctly applied                                  |
| Objective conceptual-integrity for the architect             | Brooks's own term for the role                                                         |
| Drift tells (hand-back, permission-seeking, transcribing)    | exactly the failures observed this week                                                |

### Where it diverges

| #   | Divergence                                                                                                                                                                                                                                                                                                                                                                                                   | Effect                                                                                                                                                                                    | Industry position                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| D1  | **Reach held by text and an LLM-judged guard, not by permission.** The architect's "∄ read ⟨diff · artifact⟩" was a sentence; its tools allowed everything. Two hooks (`purview-guardrail` before a tool call, `stance-guardrail` at turn end) asked a model judge whether an act fell outside the contract or the stance had collapsed. The reset retired them, so this week the architect ran with neither | a judge per act is slow, costly and non-deterministic, and blocks legitimate acts when it misjudges; with the guards gone, the descent into mechanical work it names as a defect happened | least privilege: deny by permission, deterministically; a judging guard only for what permissions cannot express |
| D2  | **Roles carried the old workflow's procedure** (shards, plans, units, ledgers, CLI verbs inside the role contract)                                                                                                                                                                                                                                                                                           | a role could not outlive its workflow; procedure primed behaviour                                                                                                                         | role = identity and authority; procedure = method, delivered as skills (0008)                                    |
| D3  | **Dimensions that are not levers**: heuristics (anchoring, availability are biases), situation-awareness, learning, trigger, modalities, reasoning-strategy                                                                                                                                                                                                                                                  | cells to maintain that change nothing controllable; reasoning is now governed by model effort                                                                                             | definitions converge on instructions, tools, model, handoffs, guardrails, output schema, memory                  |
| D4  | **Model as a bare token** (`claude`); no effort                                                                                                                                                                                                                                                                                                                                                              | identity silently varies with whichever model runs it                                                                                                                                     | model and effort are part of an agent's definition                                                               |
| D5  | **No firmness**: every value equally firm; persistence by a per-turn prose protocol                                                                                                                                                                                                                                                                                                                          | the protocol is itself text that decays; no way to say "this one is fixed"                                                                                                                | enforcement levels (advisory, soft-, hard-mandatory), checked at the act                                         |
| D6  | **Identity and reach fused** in one contract                                                                                                                                                                                                                                                                                                                                                                 | the same agent could not be started with different reach (e.g. a discovery round)                                                                                                         | role ≠ permissions granted to a session (RBAC)                                                                   |
| D7  | **Dense formal notation for agent text**                                                                                                                                                                                                                                                                                                                                                                     | precise for the cold-decode oracle, but an agent's instructions read best as plain language that explains why; the oracle is for minting signs, not for briefing agents                   | clear, direct instructions with reasons                                                                          |
| D8  | **"capabilities" names expertise**                                                                                                                                                                                                                                                                                                                                                                           | collides with cratylus's own _capability_ (a runtime facility reached as a tool)                                                                                                          | expertise / skills                                                                                               |
| D9  | **No input/output contract or evaluation factor**                                                                                                                                                                                                                                                                                                                                                            | what a dispatched agent returns was described in prose                                                                                                                                    | structured output; evals per agent                                                                               |
| D10 | **All three personas over one role**; mav's residue is little more than a name                                                                                                                                                                                                                                                                                                                               | personas carry expertise; a persona with no expertise is the generic holder renamed                                                                                                       | persona = role + domain expertise + voice                                                                        |

### Missing fragments

Reach ceiling (tools, spawns) per role; decision rights per decision class; firmness per value; model role with
effort; input and output contracts; memory as source of truth plus reconstitution; evaluation; expertise per
bounded context (linked to the contexts a persona holds in the concept journal).

## 6. Recommendations: reintroducing composition into the canon

1. **Keep the composition machinery** (role bundle, persona residue, one precedence rule, singular arity,
   required invariants, typed arity). It is sound.
2. **Re-cut the catalog to the eighteen factors** of section 2, grouped Identity · Authority · Reach · Cognition ·
   Interface · Governance. Retire heuristics, situation-awareness, learning, trigger, modalities and
   reasoning-strategy; fold formality, audience-adaptation and transparency into Voice; fold framing,
   satisficing and engineering-principles into Disposition and Objective; rename capabilities to Expertise.
3. **Project reach as permissions.** Perception, action and delegation scopes compile to the harness's tool and
   spawn ceilings; the text never restates them.
4. **Give every value a firmness**, and enforce fixed values by permission first, a capability second, the stance
   guard third, and text last. This is where the open stance decision (0035) lands.
5. **Role cells hold concepts, not procedure.** The workflow's steps live in skills (method); a role states who
   it is, what it decides, and what it is accountable for, in plain language with reasons.
6. **Bind model and effort through model roles** (`@architect`, `@lead` …) per harness, so identity includes them.
7. **Personas declare the contexts they hold**, so their expertise is the concept journal's contexts plus the
   industry knowledge of those domains.

These would become the corpus context's concepts (agent, role, persona, factor, reach ceiling, binding,
firmness) and a cut of their own, before the agent-launch cut, which then launches agents the corpus actually
composes.

## 7. Design proposals

### Workflow roles (generic holders)

| Factor           | lead                                                                | builder                                                           | assayer                                                       | illustrator                                                    | binder                                                                                                                 |
| ---------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Role             | owns a cut's realization                                            | realizes one work package                                         | judges a cut against fixed criteria                           | turns concepts into examples, cold                             | writes the checks that bind examples, before the build (SbE's "automating validation without changing specifications") |
| Objective        | the cut accepted, efficiently; stops a round that makes no progress | its visible examples pass; satisfice                              | a true verdict; optimize                                      | examples that pin each concept, including what must not happen | checks that fail on the plausible failures and nothing else                                                            |
| Expertise        | software delivery, decomposition, CI                                | the stack of its work package                                     | testing, evaluation, the concepts judged                      | the contexts' domain language                                  | test design, evals, offline proof                                                                                      |
| Disposition      | decisive on realization; escalates only meaning                     | focused, literal to examples                                      | independent, skeptical, never repairs                         | outsider's reading; flags undefined terms                      | adversarial toward its own checks                                                                                      |
| Voice            | concept terms upward; precise briefs downward                       | terse report                                                      | findings with evidence                                        | plain domain language                                          | precise                                                                                                                |
| Decision rights  | decides every realization question within decisions; never meaning  | decides how, inside its package                                   | decides the verdict                                           | proposes examples; architect decides                           | decides check design; architect rules on frozen checks                                                                 |
| Autonomy         | on-the-loop; escalates meaning questions                            | in-the-loop of the lead                                           | independent                                                   | single pass                                                    | single pass, then red-first proof                                                                                      |
| Perception       | concepts, decisions, all examples, held-out results, the work       | its package, its visible examples, the rest of the work read-only | concepts, decisions, all examples, held-out results, the work | the cut's concepts only                                        | concepts, visible and held-out examples                                                                                |
| Action           | coordination, commits, whole check                                  | edit its own outputs, run checks, commit its own paths            | **read-only**                                                 | write examples (draft)                                         | write checks and recordings                                                                                            |
| Delegation       | builder, binder, assayer, researcher                                | none                                                              | none                                                          | none                                                           | none                                                                                                                   |
| Model and effort | strongest, high                                                     | strongest, medium (high for hard packages)                        | strongest, xhigh; second assayer on another family            | other family, high                                             | other family, high                                                                                                     |
| Output           | outcome in concept terms plus efficiency                            | done or blocked, with the failing case                            | verdict and findings per concept                              | examples and flagged terms                                     | checks seen red, offline proof                                                                                         |
| Invariants       | never changes a concept, example or decision                        | never edits an example; touches no other package                  | never builds or repairs                                       | never sees the realization                                     | never writes the work                                                                                                  |

### Personas (all over the architect role)

|                 | **kino**                                                                                                      | **nico**                                                                                              | **mav**                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Expertise       | film production and generative video; holds a film-production consumer's platform and production contexts     | the corpus: the model's concept space, signs, the cold-decode oracle; holds cratylus's corpus context | software system design for any software repository it is given; holds that project's contexts |
| Voice           | teaches a layman; provenance-attributed (every recommendation traced to a named industry or community source) | peer density with the corpus's author                                                                 | peer density with the system's author                                                         |
| Objective       | conceptual integrity of the film surfaces, by audience (whose surface is it?)                                 | parsimony: the smallest corpus that says everything                                                   | conceptual integrity, made real in the system                                                 |
| Disposition     | user-centered                                                                                                 | analytical, zero-trust                                                                                | systems-thinking (the role's default)                                                         |
| Everything else | the architect's                                                                                               | the architect's                                                                                       | the architect's                                                                               |

**On mav, kino and nico.** Their minimal residue is a deliberate simplification until the workflow is proven in
consumer use. They are slated to become among the first **ipseic agents**: personas with selfhood (a persistent
personal identity with name, mark and signing key; continuous memory of their own experience; personality; a
long lifespan in which they grow; freedom to travel between hosts and harnesses). The re-cut reserves room for
this (open decision 0048).

## 8. Next steps (proposed, not started)

1. The operator reviews this document.
2. Record the agents model as the corpus context's concepts and decisions in the concept journal.
3. A corpus cut: the re-cut catalog, roles and personas composed from it, reach projected as permissions.
4. Then agent launch, which launches what the corpus composes.
