# run-the-business (RTB)

**The standing plan.** Unlike a founding/initiative plan — a transient scaffold that retires once its
result is in the source of truth ([[plan-retirement]]) — RTB is **perpetual**. It is the durable home for
the live backlog and standalone tasks that don't warrant their own sharded plan. It never retires; tasks
flow through its state folders (`pending/ → ready/ → active/ → completed/`) and `completed/` is swept
periodically (git is the recovery net).

**Use it for.** One-off maintenance, small standalone tasks, and the surviving tails of retired
initiatives whose larger scaffold has been wound down but whose remaining work is still live. When a
cluster of RTB tasks grows into a coherent initiative, promote it back out into its own sharded plan.

## ⚡ Highest priority — memory-session-isolation (sub-DAG, do first)

Fixes a live defect: two concurrent nico sessions in one node collide in memory — orient binds a plan a
live sibling is executing (owner-blind `active/` scan), and `read --under node` bleeds a live sibling's
forward next-steps in as the reader's own. Isolation axis must be session **liveness**, not node alone.
Governing principle: raw working residue is session-owned-while-live; cross-session sharing happens ONLY
via consolidation (drain → stores); completed residue is inheritable, live-other residue is invisible.

```
wave 0 (DONE):    memiso-0 session-liveness-registry           [foundation ✓]
wave 1: memiso-1 episodic read+drain liveness-aware  DONE ✓
        memiso-2 orient+dream liveness-gated bind     [ready · dep memiso-0 ✓]
wave 2 (pending): memiso-3 integration gate                    [dep memiso-1 ✓, memiso-2]
```

**Waves 0–1 code landed.** The liveness registry (`src/session.ts` + `session` verbs) and the
liveness-aware `read --for-session` / `drain --completed-only|--for-session` (memiso-1) are live in
`agent-memory`: a reader excludes live-OTHER records (own + completed + sessionless pass), a drain retains
live-OTHER while consolidating all completed sessions together. Remaining: memiso-2 lifts this to the
skill layer — orient's plan-bind gated on a plan `owner` stamp, dream's drain routed through the
completed-only path.

DoD: concurrent sessions don't collide (orient reports-not-binds a live-owned plan; read excludes
live-other records) WHILE cross-`/clear` inherit + cross-session consolidation are preserved; the
originally-reported collision no longer reproduces. Provenance: authored cold from `blank` by
nico-outside; injected. Commit/push GATED to the Operator.

## Status mirror

**Ready (frontier · ⚡):**

- `memiso-2-orient-liveness-gate` — orient's plan-bind + dream gated on session liveness. Lane: Nico.

**Pending:**

- `memiso-3-integration-gate` — closes the sub-DAG (dep memiso-1 ✓, memiso-2). Lane: Nico.
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
