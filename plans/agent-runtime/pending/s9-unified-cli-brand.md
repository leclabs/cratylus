# S9 · unified-cli-brand

**Objective.** Deliver ONE branded binary — a thin dispatcher (Vite "one core, two skins") that routes build-time subcommands (`build/project/deploy`) → the forge node-app and runtime subcommands (`run/memory/tap`) → the runtime node-app. On a dev machine the bin resolves both; on a host only the runtime is installed, so the host's bin is runtime-only. Resolve FORK-4: derive the brand anchor via signify (capabilities are subcommands; NEVER a generic top-level bin).

**Static inputs (pinned):**

- `packages/agent-forge/src/cli/index.ts` + `package.json` bin (`agent-forge`) — the build CLI to route to.
- `packages/agent-runtime/src/bin.ts` (dep-fed S3) — the runtime dispatcher to route to.
- `packages/agent-forge/src/config/config.ts:1-6` — the "one core, two skins / thin callers into resolve()" doctrine to honor.
- signify skill — to derive the brand anchor (FORK-4) at authoring: candidate-free cold-oracle; the concept = "the single agent-factory command surface, build ⊕ runtime faces".

**Constraints.**

- ONE branded bin name (npm scope-strips bin names → the name is global; must be collision-safe + branded). Derive, don't coin: signify cold-oracle, negative control. Reject generic names (`agent`, `run`, `af` if collision-prone).
- The dispatcher is THIN: subcommand → the appropriate node-app; no business logic in the bin.
- Dev vs host footprint: the brand's bin is provided by BOTH forge (dev, full) and runtime (host, runtime-only) — a subcommand not present in the installed face fails loud with a clear "install agent-forge for build commands" message.
- Backward-compat: `agent-forge <build-verb>` may remain an alias during transition (assess; grey-field — prefer the clean brand, alias only if a live consumer needs it).

**Dependencies.** S3 (runtime bin), S6 (forge build integration).

**Outputs.** The branded dispatcher bin (in forge and/or a thin top package); brand anchor derived + recorded (signify provenance); subcommand routing (build→forge, runtime→runtime) with loud missing-face errors.

**Completion criteria (falsifier).** `<brand> memory home --name x` (runtime face) and `<brand> deploy …` (build face) both dispatch correctly on a dev machine; on a runtime-only install, a build subcommand fails loud (not silent); the brand anchor is cold-derivable (signify provenance attached), not a generic collision-prone word. REJECTED if two competing top-level bins ship, if a generic/collision-prone bin name is used, if the brand was coined warm without a cold-oracle derive, or if a missing-face subcommand silently no-ops.
