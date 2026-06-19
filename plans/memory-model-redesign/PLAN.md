# memory-model-redesign — PLAN

Status mirror; task files live under state folders. Charter: `AGENTS.md`.

## Status

**The model is settled and deployed fleet-wide (6/6 — the orient fix is live in prod), and the portable-memory runtime has landed:** `@leclabs/koine-episodic` (ULID JSONL store + dream routing + atomic compaction + the **markdown→JSONL migration converter** with a no-loss gate) and the git-backed fleet organ sync (symlink-into-store; deploy-safe, reversible, now `.jsonl`-aware). The koine IR fixture is refreshed. **`migrate-live-episodic` is ACTIVE** — its machinery is built and proven, blocked only on an Operator-created remote + a Nico protocol reconciliation (see Frontier). One feature remains deliberately deferred: the vault home.

## Frontier

- **migrate-live-episodic** · **Mav** build + **Nico** verify — **ACTIVE: feature built + proven end-to-end; only the live rollout tail remains.** Scope narrowed to **user (agent-global) only** — fleet cross-host sync + true mobility deferred to a future design (Operator, 2026-06-19; git-remote organ store was replication, set aside for a mesh/primary-home model). Branch `migrate-live-episodic` (98b8ed3, 71f8a15, e17f685; unmerged): the converter + `assertNoLoss` gate, the dependency-free `episodic` **encode CLI** (the tool-mediated encode affordance an LLM needs since it can't hand-mint a ULID), and the **reconciled `memory.md` Protocol** (was a storage leak naming `EPISODIC.md`/"append raw"; now `EPISODIC.jsonl`/"record one open record" — `verify.py` PASS, projects into every def). Proven: scratch home from a real EPISODIC.md → migrate (no-loss) → encode → read back; 61/61 green. **Remaining tail (gated):** merge → Nico ratifies the cell edit → corrective fleet redeploy (lands the protocol on live SOULs) → per-agent live migration at a session boundary, **Mav as canary first**, then the rest. Live mutation is the A4 reserved act — not started.
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
