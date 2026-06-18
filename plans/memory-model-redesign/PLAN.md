# memory-model-redesign — PLAN

Status mirror; task files live under state folders. Charter: `AGENTS.md`.

## Status

The redesign is essentially **done**. The model is settled, deployed fleet-wide (6/6, the orient fix live in prod), and the full machinery has landed and is Nico-reverified: `@leclabs/koine-episodic` (ULID JSONL store + dream routing + atomic compaction) and the git-backed **fleet organ sync** (symlink-into-store; deploy-safe, reversible, proven on fixtures). Only the **consent-gated finale** remains — migrating live agents onto the JSONL store + adopting the organ sync — plus two lower-priority hygiene tasks.

## Frontier (ready)

- **migrate-live-episodic** · **Mav** build + **Nico** verify — **consent-gated.** Convert live agents' EPISODIC.md → jsonl and adopt the organ sync, no loss. Needs Operator go (touches real memory + needs a private remote per the fleet-organs runbook).
- **vault-reference-home** · **Mav** — the Obsidian vault as the cold 5th home; MEMORY→vault graduation. _(lower priority)_
- **refresh-koine-ir-fixture** · **Mav** — regenerate the stale `mind.koine.json` (dead ref + 7-vs-10 skills); update test length assertions. _(lower priority)_

## Backlog (pending)

_(none.)_

## Completed

- **redesign-memory-constitution** · Nico — one `memory` home, two-axis routing, fold (−3 cells), thin skills, MECE satellites, 5 homes, JSONL spec. Verify PASS, blind-judge ACCEPT.
- **rename-memory-cell** · Mav — `identity-memory-stack → memory` global sweep. Nico re-verified.
- **fleet-redeploy** · Nico — new `memory` Protocol on all 6 hosts, sha256-verified; sidecars preserved.
- **jsonl-episodic-store** · Mav — `@leclabs/koine-episodic`: ULID + open encode + `resolveFile` portability. 24 tests; Nico re-ran.
- **dream-routing-engine** · Mav — routing (voice→organ, scope→instance, split, drop) + atomic land-then-compact, injectable classifier. 35 tests; Nico re-ran + read the crash test.
- **fleet-sync-organs** · Mav — git-backed organ store + symlink adoption; G1–G5 pass (cross-host, no leak, conflict-surfacing, reversible, deploy-safe). Nico re-ran the two-host fixture + confirmed the `local.py:34` seed-if-absent guard is symlink-safe.
