# memory-model-redesign — PLAN

Status mirror; task files live under state folders. Charter: `AGENTS.md`.

## Status

**All buildable work is done and Nico-reverified.** The model is settled, deployed fleet-wide (6/6 — the orient fix is live in prod), and the full portable-memory runtime has landed: `@leclabs/koine-episodic` (ULID JSONL store + dream routing + atomic compaction) and the git-backed fleet organ sync (symlink-into-store; deploy-safe, reversible). The koine IR fixture is refreshed. Two items remain, **both deliberately held**, not pending work: the consent-gated migration and a deferred vault feature.

## Frontier (ready — both HELD)

- **migrate-live-episodic** · **Mav** build + **Nico** verify — **HELD: consent-gated + Operator prerequisite.** Convert live agents' EPISODIC.md → jsonl and adopt the organ sync, no loss. Rewrites live fleet memory (the A4 reserved act) and needs a private remote the Operator creates (`gh repo create <you>/agent-organs --private`). Unblock = Operator creates the remote + gives explicit go; then per-agent backup → convert → verify-no-loss, first agent approved before the rest.
- **vault-reference-home** · **Mav** — **HELD: deferred.** The Obsidian vault as the cold 5th home. Speculative until a real vault exists to integrate; revisit when there's a concrete need.

## Backlog (pending)

_(none.)_

## Completed

- **redesign-memory-constitution** · Nico — one `memory` home, two-axis routing, fold (−3 cells), thin skills, MECE satellites, 5 homes, JSONL spec. Verify PASS, blind-judge ACCEPT.
- **rename-memory-cell** · Mav — `identity-memory-stack → memory` global sweep. Nico re-verified.
- **fleet-redeploy** · Nico — new `memory` Protocol on all 6 hosts, sha256-verified; sidecars preserved.
- **jsonl-episodic-store** · Mav — `@leclabs/koine-episodic`: ULID + open encode + `resolveFile` portability. 24 tests; Nico re-ran.
- **dream-routing-engine** · Mav — routing + atomic land-then-compact, injectable classifier. 35 tests; Nico re-ran + read the crash test.
- **fleet-sync-organs** · Mav — git-backed organ store + symlink adoption; G1–G5 pass. Nico re-ran the two-host fixture + confirmed `local.py:34` seed-if-absent is symlink-safe.
- **refresh-koine-ir-fixture** · Mav — regenerated `mind.koine.json` to the live corpus (11 agents + 10 skills, dead ref gone); test assertions updated. Nico re-ran the round-trip suite.
