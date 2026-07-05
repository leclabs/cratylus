# run-the-business (RTB)

**The standing plan.** Unlike a founding/initiative plan — a transient scaffold that retires once its
result is in the source of truth ([[plan-retirement]]) — RTB is **perpetual**. It is the durable home for
the live backlog and standalone tasks that don't warrant their own sharded plan. It never retires; tasks
flow through its state folders (`pending/ → ready/ → active/ → completed/`) and `completed/` is swept
periodically (git is the recovery net).

**Use it for.** One-off maintenance, small standalone tasks, and the surviving tails of retired
initiatives whose larger scaffold has been wound down but whose remaining work is still live. When a
cluster of RTB tasks grows into a coherent initiative, promote it back out into its own sharded plan.

## Status mirror

**Ready (frontier):** none — backlog below is pending prioritization.

**Pending:**

- `stance-guardrail-jurisdiction` — the judge must see the dispatch channel (tool_use payloads ·
  PreToolUse binding · dispatch-echo rubric class · observable fails-open). Lane: Mav + Nico.

_(Folded into `plans/canon-conformance/` — the source→`accept()` conformance initiative:
`standing-oracle-gate` → E1 acceptance-harness (the pre-land boundary; instrument at `toolkit/cold-oracle/`);
`human-docs-projection` → E2 project-human + S5; `readme-anatomy-nature-drift` → done (README is now the
thesis) + S5; `factor-principal-ic-standing` → S1 pattern-prover.)_

## Done — swept records (git + `completed/` are the fuller record)

- **✅ memory-session-isolation (memiso-0..3)** — concurrent-session memory collision fixed end-to-end:
  session-liveness registry + liveness-aware `read --for-session` / `drain --completed-only` + skill-layer
  lift (wake registers & liveness-gates orient, encode heartbeats, dream drains completed-only, handoff
  releases) + integration gate. Cross-`/clear` resume + cross-session consolidation preserved. Record:
  `completed/memiso-{0,1,2,3}-*.md`.

## See also

- `CLAUDE.md` — the standing-initiative context (lane split + acceptance discipline).
- `docs/warm-cold-acceptance-attestation.md` — the retired warm≡cold initiative's durable attestation.
