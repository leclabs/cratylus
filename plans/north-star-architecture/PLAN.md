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

| shard                          | R   | state           | concern                                                                                            |
| ------------------------------ | --- | --------------- | -------------------------------------------------------------------------------------------------- |
| C1·C2·C3 census · D1 synthesis | —   | completed       | design grounding + north-star                                                                      |
| S0 scope-barriers              | R9  | completed       | broaden nico/mav vision; purge dangling lane-split                                                 |
| E1 projection→forge            | R1  | ready           | relocate toolkit projection tooling into forge                                                     |
| E6a memory standalone tool     | R6  | ready           | rename→`memory`, bin+bootstrap, `~/.agents/<name>`, register-mint session-id, del bundle mechanism |
| E6b memory taxonomy            | R6  | ready           | extract `vault`+`AGENTS`; 4-part CoALA model                                                       |
| E7 citation cruft              | R7  | ready           | delete orphan `[[…]]` parser + docs:check gate                                                     |
| E2 accept-gate split           | R2  | pending⟵E1      | algorithm→forge; policy-data injected (no `polis` in engine)                                       |
| E4 hooks split                 | R4  | pending⟵E1      | generic `hookIrOf`→forge; cells stay CANON                                                         |
| E5 adapters by-name            | R5  | pending⟵E1      | registry selection; `core/anatomy-body`; kill sideways edge                                        |
| E6c memory verbs+lifecycle     | R6  | pending⟵E6a,E6b | `apply`/`replace`; Stop nudge hook; delete genus; orchestrators                                    |
| E3 founding inject             | R3  | pending⟵E2      | `init.ts` doctrine → `FoundingTemplate` from CANON                                                 |

## Notes

- Each shard is a blind-dispatchable execution spec (static · scope · accept). Accept clauses are falsifiable
  (grep/typecheck/`project --check`/tests).
- Deferred (not shards): MCP transport · `--describe` verb · sleep-time consolidation sidecar · finer-grained
  per-fact memory update — all documented as future, out of wave-2.
