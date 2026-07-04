# run-the-business (RTB)

**The standing plan.** Unlike a founding/initiative plan — a transient scaffold that retires once its
result is in the source of truth ([[plan-retirement]]) — RTB is **perpetual**. It is the durable home for
the live backlog and standalone tasks that don't warrant their own sharded plan. It never retires; tasks
flow through its state folders (`pending/ → ready/ → active/ → completed/`) and `completed/` is swept
periodically (git is the recovery net).

**Use it for.** One-off maintenance, small standalone tasks, and the surviving tails of retired
initiatives whose larger scaffold has been wound down but whose remaining work is still live. When a
cluster of RTB tasks grows into a coherent initiative, promote it back out into its own sharded plan.

## ✅ memory-session-isolation (sub-DAG) — COMPLETE (memiso-0..3)

The concurrent-session collision is fixed end-to-end. Registry (`agent-memory` `src/session.ts` +
`session` verbs; per-session file, `live ⇔ registered ∧ ¬released ∧ (now−lastBeat) < 2h`,
concurrency-safe by construction) · liveness-aware `read --for-session` / `drain --completed-only`
(memiso-1) · skill-layer lift (memiso-2: wake registers + liveness-gates orient on a `plans/<plan>/.owner`
stamp, encode heartbeats, dream reads/drains completed-only, handoff releases, the governing principle in
every SOUL genus) · end-to-end integration gate (memiso-3: real-tool A/B/C scenario). The
originally-reported collision — a fresh wake executing a live session's plan — no longer reproduces;
cross-`/clear` resume + cross-session consolidation preserved. Record: `completed/memiso-{0,1,2,3}-*.md`.

## Status mirror

**Ready (frontier):** none — the memiso sub-DAG is done. The backlog below is pending prioritization.

**Pending:**

- `resignify-nico-provenance-charter` — raise nico's Provenance organ VALUE from prose to the R=LLM
  charter form, UPSTREAM in the composer source. Enhancement, not a defect (prose already passes
  warm≡cold); oracle-gated dogfood. Lane: Nico.
- `stance-guardrail-jurisdiction` — the judge must see the dispatch channel (tool_use payloads ·
  PreToolUse binding · dispatch-echo rubric class · observable fails-open). Lane: Mav + Nico.
- `human-docs-projection` — human end-user + contributor docs as a ρ=human projection. **Feature
  request, intent-first**: captured as an external hypothetical; phase 1 elicits the Operator's true
  intent, phase 2 specs (candidate solution NOT baked as spec). Lane: Nico.
- `readme-anatomy-nature-drift` — root `README.md` still describes `agent-anatomy` by its retired
  material nature (Python/markdown/"not an npm package"); align to current truth (TS workspace
  member; projector retired). Doc-only sweep. Lane: Nico.

## See also

- `CLAUDE.md` — the standing-initiative context (founder split + acceptance discipline).
