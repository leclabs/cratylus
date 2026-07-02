# remediation-fanout

**Depends on** `formalize-reader-model` + `reader-density-gate` (bar + gate first). Densify every R=LLM
artifact to the bar. **Execution model: fan out to subagents — one per cell/cluster — with nico as the
ACCEPTANCE JUDGE, not the author.** This distributes the load and fixes the failed solo-sequential-pass
pattern. Fits a Workflow: fan-out densify → nico verify.

## Inputs (read these — blind-dispatchable)

- **The bar (worked exemplar):** the 4 already-densified definiens — `src/organs/role/curate.ts`,
  `objective/parsimony.ts`, `transparency/decision-rationale.ts`, `capabilities/research-investigation.ts`
  (~25% each, CE∧ME, signifier-first). Match this level.
- The reader model + the gate — outputs of `formalize-reader-model` + `reader-density-gate` (deps).
- Verify: `reader-density-gate`, projection-stability, `tsc`.

## Shards (by artifact class — the vertical slices; dispatch each to a subagent, nico judges)

- **Organ definiens catalog** — bar proven on 4 (curate / parsimony / decision-rationale /
  research-investigation); apply to the rest of the catalog.
- **Genus protocols** — `ideas/memory.md`, `ideas/persona.md` (the ~44% verbatim block), per the `verbatim`
  resolution from `formalize-reader-model`.
- **Agent bodies / vectors** — after the `explicit-omit-to-inherit` null-sentinel lands.
- **Agent↔agent prompt templates** — nico's delegation prompts included.

## Judge criteria (nico, per shard)

CE∧ME · signifier-first (σ\* + residue only) · passes `reader-density-gate` · meaning preserved
(round-trip ≽). Reject and return, don't hand-fix.

## Acceptance

- Every R=LLM artifact passes the gate; nico **judged** each shard (did not hand-author); projection-stability
  green; a projected SOUL measurably denser with no meaning lost.

## Deliverable (accepted 2026-07-01; both shards judged, gates re-run by judge)

- **Shard A (genus):** `ideas/{memory,persona}.md ## Protocol` re-authored R=LLM; base.ts regenerated
  (make-base.ts); REGISTER_RATCHET emptied (healed-pin law two-sided-proven); nico SOUL 10035→9289 B,
  genus share 44.7%→40.3%; meaning residue ∅ (operative laws verified present by judge read).
- **Shard B (definiens catalog):** 83/153 cells densified (words −17.1%), 70 already-conforming left
  alone; definiens-only discipline diff-verified; guardrails CE-complete (judge spot-read).
- **Judge-closed residue:** genus-level agent↔agent ρ=LLM law added to `ideas/persona.md ## Protocol`
  (covers delegation-organ-less agents; projected into all 11 SOULs — extend-reach's residue closed).
- **Shard C (agent bodies) RE-HOMED:** blocked on `explicit-omit-to-inherit`
  (run-the-business) — densify agent vector bodies AFTER the null-sentinel refactor lands; rider added there.
- Final tree: 28/28 (reader-density + reader-reach + symbols + skill-shape + projection-stability +
  agent-delta) · typecheck · lint · build green.
