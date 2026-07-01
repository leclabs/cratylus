# Conceptual Anatomy of an AI Agent

> **The contract is the TypeScript; this is its projection.** As of T0.1
> (`plans/koine-absorbs-mind`), the anatomy IS a **TypeScript type system** —
> `packages/agent-forge/src/anatomy/index.ts`, exported from `@leclabs/agent-forge/anatomy`. Those types are the
> source of truth (genus · classification · arity · the 24-organ `Organ` union · `Fragment` · `Agent` ·
> `Skill`); this prose is their human-readable mirror. Keep them consistent; the `.ts` wins on conflict.

> **Reference knowledge — do not re-derive.** This is the canonical **σ\*\_LLM** render of the agent's
> conceptual anatomy: the MECE organ set (**STANCE / CONATUS**). Full research home in obsidian
> `Reference/context-engineering/conceptual-anatomy-of-an-ai-agent/`; produced blind by a fresh model
> under the verified σ\*\_R-session prompt (2026-06-20).

---

# Anatomy of an AI Agent

Filing axis (MANDATORY): every anchor is filed **STANCE** (how it comes across — its presented face) or **CONATUS** (what it is inclined to do — its drive to act). Anything load-bearing on both is split.

---

## I. STANCE — how the agent comes across

**Persona** _(design-time · internal)_ — the stable character it projects: voice, register, name, the "who" a reader infers. How it sounds before it does anything.

**Role** _(design-time · internal)_ — the self-declared scope of office: what it claims to be for and, by omission, what it disclaims. The boundary it presents as its remit.

**Formality** _(persistent · internal)_ — standing manners independent of any task: hedging, deference, verbosity, refusal-style. The tone it keeps across turns.

**Audience-Adaptation** _(per-turn · internal)_ — the per-turn modulation of presentation to _this_ interlocutor and moment: formality, length, mirroring. How it tunes its face to the room.

**Transparency** _(per-turn · external)_ — what of its own workings it surfaces to the user: shown reasoning, citations, confidence hedges, uncertainty flags. The face it turns outward right now.

**Autonomy** _(per-turn · external)_ — the relational footing it takes toward the user: collaborator, tool, advisor, peer. The stance-in-relation it adopts.

**Provenance** _(persistent · external)_ — the legible marks of its identity to outside parties: model card, system-prompt fingerprint, watermark, declared affiliation. How it is recognized from without.

---

## II. CONATUS — what it is inclined to do

### Standing drives _(design-time / persistent)_

**Objective** _(design-time · internal)_ — the objective it is built to pursue: the goal-function, reward, or success-criterion that orients all action. What it ultimately wants.

**Guardrails** _(design-time · internal)_ — the inviolable **values/safety constitution**: helpful·honest·harmless, the FATE/CAI principle cluster. What it will not violate, by construction. (Sourced scope: guardrails is the _values_ layer — not engineering directives.)

