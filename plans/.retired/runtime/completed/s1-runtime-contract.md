# S1 · runtime-contract

**Objective.** Create the new leaf package `@leclabs/runtime` and define its CONTRACTS only — no capability impls. Three artifacts: (a) `RuntimePlugin` interface (a capability package's runtime face); (b) the capability PORT interfaces `MemoryStrategy` + `EventTapHost`; (c) the runtime-owned canonical **lifecycle-event taxonomy** (FORK-1: runtime owns it; forge maps at S5, so S1 has ZERO forge/canon/memory coupling). Settle FORK-2: a capability package exposes TWO named exports (`buildPlugin`, `runtimePlugin`), not one dual-hook object.

**Static inputs (pinned, read to shape the contracts):**

- `packages/forge/src/runtime/event-tap/port.ts` — the existing `EventTapHost`/`CaptureSink`/`Record`/`TapStatus`/`LifecycleEvent` shapes to LIFT verbatim (minus the `CanonicalEvent` import → replace with the new runtime-local taxonomy).
- `packages/memory/src/cli.ts` — the verb surface (`encode·read·session·audit·fold·drain·apply·replace·node·home·migrate·init·lock`) → distill into the `MemoryStrategy` method interface (verbs = methods; `requireHome`/`home` = the resolution the strategy owns).
- `packages/memory/tsup.config.ts` + `package.json` — the standalone-ESM build template to mirror (but runtime IS a library: dts + exports map, unlike memory).
- `packages/forge/src/anatomy/index.ts:263-296` — the `Skill.runtime?` companion-declaration field shape (the build side references the capability a runtime plugin provides; align names).

**Constraints.**

- LEAF: `dependencies: {}` — no `@leclabs/*` deps. Pure TS types + `defineRuntimePlugin` identity helper (mirror `defineAgentPlugin`).
- Ports are INTERFACES only (zero impl). `MemoryStrategy` = the memory verb surface as a typed contract incl. `home(name?, homeOverride?)` resolution (the c13e911 `--home > $AGENT_HOME > --name` precedence is the strategy's law, specified in the interface doc).
- The event taxonomy is runtime-native (an enum/union of lifecycle events); it does NOT import forge. FORK-1 discharged here.
- Library build: `exports` map + `dts` (contra memory's deliberate not-a-library). Sub-paths: `.` (contract), `./ports/memory`, `./ports/event-tap`, `./events`.

**Dependencies.** none (wave 0 root).

**Outputs.** `packages/runtime/{package.json (name @leclabs/runtime, no bin yet — S3), tsconfig.json, tsup.config.ts, src/index.ts, src/plugin.ts (RuntimePlugin + defineRuntimePlugin), src/ports/memory.ts (MemoryStrategy), src/ports/event-tap.ts (EventTapHost et al.), src/events.ts (taxonomy)}`. Wire into the pnpm workspace + turbo.

**Completion criteria (falsifier).** `pnpm --filter @leclabs/runtime typecheck && pnpm --filter @leclabs/runtime build` green; the package `exports` resolve `RuntimePlugin`, `MemoryStrategy`, `EventTapHost`, the event taxonomy, `defineRuntimePlugin` as PURE TYPES/identity (grep: zero capability impl, zero `@leclabs/*` in deps). A cold reader decodes each port interface from the file alone (no forge context). Return is REJECTED if any port imports forge, if a bin is declared (that's S3), or if a dual-face single-object plugin shape is used instead of two named exports.
