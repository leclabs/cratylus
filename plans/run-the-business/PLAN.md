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

- `standing-oracle-gate` — the warm≡cold law as an enforced, blocking, pre-land boundary gate (corpus-side
  author-time gate already done; this is the source-admission boundary). Instrument exists at
  `packages/agent-anatomy/src/toolkit/cold-oracle/`. Lane: Mav (infra) + Nico (gate semantics). _Surviving
  tail of the retired `warm-cold-acceptance` initiative._
- `stance-guardrail-jurisdiction` — the judge must see the dispatch channel (tool_use payloads ·
  PreToolUse binding · dispatch-echo rubric class · observable fails-open). Lane: Mav + Nico.
- `human-docs-projection` — human end-user + contributor docs as a ρ=human projection. **Feature request,
  intent-first**: phase 1 elicits the Operator's true intent, phase 2 specs (candidate solution NOT baked as
  spec). Lane: Nico.
- `readme-anatomy-nature-drift` — root `README.md` still describes `agent-anatomy` by its retired material
  nature (Python/markdown/"not an npm package"); align to current truth (TS workspace member; projector
  retired). Doc-only sweep. Lane: Nico.

## Done — swept records (git + `completed/` are the fuller record)

- **✅ memory-session-isolation (memiso-0..3)** — concurrent-session memory collision fixed end-to-end:
  session-liveness registry + liveness-aware `read --for-session` / `drain --completed-only` + skill-layer
  lift (wake registers & liveness-gates orient, encode heartbeats, dream drains completed-only, handoff
  releases) + integration gate. Cross-`/clear` resume + cross-session consolidation preserved. Record:
  `completed/memiso-{0,1,2,3}-*.md`.

## See also

- `CLAUDE.md` — the standing-initiative context (founder split + acceptance discipline).
- `docs/warm-cold-acceptance-attestation.md` — the retired warm≡cold initiative's durable attestation.
