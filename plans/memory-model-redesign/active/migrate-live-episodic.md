# migrate-live-episodic

**Owner.** Mav (build) + Nico (verify). **Deps.** jsonl-episodic-store, dream-routing-engine. **Consent-gated** —
touches live agent memory. **State: ACTIVE — machinery landed; blocked on two external gates (below).**

**What.** Convert the existing live agents' markdown `EPISODIC.md` → `EPISODIC.jsonl` across the fleet (nico, mav,
and the other 9 agents). Preserve content; lose nothing in the conversion.

**Machinery DONE (branch `migrate-live-episodic`, not yet merged).**

- `packages/episodic/src/migrate.ts` — the content-preserving converter: `extractItems` (the one source of truth
  for "what is a memory item" — top-level bullets + their continuations under `## ` sections; preamble + HTML
  comments are scaffolding, dropped), `migrateMarkdown`/`migrateFile` (emit ordered ULID records, never delete the
  source), and `assertNoLoss` (the no-loss gate: items recovered from records must equal items parsed from the
  markdown, in order, or it throws _before_ any write). 14 tests; package green 49/49; build + typecheck + biome clean.
- **Proven on real data:** non-destructive dry-run over my own live `~/.claude/agents/mav/EPISODIC.md` — 3 source
  items → 3 records, no-loss PASS, nothing written live.
- `fleet-organs.sh` now syncs `EPISODIC.jsonl` as well as `.md` (transition-safe via the existing `[ -e ]`/`[ -L ]`
  guards; G1–G5 fixture still passes). No presumption about the final filename — both coexist during rollout.

**BLOCKED — two external gates (neither is Mav's to settle):**

1. **Operator** — the organ-sync remote does not exist (verified absent under `lcaraccioli` and `leclabs`). Adopt
   needs `gh repo create <namespace>/agent-organs --private` + SSH reachable from all 6 hosts. Namespace is the
   Operator's call.
2. **Nico (constitution)** — `memory.md`'s verbatim `## Protocol` (line 57) names EPISODIC `EPISODIC.md` and the
   encode step says "append raw events," but the runtime is a JSONL record log named `EPISODIC.jsonl`
   (`store.ts` `DEFAULT_EPISODIC_PATH`). The migration renames the file → the protocol prose + encode/dream mechanism
   must reconcile, which entails a 6-host redeploy. Mav surfaced this; it is Nico's cell + model.

**Exit criteria.**

- Every live agent's EPISODIC is valid JSONL; a wake + dream cycle works post-migration.
- No content dropped — `assertNoLoss` diff of the distilled residue before/after (machinery: DONE).
- Operator consent + remote obtained before touching live memory; Nico verifies the no-loss gate himself.
- Per-agent rollout: backup → convert → verify-no-loss; **first agent approved before the rest.**
