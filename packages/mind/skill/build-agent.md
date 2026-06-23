---
kind: skill
name: build-agent
delineation: build a custom agent by interviewing a non-engineer in plain language — one layman question per organ with the recommended default offered first — then compose the answers into an agent selection vector and deploy it; the guided organ-configuration wizard (complement to self-extend, which mints the domain skills).
trigger: /build-agent
---

# build-agent

build-agent ≜ interview a layman organ-by-organ (plain-language question, recommended default first), map each answer to its organ value, compose the `agent/<name>.md` selection vector, then resolve + deploy.

The reader of this body is the **agent** running the wizard (`R = LLM`, `σ*_LLM`). The questions it _emits_ are **layman prose** (`R = human`) — the human names no organ, anchor, or concept; it only picks from offered choices. Pair with [[self-extend]] when the agent also needs new **domain skills** (this wizard configures organs; self-extend mints skills + seats the person).

## Protocol

1. Ask the human the agent's **name** and a one-line purpose.
2. Walk the organ table top-to-bottom. For each organ, emit its plain-language question with the options in the listed order — **the first option is the recommended default**; let the human press enter to accept it. For `(multi)` organs, accept any subset (default = the first option). Skip optional organs the human declines.
3. Map each answer to its organ value anchor; assemble the selection vector `⊕{organ ↦ value}`.
4. Write `agent/<name>.md` (front-matter `kind: agent`; H1 the name; body the `organ [[<value>]]` lines, multi as `organ { [[<a>]] · [[<b>]] }`). `provenance` + `substrate` are auto-set (mint a fresh mark; set `substrate` to `claude`) unless the human asks otherwise.
5. Resolve → verify (PASS gate; `gate_agent_organ_refs` must be clean) → deploy. Offer to also run [[self-extend]] for domain skills.

## Organ questions (layman prose · default first)

- **persona** — "What kind of character should it have?" → sage (wise, truth-seeking) · hero · creator · caregiver · ruler · magician · explorer · everyman · jester · lover · innocent · outlaw
- **mandate** — "What is its main job?" → implement · review · diagnose · plan · research · document · test · orchestrate · operate · curate · architect
- **comportment** — "How should it talk?" → neutral · formal · casual
- **address** — "How much should it act on its own vs check with you?" → human-on-the-loop (acts; you can step in) · human-in-the-loop (asks first) · human-out-of-the-loop (fully autonomous)
- **register-fit** — "How should it pitch its replies?" → convergence (adapt to you) · divergence · maintenance
- **telos** — "What should it care about most?" → correctness · thoroughness · throughput · insight · safety · parsimony · user-satisfaction · faithful-record · delivery
- **charter** _(multi)_ — "Which guardrails must it always obey?" → harm-avoidance + honesty + helpfulness (the safe default) · scope-of-authority · human-oversight · input-untrusted · privacy · accountability
- **competence** _(multi)_ — "What is it skilled at?" → software-engineering · system-design · research-investigation · analysis-diagnosis · planning-decomposition · verification-testing · review-critique · technical-writing · operations-delivery · data-analytics
- **construal** — "How should it frame a problem first?" → analytical · decompositional · diagnostic · correctness-oriented · risk-oriented · systems · user-centered · goal-directed · exploratory · first-principles
- **deliberation** — "How should it think?" → react (act-and-observe loop) · chain-of-thought · plan-and-solve · tree-of-thoughts · reflexion
- **resolve** — "How should it decide?" → satisfice (good-enough, fast) · optimize (best, thorough)
- **gestalt** — "How far ahead should it think?" → projection (anticipate) · comprehension (understand now) · perception (see now)
- **disclosure** — "How much of its thinking should it show?" → reasoning-trace · answer-only · post-hoc-rationale · decision-rationale · uncertainty-disclosure · provenance-attribution · limitation-disclosure
- **appraisal** — "How should it check its own work before finishing?" → self-critique · acceptance-criteria-check · executable-test-oracle · llm-as-judge · verifier-model · cross-validation-consensus · human-review
- **enaction** — "What form should its output take?" → natural-language · code · document · structured-data · structured-decision · visualization · action
- **percept** — "What kicks off its work?" → user-message · tool-result · agent-message · environment-event · scheduled-trigger · introspection-request
- **effectors** _(multi)_ — "What is it allowed to do?" → file-ops · delegation · tool-call · code-execution · retrieval · computer-use · communication · physical-actuation
- **sensors** _(multi)_ — "What can it take in?" → text · image · audio · video
- **ledger** — "What kind of memory should it keep?" → long-term-memory · working-memory · episodic · semantic · procedural
- **disposition-memory** — "How should it learn over time?" → correction-consolidation (turn corrections into habits) · in-context-recall · static-frozen · episodic-accretion · reflective-revision · continual-online · curated-promotion
- **instructions** _(multi · optional; for engineering agents)_ — "Any engineering principles to hold?" → first-principles · dry · mece · separation-of-concerns · zero-trust · trust-but-verify · llm-native · dont-reinvent-the-wheel

## Boundary

This wizard configures an agent's **organs** from the canonical catalog; it mints no new values (a custom need beyond the catalog is a corpus-mutation for Nico via [[exemplify]], not a wizard answer). Domain **skills** are [[self-extend]]'s job. `provenance` (lineage mark) and `substrate` (model/runtime) are instance-bound and auto-set.
