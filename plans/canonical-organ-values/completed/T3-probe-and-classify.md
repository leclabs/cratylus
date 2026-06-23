# T3 probe-and-classify

R=LLM. lead: Nico. dep: T2.

obj ≜ resolve every divergent/low-confidence organ and emit the **authoritative classification**: each organ
**open** or **closed**, closed organs with their **canonical enum** (members + reference), open organs flagged
for T4.

do ≜ for each unstable organ, probe with further blind rounds demanding **evidence** (named framework, enum
membership, citation) until either (a) a stable closed enum emerges or (b) it is clearly open/free-form. Nico
adjudicates with `σ*_LLM` (the recognized industry-standard term IS the canonical value; a bespoke slug is
not). Cross-check against the existing catalog ONLY at adjudication time (never during blind rounds).

acc ⊨ a complete table `organ → {open|closed, canonical-enum?, reference}` with high confidence; the open-set
(input to T4) and the closed-set (input to T5) named. Audit/decision only — no cell writes yet.

## Outcome (done 2026-06-23)

See `decisions/0001-organ-classification.md`. 48 blind agents, 2 consistent rounds; raw in `decisions/audit-raw-r1r2.json`. 10 organs CLOSED, 14 OPEN; confidence high (no extra probe needed).
