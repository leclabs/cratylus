# memory-model-redesign — PLAN

Status mirror; task files live under state folders. Charter: `AGENTS.md`.

## Status

The constitution rewrite is **done** (`redesign-memory-constitution`): the memory-management lifecycle now lives in one home (`identity-memory-stack`, retitled `# Memory`), the wake sequence is stated once, the two-axis routing model + 5 homes + voice heuristic + fleet-portability + JSONL build-spec are integrated, and `agent-know-thyself` / `episodic-encoding` / `work-is-project-scoped` are folded in and deleted. Verify PASS (incl. round-trip + reconstruct); blind-judge ACCEPT. The slug rename (`identity-memory-stack → memory`) is **done** (Mav, `c8c67ab`, Nico-reverified). Constitution-leads holds — the model + naming are settled; next is `fleet-redeploy` (consent-gated) to make it live, then the JSONL machinery (`jsonl-episodic-store` → routing-engine → fleet-sync) for the portability payoff.

## Frontier (ready)

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
- **rename-memory-cell** · Mav (delegated) — `identity-memory-stack → memory` global sweep: `git mv` the cell, `GENUS_ORGANS=("memory",)`, all wikilinks + toolkit/docs refs + the `.manifests/dream.json` R3 home_slug. Verify PASS (R1+R2+R3); WAKE projects into 11/11 agents; zero stale slug in source. Nico re-verified on `main` (`c8c67ab`). `graphify-out/` cache carved out → separate `/graphify` regen.
