# memory-model-redesign — PLAN

Status mirror; task files live under state folders. Charter: `AGENTS.md`.

## Status

The model is **settled and live**: the consolidated `memory` home + two-axis routing shipped, the slug rename landed, and the new Protocol is **deployed fleet-wide (6/6 hosts, sha256-verified)** — the orient fix is in production. The portability foundation also landed: **`@leclabs/koine-episodic`** (`packages/koine/episodic`) — ULID JSONL store, append-open encode, `resolveFile` portability, 24 tests green, Nico-reverified. Next is the routing + sync machinery on top of the store, then the consent-gated live migration.

## Frontier (ready)

- **dream-routing-engine** · **Mav** — the routing pass: voice→organ, scope→instance, split, drop, atomic compact. _(dep cleared by jsonl-episodic-store)_
- **fleet-sync-organs** · **Mav** — one logical agent-global store synced across hosts; no absolute paths. _(dep cleared by jsonl-episodic-store)_
- **vault-reference-home** · **Mav** — the Obsidian vault as the cold 5th home; MEMORY→vault graduation. _(lower priority)_
- **refresh-koine-ir-fixture** · **Mav** — regenerate the stale `mind.koine.json` (dead ref + 7-vs-10 skills); update test length assertions.

## Backlog (pending)

- **migrate-live-episodic** · **Mav** build + **Nico** verify — convert live agents' EPISODIC.md → jsonl, no loss. _(dep: dream-routing-engine; consent-gated)_

## Completed

- **redesign-memory-constitution** · Nico — one-pass consolidation: one `memory` home, two-axis routing, fold (−3 cells) + thin skills + MECE satellites + 5 homes + JSONL spec. Verify PASS, blind-judge ACCEPT.
- **rename-memory-cell** · Mav (delegated) — `identity-memory-stack → memory` global sweep (cell, `GENUS_ORGANS`, refs, R3 manifest). Verify PASS; Nico re-verified on `main`.
- **fleet-redeploy** · Nico — new `memory` Protocol deployed to all 6 hosts (fire · forge · spark · ash · upmav · upgoose), both kinds; every `nico.md` sha256-matches the render; sidecars preserved.
- **jsonl-episodic-store** · Mav (delegated) — `@leclabs/koine-episodic`: ULID + append-open encode + `resolveFile` portability. 24 tests green; Nico re-ran them on `main`.
