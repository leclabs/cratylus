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

| shard                     | surface                             | state   | concern                                                                    |
| ------------------------- | ----------------------------------- | ------- | -------------------------------------------------------------------------- |
| A1 prose/ideation         | docs + organ READMEs                | ready   | founding vocab → concrete in prose (judgment per site)                     |
| A2 golden fixture         | ir-bridge fixture                   | ready   | founding vocab + stale SELF/MEMORY/vault model → net-current               |
| A3 memory align           | agent stores                        | ready   | nico verified clean; dream-time self-align directive for the fleet         |
| B1 founding content       | founding-template bodies + CLI help | ready   | polis/founder NARRATIVE → concrete; API identifiers deferred to plugin-cli |
| C1 genus rename           | `Genus` axis + organ READMEs        | pending | STANCE/CONATUS → Persona/Constitution; coupled persona-member sub-fork     |
| C2 core-vocab (organ→dim) | anatomy spine (types/dirs/tests)    | pending | organ→dimension + fragment; folds C1; **static needs 825-token re-census** |

## Gates + open forks (Operator-owned)

- **C1/C2 scope gate:** pulling the core-vocab re-signification into execution scope is the Operator's green-light
  (a large spine rename). The signification itself is DECIDED (nico) — only scope-entry is gated. Independently
  dispatchable once green-lit (orthogonal to plugin-cli execution; run C2 BEFORE plugin-cli P1–P7 so they build on
  the clean vocab).
- **C1 persona-collision sub-fork:** `Persona` genus + rename the `persona` member → `archetype`/`essence` (nico
  recommends), OR `Presentation` genus keeping the member. Resolves with the genus name (see C1).
- **BRAND (C2):** the published package `agent-anatomy` vs a product framing `AgentKit` — nico recommends keeping
  `agent-anatomy`; a marketing preference is the Operator's to override. Everything else proceeds on nico's decision.
- **C2 static is STALE** — flagged for a full `pin-by-grep` re-census (825 organ-tokens / ~30 files) before it is a
  blind task; see C2 ⚠.

## Notes

- Each shard is blind-dispatchable (static · scope · falsifiable accept: grep + cold Ω\* read + typecheck/test).
- Stream-A/B shards EXCLUDE the `Genus`-axis tokens and the accept-gate guard list (Stream C owns those).
- ρ = LLM throughout.
