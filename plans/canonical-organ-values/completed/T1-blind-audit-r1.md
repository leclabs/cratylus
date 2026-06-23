# T1 blind-audit-r1

R=LLM. lead: Nico.

obj ≜ recover, by **blind model introspection**, the model-native schema of each of the 24 agent organs —
**without leaking any current corpus value**. One blind subagent per organ.

organs (24) ≜ address · appraisal · charter · competence · comportment · construal · deliberation ·
disclosure · disposition-memory · effectors · enaction · gestalt · heuristics · instructions · ledger ·
mandate · percept · persona · provenance · register-fit · resolve · sensors · substrate · telos.

do ≜ per organ, spawn a CLEAN subagent given ONLY (a) the organ name, (b) a neutral functional gloss of that
dimension of an AI agent (no value hints), (c) the questions. Ask:

1. Is there a **canonical / industry-standard enumerated set** of values for this dimension? (open vs closed)
2. If closed: enumerate the canonical values, each with a **reference** (framework/paper/standard) and a
   one-line **justification**.
3. If open (free-form): say so explicitly, and name the _shape_ of values it takes.
4. Confidence (0–1) + what evidence would raise it.

structured output ≜ `{organ, openOrClosed, values:[{name, reference, justification}], confidence, evidenceNeeded}`.

acc ⊨ all 24 organs have an R1 verdict; results judged by Nico (flag thin/hand-wavy ones); R1 table recorded
in this task file before → `completed/`. NO corpus mutation in T1 (audit only).

## Outcome (done 2026-06-23)

See `decisions/0001-organ-classification.md`. 48 blind agents, 2 consistent rounds; raw in `decisions/audit-raw-r1r2.json`. 10 organs CLOSED, 14 OPEN; confidence high (no extra probe needed).
