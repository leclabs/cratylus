# S4 · memory-capability

**Objective.** Reshape `@leclabs/memory` from a standalone tool into a **runtime capability plugin**: implement the `MemoryStrategy` port (S1), register as a `RuntimePlugin` so verbs run via `cratylus-run memory <verb>`, **DROP the top-level `memory` bin** (npm scope-strip → global `memory` collision), and TAKE OWNERSHIP of the memory SEED templates. Fold the c13e911 home-resolution (`--home > $AGENT_HOME > --name` + `memory home`) into the strategy's `home()` method.

**Static inputs (pinned):**

- `packages/runtime/src/ports/memory.ts` — the `MemoryStrategy` interface to implement (dep-fed from S1).
- `packages/memory/src/cli.ts` — the existing verbs/handlers (`requireHome:106`, `runHome`, `runEncode/Read/Session/Audit/Fold/Drain/Apply/Replace/Node/Migrate/Init/Lock`) to REHOUSE as strategy methods; the resolution precedence to preserve.
- `packages/memory/src/{store.ts, node.ts}` — the EPISODIC store + node resolution (the impl body, largely unchanged).
- `packages/forge/src/deploy/seeds.ts:68-77` — the `SEED_FILES` (`SEMANTIC.md`/`PROCEDURAL.md`/`EPISODIC.jsonl` seed templates) to MOVE into memory (the store shape is memory's business).
- `packages/memory/{package.json (private:true, bin:memory), tsup.config.ts}` — to rewire (drop bin, add `@leclabs/runtime` dep, publish per FORK-3).

**Constraints.**

- Implement `MemoryStrategy`; register a `runtimePlugin` (FORK-2 named export). The verb bodies keep their tested logic (store/node unchanged) — this is a rehousing, not a rewrite.
- DROP `bin:{memory}`. The verbs are reached ONLY via `cratylus-run memory <verb>` (S3 dispatch). The old `memory` binary ceases to exist.
- OWN the seeds: memory exports the seed templates; forge stops carrying them (the forge-side removal is S6 — coordinate: S4 provides the export S6 consumes).
- Preserve c13e911 semantics exactly: `home()` resolution = `--home`/explicit > `$AGENT_HOME` env > `--name`→`~/.agents/<name>` default. Keep the 170 memory tests green (adapt call sites to the strategy shape).
- FORK-3 (publish) may gate the final `private` flip — if unresolved, leave `private:true` + a note; the strategy impl + bin-drop do not block on it.

**Dependencies.** S1.

**Outputs.** memory reshaped: `src/strategy.ts` (MemoryStrategy impl), `src/plugin.ts` (runtimePlugin export), seed templates moved in, `package.json` bin dropped + `@leclabs/runtime` dep added; tests adapted (green).

**Completion criteria (falsifier).** `cratylus-run memory home --name nico` → `~/.agents/nico`; `cratylus-run memory encode/read` round-trips a record; `$AGENT_HOME` override + `--home` precedence hold (proven by the three-tier control from c13e911); `memory` package declares NO `memory` bin; the seed templates resolve from memory (not forge); memory test-suite green. REJECTED if a `memory` bin survives, if resolution precedence differs from c13e911, or if seeds still originate in forge.
