# memory-model-redesign — PLAN

Status mirror; task files live under state folders. Charter: `AGENTS.md`.

## Status

The constitution rewrite is **done** (`redesign-memory-constitution`): the memory-management lifecycle now lives in one home (`identity-memory-stack`, retitled `# Memory`), the wake sequence is stated once, the two-axis routing model + 5 homes + voice heuristic + fleet-portability + JSONL build-spec are integrated, and `agent-know-thyself` / `episodic-encoding` / `work-is-project-scoped` are folded in and deleted. Verify PASS (incl. round-trip + reconstruct); blind-judge ACCEPT. Two follow-ups surfaced and were added: the slug rename (`identity-memory-stack → memory`, toolkit-coupled = Mav) and a koine IR fixture refresh. Constitution-leads holds — machinery follows.

## Frontier (ready)

- **rename-memory-cell** · **Mav** — `identity-memory-stack → memory` as one global sweep (composer `GENUS_ORGANS` + refs). _(dep cleared)_
- **jsonl-episodic-store** · **Mav** — EPISODIC.jsonl: ULID, append-open encode, `resolveFile(scope,path)` portability. _(dep cleared)_
- **vault-reference-home** · **Mav** — the Obsidian vault as the cold 5th home; MEMORY→vault graduation. _(dep cleared; lower priority)_
- **refresh-koine-ir-fixture** · **Mav** — regenerate the stale `mind.koine.json` (dead ref + 7-vs-10 skills); update test length assertions. _(dep cleared)_
- **fleet-redeploy** · **Nico** — redeploy the new `memory` constitution to all 6 hosts. _(dep cleared; consent-gated)_

## Backlog (pending)

- **dream-routing-engine** · **Mav** — the routing pass: voice→organ, scope→instance, split, drop, atomic compact. _(dep: jsonl-episodic-store)_
- **fleet-sync-organs** · **Mav** — one logical agent-global store synced across hosts; no absolute paths. _(dep: jsonl-episodic-store)_
- **migrate-live-episodic** · **Mav** build + **Nico** verify — convert live agents' EPISODIC.md → jsonl, no loss. _(dep: jsonl-episodic-store, dream-routing-engine; consent-gated)_

## Completed

- **redesign-memory-constitution** · Nico — one-pass consolidation: one `memory` home, two-axis routing, fold (−3 cells) + thin skills + MECE satellites + 5 homes + JSONL spec. Verify PASS, blind-judge ACCEPT, danglers swept (incl. the `seeds.py` SELF seed template → `[[continuity-thread]]`).
