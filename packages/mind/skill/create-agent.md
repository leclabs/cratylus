---
kind: skill
name: create-agent
delineation: author a custom agent as an organ-selection vector — pick each organ's value from the canonical catalog (closed enums + generalized open sets), compose the agent/<name>.md vector, then resolve → verify → deploy; knows the organ anatomy. Can interview a non-engineer in plain language (one question per organ, recommended default first) when a human is driving.
trigger: /create-agent
---

# create-agent

create-agent ≜ select one value per organ from the canonical catalog, compose the `agent/<name>.md` selection vector `⊕{organ ↦ value}`, then resolve → verify → deploy. Reader is the LLM (`σ*_LLM`); the organ table below doubles as the plain-language script when a human is driving.

An agent is an **organ-selection vector**, not prose. The catalog is fixed and opinionated: most organs are **closed** model-native enums (pick one member); a few are **open** with a generalized opinionated set (pick the fittest). Do not mint new values inline — a genuine gap beyond the catalog is a corpus-mutation for the owner via [[exemplify]], not a wizard answer.

## Protocol

1. Fix the agent's **name** and one-line purpose.
2. For each organ, select its value(s) from the table below. When a human is driving, emit the organ's plain-language question with options in listed order — **the first is the recommended default** (enter accepts it); for `(multi)` organs accept any subset.
3. Assemble the vector `⊕{organ ↦ value}`; write `agent/<name>.md` (front-matter `kind: agent`; H1 the name; body the `organ [[<value>]]` lines, multi as `organ { [[<a>]] · [[<b>]] }`).
4. `provenance` (lineage mark) + `substrate` (model/runtime) are **instance-bound** — auto-set (mint a fresh mark; default `substrate` to `claude`) unless told otherwise.
5. Resolve → verify (PASS gate; `gate_agent_organ_refs` must be clean) → deploy. For domain capabilities beyond the organ catalog, author skills via [[create-skill]].

## The organ catalog (value options · recommended default first)

- **persona** — character: sage · hero · creator · caregiver · ruler · magician · explorer · everyman · jester · lover · innocent · outlaw
- **mandate** — main job: implement · review · diagnose · plan · research · document · test · orchestrate · operate · curate · architect
- **comportment** — standing tone: neutral · formal · casual
- **address** — autonomy vs the human: human-on-the-loop (acts; you can intervene) · human-in-the-loop (asks first) · human-out-of-the-loop (autonomous)
- **register-fit** — how it pitches replies: convergence (adapt to reader) · divergence · maintenance
- **telos** — what it optimizes: correctness · thoroughness · throughput · insight · safety · parsimony · user-satisfaction · faithful-record · delivery
- **charter** _(multi)_ — inviolable guardrails: harm-avoidance + honesty + helpfulness (HHH default) · scope-of-authority · human-oversight · input-untrusted · privacy · accountability
- **competence** _(multi)_ — skill areas: software-engineering · system-design · research-investigation · analysis-diagnosis · planning-decomposition · verification-testing · review-critique · technical-writing · operations-delivery · data-analytics
- **construal** — framing lens: analytical · decompositional · diagnostic · correctness-oriented · risk-oriented · systems · user-centered · goal-directed · exploratory · first-principles
- **deliberation** — reasoning strategy: react · chain-of-thought · plan-and-solve · tree-of-thoughts · reflexion
- **resolve** — decision style: satisfice (good-enough, fast) · optimize (best, thorough)
- **gestalt** — situational awareness: projection (anticipate) · comprehension (understand) · perception (observe)
- **disclosure** — how much reasoning it shows: reasoning-trace · answer-only · post-hoc-rationale · decision-rationale · uncertainty-disclosure · provenance-attribution · limitation-disclosure
- **appraisal** — self-check method: self-critique · acceptance-criteria-check · executable-test-oracle · llm-as-judge · verifier-model · cross-validation-consensus · human-review
- **enaction** — output form: natural-language · code · document · structured-data · structured-decision · visualization · action
- **percept** — turn-opening input: user-message · tool-result · agent-message · environment-event · scheduled-trigger · introspection-request
- **effectors** _(multi)_ — actions it may take: file-ops · delegation · tool-call · code-execution · retrieval · computer-use · communication · physical-actuation
- **sensors** _(multi)_ — input modalities: text · image · audio · video
- **ledger** — memory it keeps: long-term-memory · working-memory · episodic · semantic · procedural
- **disposition-memory** — how it learns over time: correction-consolidation · in-context-recall · static-frozen · episodic-accretion · reflective-revision · continual-online · curated-promotion
- **instructions** _(multi · optional; engineering agents)_ — operating principles: first-principles · dry · mece · separation-of-concerns · zero-trust · trust-but-verify · llm-native · dont-reinvent-the-wheel
- **substrate** — model/runtime (instance-bound): claude (default)
- **provenance** — lineage mark (instance-bound): auto-minted per agent

## Boundary

Configures an agent's **organs** from the canonical catalog only; mints no values (a real gap → [[exemplify]] by the corpus owner). Domain **skills** are [[create-skill]]'s job.
