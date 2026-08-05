# S3 · hooks-serializer-extract

**Objective.** Extract the hooks serializer out of the IR write path so the live projection stops
reaching into `adapters/claude/write.ts`. This is the **one genuinely load-bearing braid**: the surviving
`project → deploy` path renders `settings.json` by calling the IR write path's serializer.

**Inputs (pinned, exist at authoring).**

- `packages/forge/src/adapters/claude/write.ts:237-246` — `serializeClaudeHooksReport` and its
  private `serializeClaudeHooks`; signature takes `Hook[]`
- `packages/forge/src/adapters/claude/index.ts:96-99` — already exports the serializer standalone,
  with the stated intent that a plugin can "project a hooks-only settings fragment without driving the
  whole `writeClaude` tree" — **the seam is pre-cut**
- `packages/forge/src/adapters/claude/anatomy.ts:33,107-110` — the live consumer,
  `claudeHarnessAdapter.hooks`
- `packages/forge/src/project/index.ts:230,233` — the live call chain

**Constraints.**

- Move, do not fork. Two copies of a serializer is the defect this plan exists to remove; the emitted
  bytes must come from exactly one function afterward.
- The serializer's `Hook` parameter type must reference S2's rehomed vocabulary, not `core/ir/`.
- `hooks.ts` ordering is load-bearing: `HookCell` carries an explicit `order` precisely because
  alphabetical dir-scanning once silently reordered a blocking gate ahead of a non-blocking nudge. The
  emitted `settings.json` must stay byte-identical, ordering included.

**Dependencies.** S2 (the `Hook` type must have its new home first).

**Outputs.** The hooks serializer living beside `adapters/claude/anatomy.ts`; `write.ts` no longer
imported by any live projection path; one serializer in the tree, not two.

**Completion criteria (falsifier).** A real dogfood — `project` → `deploy` into a temp `HOME` — emits a
`settings.json` **byte-identical** to the pre-shard artifact (diff it, do not eyeball it); `rg -n
"write\.js|write\.ts" packages/forge/src/{project,adapters/claude/anatomy.ts}` returns nothing,
control proven; full `pnpm test` green. REJECTED if the serializer is copied rather than moved; if
`settings.json` differs in content **or hook order**; if the serializer still types its parameter from
`core/ir/`; or if the byte-comparison is asserted without an actual diff of the two artifacts.
