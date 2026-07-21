# P7 — re-signify the Claude-output flag `--as-plugin` → `--as-claude-bundle`

**static (censused):** `packages/agent-forge/src/cli/commands/compile.ts` (`asPlugin?: string` option · the
`--as-plugin` flag · the `writeClaudePlugin(ir, cwd, opts.asPlugin)` call · the `claude-plugin '…'` status text) ·
`packages/agent-forge/src/adapters/claude/bundle.ts` (`writeClaudePlugin` · `.claude-plugin/plugin.json`; already
named `bundle.ts` to avoid the engine `plugin.ts`) · any `--as-plugin` mention in help/README/tests ·
`plans/plugin-cli/NORTH-STAR.md` §6.

**scope:** free the word "plugin" for the authoring unit by re-signifying the CLAUDE-OUTPUT flag. `--as-plugin`/
`asPlugin` → `--as-claude-bundle`/`asClaudeBundle` (the flag that emits a `.claude-plugin/` harness bundle). Pure
rename — NO behavior change; the emitted bundle is byte-identical. Update the option, its usage/help text, the
status strings, and every reference (`rejection-binds-the-sign`: the old flag must not survive by changing jobs).

**accept (falsifier):** `--as-plugin` is no longer accepted (passing it errors/usage); `--as-claude-bundle`
produces a `.claude-plugin/` bundle byte-identical to the pre-rename output; `git grep -nE "as-plugin|asPlugin"`
over `packages/` returns only comment/historical provenance; `pnpm -C packages/agent-forge typecheck` + suite
green. **dep:** none (wave 0, independent).
