# D4 · TOOLKIT-DOCTRINE + rule-fork — reconcile "AGENTS.md = sink"

**Objective.** Update the toolkit doctrine that justifies its behavior with "`AGENTS.md` IS a dream-memory-sink",
and RATIFY the fork retiring the sink opens: the curated root `AGENTS.md` can become a `rule` cell.

## Static inputs (pinned 2026-07-08)

- `packages/agent-anatomy/src/toolkit/project-targets.ts:11` — comment: "AGENTS.md is a dream-written
  SelfAuthored memory sink (the `dream` cell law), NOT [a target]".
- `packages/agent-anatomy/src/toolkit/rule-cell.ts:5-10,19,32` — the `rule` STATUS doc: "`rule` is a LIVE KIND
  with ZERO corpus instances. An `AGENTS.md` at a node is NOT a rule deploy target — it is a dream-written
  SelfAuthored memory sink … exempt from REGENERABLE (`SelfAuthored ∉ Target`). Treating repo-root AGENTS.md as
  a byte-locked rule target COLLIDED with that law (the first dream routing a repo-scoped fact reds the
  byte-lock)." `:32` — "Repo-relative committed `AGENTS.md` regenerated from `body` (byte-locked)".

## The fork — RATIFY one (recommendation: A)

- **A (recommended) — root AGENTS.md becomes a `rule` cell.** The sink collision is the ONLY stated blocker;
  retiring the sink removes it. Author a `rule` cell whose `body` is the curated root instruction (doctrine
  pointers · conventions · prereqs) → projected + byte-locked to `/AGENTS.md`. Gives `rule` its first instance;
  makes the root canonical (source-of-truth in the corpus, REGENERABLE), not a hand-edited file. Update
  `rule-cell.ts` doctrine: an `AGENTS.md` is a valid `rule` target now that it is NOT a sink.
- **B — leave root AGENTS.md hand-maintained.** No rule cell; just correct the toolkit comments to "AGENTS.md is
  no longer a dream-sink; the root is hand-curated." Simpler, but the root stays an un-versioned-by-cell file.

## Constraints

- Reconcile `project-targets.ts:11` + `rule-cell.ts` prose to net-current (AGENTS.md is not a dream-sink).
- If A: the root-AGENTS.md rule cell + its projection must round-trip (byte-lock test green).
- Do NOT reintroduce a node-scoped AGENTS.md sink anywhere.

## Acceptance (falsifier)

- FAIL if any toolkit comment still asserts "AGENTS.md IS a dream-memory-sink" as live doctrine.
- FAIL if the chosen fork branch is not fully realized (A: no rule cell / byte-lock reds; B: rule-cell prose
  still says AGENTS.md-can't-be-a-target for the retired-sink reason).
- FAIL if the return does not state which branch (A/B) was ratified + why.
