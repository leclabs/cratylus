# S9 · unified-cli-brand

**Objective.** Deliver ONE branded binary — a thin dispatcher (Vite "one core, two skins") that routes build-time subcommands (`build/project/deploy`) → the forge node-app and runtime subcommands (`run/memory/tap`) → the runtime node-app. On a dev machine the bin resolves both; on a host only the runtime is installed, so the host's bin is runtime-only. Resolve FORK-4: derive the brand anchor via signify (capabilities are subcommands; NEVER a generic top-level bin).

**Static inputs (pinned):**

- `packages/forge/src/cli/index.ts` + `package.json` bin (`forge`) — the build CLI to route to.
- `packages/runtime/src/bin.ts` (dep-fed S3) — the runtime dispatcher to route to.
- `packages/forge/src/config/config.ts:1-6` — the "one core, two skins / thin callers into resolve()" doctrine to honor.
- signify skill — to derive the brand anchor (FORK-4) at authoring: candidate-free cold-oracle; the concept = "the single cratylus command surface, build ⊕ runtime faces".

**Constraints.**

- ONE branded bin name (npm scope-strips bin names → the name is global; must be collision-safe + branded). Derive, don't coin: signify cold-oracle, negative control. Reject generic names (`agent`, `run`, `af` if collision-prone).
- The dispatcher is THIN: subcommand → the appropriate node-app; no business logic in the bin.
- Dev vs host footprint: the brand's bin is provided by BOTH forge (dev, full) and runtime (host, runtime-only) — a subcommand not present in the installed face fails loud with a clear "install forge for build commands" message.
- Backward-compat: `forge <build-verb>` may remain an alias during transition (assess; grey-field — prefer the clean brand, alias only if a live consumer needs it).

**Dependencies.** S3 (runtime bin), S6 (forge build integration).

**Outputs.** The branded dispatcher bin (in forge and/or a thin top package); brand anchor derived + recorded (signify provenance); subcommand routing (build→forge, runtime→runtime) with loud missing-face errors.

**Completion criteria (falsifier).** `<brand> memory home --name x` (runtime face) and `<brand> deploy …` (build face) both dispatch correctly on a dev machine; on a runtime-only install, a build subcommand fails loud (not silent); the brand anchor is cold-derivable (signify provenance attached), not a generic collision-prone word. REJECTED if two competing top-level bins ship, if a generic/collision-prone bin name is used, if the brand was coined warm without a cold-oracle derive, or if a missing-face subcommand silently no-ops.

---

**DISPOSITION (mav, 2026-07-26) — RESOLVED, split in two.**

The shard bundled two acts. Both are settled, neither remains.

- **The dispatcher: ABANDONED by decision.** `runtime` existed to DECOMPLECT
  build-host from runtime-host; one dispatcher over both re-complects them. Forge carries
  8 fixed commands, the runtime's verb space is plugin-driven and open, and no static route
  table spans them. **Two bins is correct because two hosts is correct.** This shard's own
  falsifier ("REJECTED if two competing top-level bins ship") is therefore retired with it —
  it encoded the premise that was wrong.
- **The rename: ⊥.** `plans/.retired/close-out/completed/N1-derivation-record.md` ran the
  brand oracle candidate-free in a cold rig with passing positive controls. Paraphrase
  invariance failed decisively — the mode under two framings scored 0/14 under two others.
  The referent has no positive content (every differentia negative, positional or borrowed),
  so cratylism's precondition is not met and re-running is not owed. `runtime` is kept
  as descriptive-of-the-slot, the honest form of a ⊥.

What the shard actually wanted and now HAS: `close-out/V5` collapsed the bin name from
**13 homes to 1** (`packages/runtime/src/bin-name.ts`), and the two brand-derived
literals that survived it — `RUNTIME_CONFIG_NAME`, `TAP_ID` — are now derived, not copied.