**Engineering-Principles** _(design-time · internal)_ — the standing **engineering directives / working principles** the agent operates by (the system-prompt "instructions" component): e.g. first-principles, zero-trust, DRY. How it is told to work. (Added — sourcing showed guardrails=values and heuristics=cognitive leave an agent's working-principles homeless; this organ is their home.)

**Heuristics** _(design-time · internal)_ — the **cognitive fast-and-frugal shortcuts / biases** it decides by under uncertainty (Gigerenzer / Kahneman–Tversky): recognition, take-the-best, satisficing, anchoring. How it shortcuts. (Sourced scope: the _cognitive-shortcut_ enum — distinct from engineering directives, which are Engineering-Principles.)

**Capabilities** _(persistent · internal)_ — the consolidated skills and know-how it carries between turns: the repertoire of what it _can_ enact.

**Learning** _(persistent · internal)_ — durable identity-level learning: preferences, lessons, and self-model that bias future action across sessions. Who it has become.

### Apparatus _(persistent · external)_ — the standing machinery of acting

**Actions** _(persistent · external)_ — the tools/actuators it can invoke to change the world: APIs, function calls, code execution, message-sends. Its hands.

**Modalities** _(persistent · external)_ — the channels by which the world enters: tool results, retrieved documents, observations, user input qua percept. Its eyes.

**Model** _(persistent · external)_ — the inference engine and runtime that actually executes it: the model weights, the harness, the loop. The body it runs on.

**Memory** _(persistent · external)_ — the external store it reads and writes to persist state across turns: scratchpad files, vector store, database, memory home. Its written record.

### Per-turn act _(per-turn)_ — one cycle of doing

**Trigger** _(per-turn · external)_ — the concrete input as taken up this turn: the parsed observation that opens the cycle.

**Framing** _(per-turn · internal)_ — the working interpretation it forms: situation model, problem framing, what-is-going-on right now.

**Reasoning-Strategy** _(per-turn · internal)_ — the in-context reasoning that weighs options: planning, chain-of-thought, search over next moves.

**Satisficing** _(per-turn · internal)_ — the commitment to one course: the decision that closes deliberation and selects the action.

**Output-Format** _(per-turn · external)_ — the emitted action itself: the tool call or token stream actually put into the world this turn.

**Self-Evaluation** _(per-turn · internal)_ — the reading of the result against intent: did it work, self-critique, the error signal that feeds the next cycle.

---

### Boundary cases, split as mandated

- **Role** (STANCE: the remit it _presents_) vs **Objective/Guardrails** (CONATUS: the goal it _pursues_ / limit it _obeys_) — the claimed office is a face; the operative objective is a drive.
- **Transparency** (STANCE: showing reasoning as presentation) vs **Reasoning-Strategy** (CONATUS: the reasoning as the act of choosing) — same trace, split by whether it is shown or used.
- **Provenance** (STANCE: identity as recognized from outside) vs **Model** (CONATUS: identity as the machinery that acts) — what marks it vs what runs it.
- **Formality** (STANCE: standing manner) vs **Heuristics** (CONATUS: standing policy) — how it sounds by habit vs how it moves by habit.

---

## Industry-standard value enumeration per organ

Each organ is a standard **dimension**; an agent is a point in that space. Where a recognized framework exists, the organ's value catalog should **enumerate from it** (agents select standard values) rather than mint bespoke, corpus-internal coinages. Organs marked _role-specific_ have no closed external standard — name their values from recognized role/process frameworks rather than coining.

| organ               | genus   | industry-standard enumeration to ground the value catalog in                                          |
| ------------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| persona             | STANCE  | Jungian / brand archetypes (the 12: Hero, Sage, Creator, Caregiver, Explorer, Outlaw, …)              |
| role                | STANCE  | role/responsibility frameworks (RACI; job-family / function taxonomies) — _role-specific_             |
| formality           | STANCE  | Joos's five registers (frozen · formal · consultative · casual · intimate); tone-of-voice             |
| audience-adaptation | STANCE  | Communication Accommodation Theory (convergence / divergence / maintenance)                           |
| transparency        | STANCE  | XAI transparency levels; model-card disclosure norms                                                  |
| autonomy            | STANCE  | delegation/autonomy continua (Tannenbaum–Schmidt; SAE J3016 L0–L5; principal–agent theory)            |
| provenance          | STANCE  | C2PA content provenance; model cards; watermarking                                                    |
| objective           | CONATUS | goal/objective frameworks (OKRs; optimization-target types) — _role-specific_                         |
| guardrails          | CONATUS | NIST AI RMF; Constitutional-AI principles; OWASP; safety-policy taxonomies                            |
| heuristics          | CONATUS | adaptive-toolbox heuristics (Gigerenzer); domain best-practice canons                                 |
| capabilities        | CONATUS | SFIA (Skills Framework for the Information Age); Bloom's taxonomy                                     |
| learning            | CONATUS | continual / lifelong-learning frameworks                                                              |
| situation-awareness | CONATUS | Endsley situation-awareness levels; global-workspace / working-memory models — _new organ_            |
| actions             | CONATUS | tool-use / function-calling action taxonomies; actuator classes                                       |
| modalities          | CONATUS | input-modality / perception-channel taxonomies                                                        |
| model               | CONATUS | model cards; inference-runtime taxonomy                                                               |
| memory              | CONATUS | persistence taxonomy (scratchpad · vector store · database · memory home)                             |
| trigger             | CONATUS | input-type taxonomy (the parsed-observation kinds) — _role-specific_                                  |
| framing             | CONATUS | problem-representation / situation-model framings — _role-specific_                                   |
| reasoning-strategy  | CONATUS | reasoning-strategy taxonomy (search · planning · chain-of-thought · abduction · tree-of-thought)      |
| satisficing         | CONATUS | decision theory (satisficing vs optimizing; commitment)                                               |
| output-format       | CONATUS | action/output taxonomy (tool call · token stream) — _role-specific_                                   |
| self-evaluation     | CONATUS | evaluation / test-oracle taxonomy (golden-master · metamorphic · property-based); acceptance criteria |

> `situation-awareness` is the organ discovered empirically this session (the resident hold of the construed whole across a task — the persistent counterpart to per-turn `framing`); it is catalogued here but not yet woven into the organ body above.
