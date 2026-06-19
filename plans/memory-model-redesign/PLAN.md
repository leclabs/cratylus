# memory-model-redesign — PLAN

Status mirror; task files live under state folders. Charter: `AGENTS.md`.

## Status

**The model is settled and deployed fleet-wide (6/6 — the orient fix is live in prod), and the portable-memory runtime has landed:** `@leclabs/koine-episodic` (ULID JSONL store + dream routing + atomic compaction + the **markdown→JSONL migration converter** with a no-loss gate) and the git-backed fleet organ sync (symlink-into-store; deploy-safe, reversible, now `.jsonl`-aware). The koine IR fixture is refreshed. **`migrate-live-episodic` is ACTIVE** — its machinery is built and proven, blocked only on an Operator-created remote + a Nico protocol reconciliation (see Frontier). One feature remains deliberately deferred: the vault home.

## Frontier

- **migrate-live-episodic** · **Mav** build + **Nico** verify — **ACTIVE: machinery landed, blocked on two external gates.** The converter (`packages/episodic/src/migrate.ts`: `extractItems` + `migrateFile` + the `assertNoLoss` no-loss gate) is built, 49/49 green, and proven on a non-destructive dry-run of a real live EPISODIC.md; `fleet-organs.sh` now syncs `EPISODIC.jsonl` transition-safely (G1–G5 still pass). Branch `migrate-live-episodic`, unmerged. **Unblock needs:** (1) **Operator** — `gh repo create <namespace>/agent-organs --private` (verified absent under both namespaces) + explicit go; (2) **Nico** — reconcile the verbatim `## Protocol` (line 57 names `EPISODIC.md`; runtime is `EPISODIC.jsonl`), which entails a 6-host redeploy. Then per-agent backup → convert → verify-no-loss, first agent approved before the rest. Live mutation is the A4 reserved act — not started.
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
