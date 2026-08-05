# S5 · event-tap-capability

**Objective.** Realize event-tap as a **runtime capability plugin** implementing the `EventTapHost` port (S1), reached via `cratylus-run tap <verb>` (install/remove/read/status). Resolve FORK-1's forge↔runtime edge: the harness adapter (Claude `settings.json` hook-merge) maps the runtime event taxonomy ↔ the harness-native events at THIS boundary. Absorbs event-tap E2's `t3-mechanism` (and its `t1-derive-verbs`/`t2-assets-bridge` where they survive per S2).

**Static inputs (pinned):**

- `packages/runtime/src/ports/event-tap.ts` + `src/events.ts` — the `EventTapHost` port + runtime event taxonomy (dep-fed from S1).
- `packages/forge/src/runtime/event-tap/claude.ts` — the EXISTING `EventTapHostClaude` impl (TAP_ID teardown, `serializeClaudeHooksReport`/`mergeJsonKeys` reuse, `claudeToCanonical` mapping, passive-logger command) to relocate into the capability plugin.
- `packages/forge/src/adapters/claude/{write.ts, events.ts}` — the reused claude serialization + the `claudeToCanonical` map (the harness↔taxonomy mapping this slice owns at the adapter boundary).
- `plans/event-tap/{ready/t1-derive-verbs.md, ready/t2-assets-bridge.md, pending/t3-mechanism.md}` — the E2 shards absorbed/superseded here (read for surviving intent).

**Constraints.**

- The plugin lives where capability plugins live (a package or a subpath — settle: event-tap as its own `@leclabs/*` package vs a subpath of runtime's default capabilities). The claude serialization it reuses currently sits in forge/adapters — decide whether to depend on forge for it (inverts DAG — AVOID) or relocate the minimal serialization into the capability. PREFER: the capability owns its harness-mapping; the runtime does not dep forge.
- Passive-sink contract preserved: the tap observes, never blocks/denies/mutates host control flow.
- `cratylus-run tap install --events … --sink …` / `remove` / `read` / `status` all route through S3 dispatch.

**Dependencies.** S1.

**Outputs.** The event-tap capability (`EventTapHost` impl + `runtimePlugin` export + the claude harness mapping); `cratylus-run tap <verb>` functional; the old forge-resident `src/runtime/event-tap/` retired or reduced to what forge still needs (coordinate with S6).

**Completion criteria (falsifier).** `cratylus-run tap install` merges a passive logger entry into a test `settings.json` (foreign keys/entries preserved); `tap remove` surgically drops only the TAP_ID entry (file restored); `tap status`/`read` reflect state; the capability does NOT dep `@leclabs/forge`. REJECTED if the tap can block/mutate host flow, if teardown leaves residue, or if the runtime→forge DAG is inverted to reuse serialization.
