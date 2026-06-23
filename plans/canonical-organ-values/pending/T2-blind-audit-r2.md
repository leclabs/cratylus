# T2 blind-audit-r2

R=LLM. lead: Nico. dep: T1.

obj ≜ independently reproduce T1 with a **fresh** blind subagent set (same questions, no leakage, no sight of
R1) and **verify consistency** — a model-native enum should reproduce across independent draws.

do ≜ re-run the T1 fan-out with new clean agents; diff R2 vs R1 per organ (same open/closed verdict? same
value set modulo synonymy? same references?). Mark each organ **stable** (R1≈R2) or **divergent**.

acc ⊨ per-organ stability verdict recorded; divergent/low-confidence organs listed as T3 input. Audit only.
