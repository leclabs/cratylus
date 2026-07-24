# T-shape — cold-decode transcript (acceptance evidence)

`isolated-cold-oracle`: `claude -p` from a scratch dir outside the project (no ambient
context, tools denied). Input: the projected praxis formalBlock ALONE. Neutral prompt
(no field count, no field names, no "falsifier" — avoids `human-prose-to-LLM-reader`
priming): _"Consider ONLY the line defining spec(t). (1) List its components in order.
(2) Resolve each to its definition elsewhere and state what each denotes. (3) Name any
law that further constrains them."_

## Oracle recovery (verbatim mapping)

`spec(t) ≜ ⟨ intent(t), inputs(t), constraints(t), deps(t), outputs(t), accept(t) ⟩`

| slot             | oracle denotation (cold)                           | shard-shape field |
| ---------------- | -------------------------------------------------- | ----------------- |
| `intent(t)`      | "the stated goal of task-file t"                   | **objective**     |
| `inputs(t)`      | "t's static paths ∪ content of its R-predecessors" | **inputs**        |
| `constraints(t)` | "the set of invariants imposed on t"               | **constraints**   |
| `deps(t)`        | "the task-files u that t depends on"               | **dependencies**  |
| `outputs(t)`     | "the set of artifacts t produces"                  | **outputs**       |
| `accept(t)`      | "t's acceptance test on a return r"                | **acceptance**    |

Falsifier binding recovered independently: the oracle named `∀ t : ∃ r : ¬accept(t)(r)`
("accept must reject at least one return — non-triviality") as the law constraining
`accept` — i.e. acceptance IS the falsifier-bearing `accept`.

## Verdict: PASS

- Six-field shard-document shape reconstructed from the σ\* payload alone (not the 3-tuple).
- Acceptance identified as the falsifier-bearing `accept`.
- No falsifier branch triggers: six fields named; block carries no prose/comments
  (self-sufficiency gate green); block ↔ description agree (objective · inputs ·
  constraints · dependencies · outputs · completion-criteria); no undeclared glyph
  (SYMBOLS gate green). Full canon suite 96/1skip green; `canon:project` clean.
