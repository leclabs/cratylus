# vocab-depalimpsest

**The plan.** Align the corpus's vocabulary to the source-of-truth model along TWO axes:

1. **Retire the palimpsest FOUNDING lexicon** (`polis`/`politeia`/`mind-society`/`society`/`commons`/`oikos`/
   `founder`) across source, docs, fixtures, and agent memory → the concrete component vocabulary
   (`catalog`·`project`·`fleet`·`init`·`scaffold`). The retired→concrete map is `MAPPING.md`; the accept-gate's
   palimpsest-token guard already enforces it in cell bodies and STAYS.
2. **Re-signify the CORE anatomy vocabulary** (cold-panel decided, `MAPPING.md §FLAGGED`): the config axis
   `organ` → **`dimension`** (3/3); the genus families `STANCE`/`CONATUS` → **`Persona`/`Constitution`**; VALUE keeps
   **`fragment`**, corpus keeps **`anatomy`**. This is the larger spine change; it runs AFTER the plugin-cli design
   locked (now met) so the spine isn't churned mid-design.

Owner: this session.

> **Re-census (2026-07-21).** The founding-lexicon retirement (`polis`/`founder`/…) is **substantially already
> done** across `packages/` + `docs/` (prior work + C2) — the plan's older census had rotted (`census-not-format`).
> Net-current remaining after C1/C2 + A1: **B1 collapses** (narrative retired; identifiers → plugin-cli P6) · **A2
> closed** (fixture vocab-clean) · **A3 is dream-time** (per-agent, ongoing). Effectively complete bar the P6-folded
> identifiers and the continuous memory alignment.

## Streams (MECE by surface)

- **Stream A — independent prose/fixture/memory sweep (`ready/`):** founding-lexicon sites NOT owned by the CLI
  redesign. `A1` prose/ideation · `A2` golden fixture (+ retired memory model) · `A3` agent-memory dream-time
  alignment. No cross-shard deps — dispatch concurrently.
- **Stream B — the founding-CLI layer (SPLIT: content now · identifiers deferred).** `B1` the CONTENT/doctrine
  strings (polis/founder narrative in a founded project's `AGENTS.md`/`PLAN.md` + help + comments) is wrong NOW,
  user-visible → a READY shard here. The API IDENTIFIERS (`found` verb · `FoundingTemplate`/`foundPolis`/
  `polisFoundingTemplate`/`runFound`) are RESTRUCTURED by the plugin-cli redesign → FOLDED into
  `plans/plugin-cli/P6` (not double-worked here).
- **Stream C — core-vocab re-signification (`pending/`):** `C1` the genus rename + `C2` the umbrella
  `organ`→`dimension` core-vocab pass (C2 folds C1 into one coherent sweep).

## State

| shard                     | surface                             | state   | concern                                                                             |
| ------------------------- | ----------------------------------- | ------- | ----------------------------------------------------------------------------------- |
| A1 prose/ideation         | docs (research + ideation)          | done    | organ→dimension in live docs; anatomy study PRESERVED as record (verified)          |
| A2 golden fixture         | ir-bridge fixture                   | done    | vocab + retired memory-model already clean; stale `ideas/` = deferred fixture-maint |
| A3 memory align           | agent stores                        | ongoing | dream-time, per-agent (incl. nico's own); aligns at each agent's next wake          |
| B1 founding content       | founding-template bodies + CLI help | → P6    | narrative already retired; founding IDENTIFIERS restructured by plugin-cli P6       |
| C1 genus rename           | `Genus` axis + dimension READMEs    | done    | STANCE/CONATUS → Persona/Constitution; persona→archetype (verified)                 |
| C2 core-vocab (organ→dim) | anatomy spine (types/dirs/tests)    | done    | organ→dimension + fragment (+ genus + persona→archetype) — LANDED, verified         |

## Gates + open forks (Operator-owned)

- **C1/C2 — nico-sequenced, NOT Operator-gated** (corrected): execution is reversible (git) + not-outward, so it
  is nico's to sequence and drive to done-locally — `push-reserved` gates only the final push, never the
  re-signification. Run C2 BEFORE plugin-cli P1–P7 so they build on the clean vocab. The ONLY Operator-owned
  surface is the published BRAND name (below).
- **C1 persona-collision sub-fork — CLOSED** (cold 3/3): genus `Persona`, the colliding agent field `persona` →
  `archetype`. Folded into C2's pass.
- **BRAND / package names — cold-DISCOVERED, not Operator-preference** (corrected: cratylism applies to package
  names too). Minimal-prompt discovery: `forge` (engine) is cold-VALIDATED (keep); the corpus/brand name is
  genuinely UNDER-DETERMINED (`anatomy` not refuted; `AgentKit`/`kit` neither clearly fit nor clearly disfavored
  under neutral framing). Where the semantic evidence is genuinely silent between near-equivalents, the ONLY
  Operator-owned layer is the external tie-breaker — npm-scope/trademark/published-version continuity — NOT the
  fitness. A robust discovery would firm this up; nico recommends keeping `agent-anatomy` on continuity.

## Notes

- Each shard is blind-dispatchable (static · scope · falsifiable accept: grep + cold Ω\* read + typecheck/test).
- Stream-A/B shards EXCLUDE the `Genus`-axis tokens and the accept-gate guard list (Stream C owns those).
- ρ = LLM throughout.
