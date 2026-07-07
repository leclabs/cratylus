# Tested assumption — Claude Code reads CLAUDE.md, not AGENTS.md

The claude adapter's rules premise, pinned as a record with a tripwire (the CI carrier is
`packages/agent-forge/test/stories/E7/s10-claude-agents-md-tripwire.test.ts`).

**The assumption.** Claude Code consumes `CLAUDE.md` (managed/user/project scopes, `@import`
chains) and does **not** read `AGENTS.md` natively — Anthropic's own memory documentation
prescribes the `@AGENTS.md` import or a `CLAUDE.md → AGENTS.md` symlink as the bridge [S7]. The
adapter therefore emits `CLAUDE.md` as a pure AGENTS.md projection and never writes `AGENTS.md`
for the claude target.

**Evidence.** [S7] code.claude.com/docs/en/memory (CLAUDE.md the sole memory file; AGENTS.md via
import/symlink) · [S62] the Claude Code changelog carries zero AGENTS.md entries through 2026-07 ·
[S49] native AGENTS.md support is the most-upvoted open request — anthropics/claude-code issue
#31005. Source ledger: `plans/interop-hardening/completed/standards-compat-research.RETURN.md`.

**The tripwire.** The day Claude Code ships native `AGENTS.md`, the E7.S10 premise-carrier test
fails loudly; the response is a one-line adapter change with a known blast radius (emit `AGENTS.md`
as primary, retain `CLAUDE.md` for back-compat) plus this record's retirement.
