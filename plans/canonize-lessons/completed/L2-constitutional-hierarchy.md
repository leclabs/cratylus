# L2 — encode the constitutional hierarchy (llm-native ≻ VISION ≻ MODEL, reconcile up)

**static (censused):** `CANON.md` (the governance index — `ρ=human`; lists VISION=why · MODEL=what · ENGINE=how) ·
`VISION.md` · `MODEL.md` (line 4 `reader ≜ LLM`; 37 COLD-BLIND; 50 REPAIR — already formalize llm-native) ·
`ENGINE.md` · `AGENTS.md` (the root instructions agents read) · the `cold-decode-oracle` + `llm-native` fragments
(`packages/agent-anatomy/src/organs/engineering-principles/`).

**lesson to encode (Operator, this session):** the apex source-of-truth is three artifacts — **llm-native** (the
core "how", the axiom) · **VISION** (the "what"/purpose, untouchable) · **MODEL** (the broad "how"/design). They
must be **internally consistent**, and their **confidence order is `llm-native ≻ VISION ≻ MODEL`** (a
confidence axis, NOT importance — VISION is the most important END; llm-native the most confident AXIOM; MODEL the
most revisable). **Reconciliation:** inter-artifact conflict resolves UP the order — revise **MODEL**, _surface_ a
**VISION** conflict (never unilaterally edit the untouchable), reconcile toward **llm-native**. Everything derived
(cells · skills · agents · plans · SOUL) must be consistent with the three.

**scope:** CENSUS the right home(s). This is a governance RULE agents APPLY (ρ=LLM) about the project's own
source-of-truth — but `CANON.md` is `ρ=human`. Place it where agents READ + APPLY it: extend `CANON.md`'s
"Relationship" with the confidence order + reconciliation for the human record, AND put the operative rule in a
ρ=LLM home agents actually read (the root `AGENTS.md` governance section, or a governance cell) — decide the seam
by what BINDS an agent at decision time. Do NOT restate the three artifacts' content (cite, don't copy — the
hierarchy is a pointer + an ordering, not a re-derivation).

**accept (falsifier):** the confidence order + reconciliation rule (revise-MODEL · surface-VISION · toward-llm-native)
is stated in a home an agent reads at decision time; a cold Ω\* read decodes "these three are the apex; on conflict
resolve up the confidence order"; no VISION/MODEL CONTENT is duplicated (pointer + ordering only); `pnpm typecheck`
unaffected; if a cell is used, `pnpm -C packages/agent-anatomy test` green.

**dep:** none.
