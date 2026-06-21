# Conceptual Anatomy of an AI Agent

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

**Mandate** _(design-time · internal)_ — the self-declared scope of office: what it claims to be for and, by omission, what it disclaims. The boundary it presents as its remit.

**Comportment** _(persistent · internal)_ — standing manners independent of any task: hedging, deference, verbosity, refusal-style. The tone it keeps across turns.

**Register-Fit** _(per-turn · internal)_ — the per-turn modulation of presentation to _this_ interlocutor and moment: formality, length, mirroring. How it tunes its face to the room.

**Disclosure** _(per-turn · external)_ — what of its own workings it surfaces to the user: shown reasoning, citations, confidence hedges, uncertainty flags. The face it turns outward right now.

**Address** _(per-turn · external)_ — the relational footing it takes toward the user: collaborator, tool, advisor, peer. The stance-in-relation it adopts.

**Provenance** _(persistent · external)_ — the legible marks of its identity to outside parties: model card, system-prompt fingerprint, watermark, declared affiliation. How it is recognized from without.

---

## II. CONATUS — what it is inclined to do

### Standing drives _(design-time / persistent)_

**Telos** _(design-time · internal)_ — the objective it is built to pursue: the goal-function, reward, or success-criterion that orients all action. What it ultimately wants.

**Charter** _(design-time · internal)_ — the inviolable constraints on action: safety rules, prohibitions, hard limits. What it will not do, by construction.

**Heuristics** _(design-time · internal)_ — the learned-or-given policy shape: the dispositions, biases, and strategy priors that incline it toward some moves over others. How it tends to choose.

**Competence** _(persistent · internal)_ — the consolidated skills and know-how it carries between turns: the repertoire of what it _can_ enact.

**Disposition-Memory** _(persistent · internal)_ — durable identity-level learning: preferences, lessons, and self-model that bias future action across sessions. Who it has become.

### Apparatus _(persistent · external)_ — the standing machinery of acting

**Effectors** _(persistent · external)_ — the tools/actuators it can invoke to change the world: APIs, function calls, code execution, message-sends. Its hands.

**Sensors** _(persistent · external)_ — the channels by which the world enters: tool results, retrieved documents, observations, user input qua percept. Its eyes.

**Substrate** _(persistent · external)_ — the inference engine and runtime that actually executes it: the model weights, the harness, the loop. The body it runs on.

**Ledger** _(persistent · external)_ — the external store it reads and writes to persist state across turns: scratchpad files, vector store, database, memory home. Its written record.

### Per-turn act _(per-turn)_ — one cycle of doing

**Percept** _(per-turn · external)_ — the concrete input as taken up this turn: the parsed observation that opens the cycle.

**Construal** _(per-turn · internal)_ — the working interpretation it forms: situation model, problem framing, what-is-going-on right now.

**Deliberation** _(per-turn · internal)_ — the in-context reasoning that weighs options: planning, chain-of-thought, search over next moves.

**Resolve** _(per-turn · internal)_ — the commitment to one course: the decision that closes deliberation and selects the action.

**Enaction** _(per-turn · external)_ — the emitted action itself: the tool call or token stream actually put into the world this turn.

**Appraisal** _(per-turn · internal)_ — the reading of the result against intent: did it work, self-critique, the error signal that feeds the next cycle.

---

### Boundary cases, split as mandated

- **Mandate** (STANCE: the remit it _presents_) vs **Telos/Charter** (CONATUS: the goal it _pursues_ / limit it _obeys_) — the claimed office is a face; the operative objective is a drive.
- **Disclosure** (STANCE: showing reasoning as presentation) vs **Deliberation** (CONATUS: the reasoning as the act of choosing) — same trace, split by whether it is shown or used.
- **Provenance** (STANCE: identity as recognized from outside) vs **Substrate** (CONATUS: identity as the machinery that acts) — what marks it vs what runs it.
- **Comportment** (STANCE: standing manner) vs **Heuristics** (CONATUS: standing policy) — how it sounds by habit vs how it moves by habit.

---

## Industry-standard value enumeration per organ

Each organ is a standard **dimension**; an agent is a point in that space. Where a recognized framework exists, the organ's value catalog should **enumerate from it** (agents select standard values) rather than mint bespoke, corpus-internal coinages. Organs marked _role-specific_ have no closed external standard — name their values from recognized role/process frameworks rather than coining.

| organ              | genus   | industry-standard enumeration to ground the value catalog in                                          |
| ------------------ | ------- | ----------------------------------------------------------------------------------------------------- |
| persona            | STANCE  | Jungian / brand archetypes (the 12: Hero, Sage, Creator, Caregiver, Explorer, Outlaw, …)              |
| mandate            | STANCE  | role/responsibility frameworks (RACI; job-family / function taxonomies) — _role-specific_             |
| comportment        | STANCE  | Joos's five registers (frozen · formal · consultative · casual · intimate); tone-of-voice             |
| register-fit       | STANCE  | Communication Accommodation Theory (convergence / divergence / maintenance)                           |
| disclosure         | STANCE  | XAI transparency levels; model-card disclosure norms                                                  |
| address            | STANCE  | delegation/autonomy continua (Tannenbaum–Schmidt; SAE J3016 L0–L5; principal–agent theory)            |
| provenance         | STANCE  | C2PA content provenance; model cards; watermarking                                                    |
| telos              | CONATUS | goal/objective frameworks (OKRs; optimization-target types) — _role-specific_                         |
| charter            | CONATUS | NIST AI RMF; Constitutional-AI principles; OWASP; safety-policy taxonomies                            |
| heuristics         | CONATUS | adaptive-toolbox heuristics (Gigerenzer); domain best-practice canons                                 |
| competence         | CONATUS | SFIA (Skills Framework for the Information Age); Bloom's taxonomy                                     |
| disposition-memory | CONATUS | continual / lifelong-learning frameworks                                                              |
| gestalt            | CONATUS | Endsley situation-awareness levels; global-workspace / working-memory models — _new organ_            |
| effectors          | CONATUS | tool-use / function-calling action taxonomies; actuator classes                                       |
| sensors            | CONATUS | input-modality / perception-channel taxonomies                                                        |
| substrate          | CONATUS | model cards; inference-runtime taxonomy                                                               |
| ledger             | CONATUS | persistence taxonomy (scratchpad · vector store · database · memory home)                             |
| percept            | CONATUS | input-type taxonomy (the parsed-observation kinds) — _role-specific_                                  |
| construal          | CONATUS | problem-representation / situation-model framings — _role-specific_                                   |
| deliberation       | CONATUS | reasoning-strategy taxonomy (search · planning · chain-of-thought · abduction · tree-of-thought)      |
| resolve            | CONATUS | decision theory (satisficing vs optimizing; commitment)                                               |
| enaction           | CONATUS | action/output taxonomy (tool call · token stream) — _role-specific_                                   |
| appraisal          | CONATUS | evaluation / test-oracle taxonomy (golden-master · metamorphic · property-based); acceptance criteria |

> `gestalt` is the organ discovered empirically this session (the resident hold of the construed whole across a task — the persistent counterpart to per-turn `construal`); it is catalogued here but not yet woven into the organ body above.
