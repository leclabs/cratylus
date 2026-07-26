# S3 · runtime-kernel

**Objective.** Build the runtime host's executable core in `@leclabs/agent-runtime`: a **loader** that registers `RuntimePlugin`s, a **dispatcher** that routes `agent-runtime <capability> <verb> [args]` to the loaded plugin's verb, and the branded **bin** skeleton. This is the "thin CLI over a node app" runtime face — the node app is the loader+dispatch; the bin is thin (mirrors forge's `cac` pattern).

**Static inputs (pinned):**

- `packages/agent-runtime/src/{plugin.ts, ports/*, events.ts}` — S1's contracts (dep-fed; read S1's completed task-file + emitted package).
- `packages/agent-forge/src/cli/index.ts` — the `cac`-based thin-CLI pattern to mirror for the runtime bin.
- `packages/agent-memory/src/cli.ts:824-860` — the existing verb-dispatch `switch` as the dispatch-shape reference (the runtime dispatcher generalizes it over registered plugins).

**Constraints.**

- Dispatch is plugin-driven: `<capability>` selects a registered `RuntimePlugin`; `<verb>` selects its method; unknown capability/verb fails LOUD (no silent no-op).
- The loader resolves WHICH plugins are present (a runtime manifest, or node resolution of installed `@leclabs/*` capability packages — settle the discovery mechanism, mirroring how forge's config `extends` discovers build plugins, but for the RUNTIME the discovery is host-install-based not config-based).
- bin: declare `bin` in agent-runtime's package.json — NAME deferred to S9 (FORK-4); S3 may use a placeholder `agent-runtime` bin, S9 rebrands.
- Deps: `@leclabs/agent-runtime` may add `cac` (or reuse a light arg parser); NO dep on forge/canon/memory (plugins register INTO the runtime, not the reverse).

**Dependencies.** S1.

**Outputs.** `packages/agent-runtime/src/{loader.ts, dispatch.ts, bin.ts}`; package.json `bin`; tests for register→dispatch→unknown-fails-loud.

**Completion criteria (falsifier).** With a FAKE test RuntimePlugin registered, `agent-runtime <cap> <verb>` dispatches to its method and returns the method's result; an unknown capability or verb exits non-zero with a clear error (proven by a control). typecheck+build+test green. REJECTED if dispatch silently no-ops on unknown input, if the runtime deps any `@leclabs/*` capability package, or if the bin bundles a specific capability impl (capabilities load as plugins).
