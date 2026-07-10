# north-star-architecture

**The plan.** Re-establish a clean whole-system architecture under `ENGINE ⊥ MODEL`: 3 packages
(agent-forge = ENGINE + type-kernel · agent-anatomy = CANON · agent-memory = a standalone tool), doctrine
injected out of the engine, memory as the 4-part CoALA subsystem. Design is CONVERGED — the single source of
truth is `NORTH-STAR.md` (net-current); this mirror derives the state. Owner: session `1b8801a9`.

## Phases

- **DESIGN (done):** census `C1–C4` + synthesis `D1` → `NORTH-STAR.md` (R1–R9) + `MODEL.md` BEING/FACE.
  Supporting: `DIAGRAM.md`, `SESSION-LIFECYCLE.md`.
- **EXECUTION (this spec):** the R1–R9 resolutions decomposed into the E-shards below. Nothing in `packages/`
  touched yet; push/deploy remain Operator-gated.

## Dependency graph (R)

```
E1 (R1 projection→forge)   ─┬─▶ E2 (R2 accept-gate split) ─▶ E3 (R3 founding inject)
                            ├─▶ E4 (R4 hooks split)
                            └─▶ E5 (R5 adapters by-name)
E6a (R6 memory pkg) ─┬─▶ E6b (R6 taxonomy: extract vault+AGENTS) ─┐
                     └────────────────────────────────────────────┴─▶ E6c (R6 verbs+lifecycle)
S0 (R9 scope barriers) · E7 (R7 citation cruft)   — independent
```

## Waves

- **wave 0 (ready — no deps, dispatch concurrently):** `S0` · `E1` · `E6a` · `E6b` · `E7`
- **wave 1 (pending):** `E2` ⟵E1 · `E4` ⟵E1 · `E5` ⟵E1 · `E6c` ⟵E6a,E6b
- **wave 2 (pending):** `E3` ⟵E2

## State

| shard                          | R   | state      | concern                                                                                            |
| ------------------------------ | --- | ---------- | -------------------------------------------------------------------------------------------------- |
| C1·C2·C3 census · D1 synthesis | —   | completed  | design grounding + north-star                                                                      |
| S0 scope-barriers              | R9  | completed  | broaden nico/mav vision; purge dangling lane-split                                                 |
| E1 projection→forge            | R1  | ready      | relocate toolkit projection tooling into forge                                                     |
| E6a memory standalone tool     | R6  | completed  | rename→`memory`, bin+bootstrap, `~/.agents/<name>`, register-mint session-id, del bundle mechanism |
| E6b memory taxonomy            | R6  | completed  | extract `vault`+`AGENTS`; 4-part CoALA model                                                       |
| E7 citation cruft              | R7  | completed  | delete orphan `[[…]]` parser + docs:check gate                                                     |
| E2 accept-gate split           | R2  | pending⟵E1 | algorithm→forge; policy-data injected (no `polis` in engine)                                       |
| E4 hooks split                 | R4  | pending⟵E1 | generic `hookIrOf`→forge; cells stay CANON                                                         |
| E5 adapters by-name            | R5  | pending⟵E1 | registry selection; `core/anatomy-body`; kill sideways edge                                        |
| E6c memory verbs+lifecycle     | R6  | completed  | `apply`/`replace`; Stop nudge hook; delete genus; orchestrators                                    |
| E3 founding inject             | R3  | pending⟵E2 | `init.ts` doctrine → `FoundingTemplate` from CANON                                                 |

## Execution finding — E1–E5 re-derived against the code (2026-07-09, nico)

A deep census before executing E1 corrects the engine-refactor model. The prior forge-anatomy de-braid
already landed the substantive decoupling: **the generic projection engine is already in forge**
(`projectHumanOrgan`, the `Hook` config-IR, every adapter); **no forge→anatomy import exists today**.
What remains in `agent-anatomy/src/toolkit/` are THIN composition-roots that legitimately value-import forge
"at composition roots until project-to-dir" (§1). Consequences:

- **E1 is the aspirational CAPSTONE, not the foundation.** Its literal accept ("anatomy→forge type-only; the
  3 residual value-imports die") is reachable ONLY by the composition-root **project-to-dir** migration, which
  NORTH-STAR §2 R4 marks **aspirational**. Decision (design authority): **defer E1's aspirational tier** out of
  this wave, consistent with NORTH-STAR's own staging.
- **The `E4⟵E1 · E5⟵E1` dependency is INVERTED.** E4 (generic `hookIrOf`+`HookCell` type → forge; stance
  cells stay anatomy) and E5 (adapters-by-name registry) are the real decouplings that THIN the composition-root;
  E1 would follow them, not precede. E2 (accept-gate algorithm→forge, policy injected) and E3 (⟵E2) are real and
  independent of E1.
- **Executable engine work = E4 · E5 · E2 · E3** (no E1 prerequisite). **E6a/E6b/E6c (memory) are independent**
  (separate package). E1 → deferred capstone (revisit after E4/E5 make hooks/adapters discoverable).

## Notes

- Each shard is a blind-dispatchable execution spec (static · scope · accept). Accept clauses are falsifiable
  (grep/typecheck/`project --check`/tests).
- Deferred (not shards): MCP transport · `--describe` verb · sleep-time consolidation sidecar · finer-grained
  per-fact memory update · **E1 aspirational project-to-dir (composition-root → forge)** — all future.
