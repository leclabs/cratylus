# north-star-architecture

**Initiative.** Re-establish a clean whole-system architecture under `ENGINE ⊥ MODEL` (ENGINE.md): MODEL
fixes invariants, ENGINE realizes them + owns `boundary-projection ≜ {deploy, project-human}`; every runtime
target is a projection of the canon, never its author (VISION). Remove nico/mav scope barriers, census the
violations, ratify ONE north-star with ≥3 adversarial mav reviews, then refactor to it. Owner: session
`1b8801a9`. Mirror is derived — the state folders are authority.

## Provenance / starting state (blind-executor-told)

- `nico.role: curate → build` in the working tree is **intentional** (Operator, this session).
- Uncommitted WT = the Operator's `[[x]]→`x``"shotgun, directionally correct" — to be **superseded** by
E3, not preserved. Also WT:`.manifests/\*.json`, `CONCEPT.md`, `README.md`deleted;`plans/heartbeat-organ/`
  untracked (unrelated).
- Hard invariant: dep direction is `agent-anatomy → agent-forge` (type-only); **forge MUST NOT import
  anatomy** (cycle). agent-memory couples only by a filesystem bundle-path (no code import).

## Dependency graph (R)

```
S0  (scope barriers)          — independent
C1,C2,C3 (censuses)           — independent, COMPLETE
D1  ⟵ C1,C2,C3                 — synthesis + mav debate (join)
E1..E4 ⟵ D1                    — execution (design-dependent, fan-out)
```

## Waves (dispatch schedule)

- **wave 0** — `S0` ∥ `C1` ∥ `C2` ∥ `C3` (censuses done; S0 ready)
- **wave 1** — `D1` (north-star synthesis + ≥3 mav adversarial reviews → ratified target → Operator sign-off)
- **wave 2** — `E1` ∥ `E2` ∥ `E3` ∥ `E4` (refactor, MECE along the ratified boundaries; specced at D1)

## State

| task                                               | state                                           | concern                                                                     |
| -------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| C1 census — package boundaries (toolkit placement) | completed                                       | ANATOMY vs FORGE concern; toolkit relocation candidates                     |
| C2 census — forge & memory                         | completed                                       | dup/concern-mix/purity/dep-direction; the forge⊥memory D4 seam              |
| C3 census — citation + memory prose                | completed                                       | dead `[[…]]` cruft vs live successor; genus prose-vs-tool dup               |
| S0 — scope barriers                                | ready                                           | broaden nico/mav vision; purge dangling lane-split                          |
| D1 — north-star synthesis + mav debate             | active (CONVERGED — awaiting Operator sign-off) | 3/3 mav reviews integrated; F1 resolved by isolated Ω\*; `NORTH-STAR.md` v1 |
| E — execution slices (E1..E4)                      | pending                                         | design-dependent; specced after D1                                          |

## Census results (durable inputs for D1)

- `census/C1-package-boundaries.md` · `census/C2-forge-memory.md` · `census/C3-citation-memory-prose.md`
- `census/C4-harness-genericity.md` (Operator-prompted) · `NORTH-STAR.md` · `DIAGRAM.md` (Mermaid)

## Confirmed violations (from census — the refactor targets)

1. **Concern-mix:** `deploy/seeds.ts` authors memory-store CONTENT (memory doctrine in the placement layer). [B1]
2. **Deep cause:** forge can't import memory ⇒ memory doctrine (filenames, v1-retirement, seed prose)
   COPIED into forge/deploy instead of imported. [D4 → A2,A3]
3. **Invisible coupling:** real inter-package edges are path/string contracts the compiler can't enforce. [D3]
4. **Forge-concern in anatomy:** `toolkit/` hosts projection/deploy/accept-gate tooling; `guardrail/*.sh`
   are the only clean runtime residents. [C1]
5. **Prose double-maintains tool logic:** `genus/memory.md` + `dream.ts` re-specify scope/liveness/lock/
   drain/audit that `agent-memory` already encodes deterministically. [C3-Inv2]
6. **Citation cruft:** orphaned `REF_RE` parser + unimplemented docs:check gate; distinct from the LIVE
   bare-anchor skill-composition successor (fork to resolve cold). [C3-Inv1]
7. **Impurity/dup:** clock-in-template seeds, `dream.compact`, `loadNodeConfig`; `organTitle` dup; codex→claude
   sideways adapter edge. [C2 §C/§D]
