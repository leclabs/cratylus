# dream-node-sink-retire

**Status: SPEC (praxis) — authored, not executed.** Captures the memory-protocol redesign the Operator
directed after clearing every accreted `AGENTS.md` node-sink. Execution deferred to a future session.

## Intent

**Retire the `AGENTS.md@node` memory-sink route.** `dream` currently routes node-scoped knowledge + next-steps
to an `AGENTS.md` at each node; that route is the accretion factory — the sinks fill with content that
duplicates the source of truth (the typed cells + `VISION`/`MODEL`/`ENGINE`/`CANON`) and then rots. The
Operator's test: _nothing should be STORED in an `AGENTS.md` that is readable from the source of truth_ — and on
inspection almost nothing survives it. Collapse to:

- **One curated root `AGENTS.md`** — hand-maintained, minimal: doctrine pointers · working conventions ·
  prerequisites. Not a memory sink; never dream-written.
- **No node-scoped memory-sink `AGENTS.md`.** `dream` stops writing them. `wake` stops expecting them.
- A genuinely **non-derivable operational gotcha** (e.g. "editing `memory.md` needs a `make-base` regen") lives
  as a **comment at the code site** it governs — where it cannot drift from what it describes — never a sidecar.

This aligns the memory system with the parsimony discipline the canon already enforces (the source is the
authority; do not accrete a second copy).

## Design decisions (ratify + refine at execution)

- The plan record stays `PLAN.md` + task-files (that IS the source of truth for a plan). The
  `plan-agents-md-is-memory` law is retired with the node-sink route — a plan carries no `AGENTS.md`.
- Agent-intrinsic memory is UNAFFECTED: `SEMANTIC`/`PROCEDURAL`/`EPISODIC` (in `~/.claude/agents/<name>/`) are
  the agent's own stores, not node sinks. Only the `AGENTS.md@node` route retires.
- `dream`'s route becomes `{ SEMANTIC · PROCEDURAL · vault · EPISODIC · drop }` — the `AGENTS-node` target is
  removed. A cross-project lesson still generalizes to `PROCEDURAL` under the projection-dedup bar; a
  node-local fact that is NOT in source and IS worth keeping goes to a code-site comment, else `drop`.

## Shards

`pending/`:

- **D1 · DREAM-ROUTE** — `src/skills/dream.ts` formalBlock: drop `AGENTS-node` from the `route` codomain + the
  routing laws; `node(i)=plan|project|package ⇒ …AGENTS.md` lines removed; keep SEMANTIC/PROCEDURAL/vault/drop.
- **D2 · MEMORY-PROTOCOL** — `src/genus/memory.md` `## Protocol` (→ every SOUL's `## Memory Protocol`): remove
  the `AGENTS.md@node` routing language; state the one-curated-root rule + the code-site-comment rule for
  gotchas. Re-run `tsx src/toolkit/make-base.ts` (the `## Protocol` genus regen gotcha).
- **D3 · DEPENDENT-SKILLS** — `wake` (orient no longer reads node/plan `AGENTS.md` as a memory sink; reads
  `PLAN.md` + source), `praxis` (retire the `plan-agents-md-is-memory` law; a plan dir carries no `AGENTS.md`),
  `handoff` (praxis-sync touches `PLAN.md` only). Grep the corpus for `AGENTS.md@node` / `AGENTS-node` /
  `plan-agents-md` and reconcile every reference.
- **D4 · VERIFY** — `pnpm test` + `project` + a `dream` dry-run confirming no route targets `AGENTS.md`; the
  reader-density / accept gates green; no dangling reference to the retired route.

## See also

`src/skills/dream.ts` · `src/genus/memory.md` · `src/skills/{wake,praxis,handoff}.ts` · the memory-organ home
(`~/.claude/skills/memory`). Origin: Operator directive (session 3287f321) after clearing the node-sinks.
