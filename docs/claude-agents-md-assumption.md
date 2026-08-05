# Tested assumption — Claude Code reads CLAUDE.md, not AGENTS.md

The claude adapter's rules premise, pinned as a record with a tripwire (the CI carrier is
`packages/forge/test/stories/E7/s10-claude-agents-md-tripwire.test.ts`).

**The assumption.** Claude Code consumes `CLAUDE.md` (managed/user/project scopes, `@import`
chains) and does **not** read `AGENTS.md` natively — Anthropic's own memory documentation
prescribes the `@AGENTS.md` import or a `CLAUDE.md → AGENTS.md` symlink as the bridge [S7]. The
adapter therefore emits `CLAUDE.md` as a pure AGENTS.md projection and never writes `AGENTS.md`
for the claude target.

**Evidence**, each fetched first-hand on 2026-07-02 and cited here by primary source rather than by
a ledger key, so the record needs nothing but itself:

- <https://code.claude.com/docs/en/memory> — `CLAUDE.md` is the sole memory file; AGENTS.md is
  reached only via `@AGENTS.md` import or a symlink.
- <https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md> — zero AGENTS.md entries
  through 2026-07.
- <https://github.com/anthropics/claude-code/issues/31005> (also #34235) — native AGENTS.md support
  is the most-upvoted open request.

**The tripwire.** The day Claude Code ships native `AGENTS.md`, the E7.S10 premise-carrier test
fails loudly; the response is a one-line adapter change with a known blast radius (emit `AGENTS.md`
as primary, retain `CLAUDE.md` for back-compat) plus this record's retirement.
