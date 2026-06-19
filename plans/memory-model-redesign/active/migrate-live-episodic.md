# migrate-live-episodic

**Owner.** Mav (build) + Nico (verify). **Deps.** jsonl-episodic-store, dream-routing-engine. **Consent-gated** —
touches live agent memory. **State: ACTIVE — feature built + proven end-to-end; only the live rollout tail remains.**

**What.** Convert the live agents' markdown `EPISODIC.md` → `EPISODIC.jsonl`, preserving content, and make the JSONL
log operable (encode + wake/dream) under a reconciled protocol. **Scope: user (agent-global) only** — fleet
cross-host sync + true mobility are deferred to a future design (Operator, 2026-06-19; the git-remote organ store was
a replication design, set aside until a mesh/primary-home model is considered).

**Built + proven (branch `migrate-live-episodic`: 98b8ed3, 71f8a15, e17f685; unmerged).**

- **Converter** `packages/episodic/src/migrate.ts` — `extractItems` (sole source of truth for "what is a memory
  item"), `migrateFile` (ordered ULID records, source never deleted), `assertNoLoss` (round-trip item-set gate,
  throws before any write).
- **Encode affordance** `packages/episodic` bin (`episodic`) — `encode` mints the ULID + appends an open record (an
  LLM cannot hand-mint a ULID, so encode must be a tool call), `read`, `migrate`. Dependency-free.
- **Protocol reconciled** `memory.md` `## Protocol` — was a storage leak (named `EPISODIC.md`, "append raw"); now
  names `EPISODIC.jsonl` and "record each salient event as one open record". `verify.py` PASS (round-trip +
  reconstruct R1–R3); projects into every agent def + wake/dream/handoff.
- **Proven end-to-end on real data:** a scratch home seeded from a live `EPISODIC.md` → migrate (5 items, no-loss) →
  encode (the protocol's "record an event") → read back 6 → source preserved. 61/61 package tests green.
- `fleet-organs.sh` `.jsonl`-aware (transition-safe; G1–G5 pass) — dormant while cross-host sync is deferred.

**Remaining — the live rollout tail (gated, not started):**

1. **Merge** the branch.
2. **Nico ratifies** the `memory.md` cell edit (his constitution domain; done under Operator delegation).
3. **Corrective fleet redeploy** — the reconciled Protocol must land on live SOULs (every host still says
   `EPISODIC.md`). Reversible; the one broad act.
4. **Per-agent live migration**, canary-first: at a **session boundary** (not mid-session — converting your own live
   EPISODIC mid-flight saws off the protocol you're running), backup → `episodic migrate` → `assertNoLoss` →
   delete `.md`. **Mav goes first** as the approved canary; the rest follow on the same proof.

**Exit criteria.**

- Every live agent's EPISODIC is valid JSONL; a wake + dream cycle works post-migration.
- No content dropped — `assertNoLoss` diff of the distilled residue before/after (machinery: DONE, proven).
- Operator consent obtained before touching live memory; Nico verifies the no-loss gate himself.
- Per-agent rollout: backup → convert → verify-no-loss; **first agent (Mav) approved before the rest.**
