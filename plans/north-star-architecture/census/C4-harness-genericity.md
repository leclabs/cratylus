# C4 findings — harness-genericity audit

Source: Explore audit of 17 adapters + canon + memory tool + deploy.

## Q1 — adapters project to correct per-harness dirs? YES.

- 17 adapters (9 with `paths.ts`, 8 inline `paths()`); only `roo` is a deliberate stub (sunset→cline).
- Directory shapes genuinely differentiated + citation-annotated, NOT claude-copies. e.g. codex skills →
  `.agents/skills/` (NOT `.codex/skills`); opencode config → root `opencode.json`.
- Capabilities honestly downgraded (partial/none/plugin), not faked.
- Hook realization correctly modeled as an adapter axis: native-config (claude settings.json · cursor ·
  gemini · copilot) vs plugin-shim (amp · kilo · opencode · pi); captured by `AdapterCapabilities.hooks`
  `{supported,matchers,payload}` (`core/adapter/types.ts:22-30`). The PLACEMENT strategy is clean.

## Q2 — harness-specific assumptions NOT generalized (all OUTSIDE adapters/)

- **F1** `genus/memory.md` hardcodes `~/.claude/...` (12 literals: :24,26,28,42,44-51). Self-contradicts at
  :53 ("resolve per host from tilde, never baked-in absolute") while baking `.claude`.
- **F2** `skills/wake.ts:6-9`, `handoff.ts:16`, `praxis.ts:13` hardcode `~/.claude/skills/memory/episodic.mjs`
  - name `CLAUDE_SESSION_ID` directly.
- **F3** hook cells bake `$HOME/.claude/hooks/...` into command + worker paths (`stance-guardrail.ts:16`,
  `stance-guardrail-pre.ts:21,63,66`). Hook EVENTS are generic (CanonicalEvent 28-event pivot + per-adapter
  eventMap); the command string + install path are claude-literal.
- **F4** memory tool auto-derives session from `CLAUDE_SESSION_ID` (`store.ts:53`, `cli.ts:419`); `--session`
  fallback exists (partial generalization).
- **F5 (core mechanism)** body projection emits path literals UNCHANGED: `skill-cell.ts:79-90` verbatim;
  `adapters/claude/anatomy.ts:138-139` returns `toolSection` verbatim; codex REUSES claude's `skillBody`/
  `agentBody` (`codex/anatomy.ts:23`). ⇒ memory body projected to codex STILL says `~/.claude/...` though
  codex skills land at `.agents/skills/`.
- **F6 (biggest)** the DEPLOY layer is claude-only: `scope.ts:44,62` return `.claude/` roots; `local.ts:99`,
  `ssh.ts:205`, `init.ts:75`, `found.ts:4` all target `.claude`. The codex projectors
  (`agentToCodexToml`/`skillToCodexMd`) EXIST + are tested but are **wired into NO deploy/found path**. Only
  claude reaches production deploy.

## Q3 — is memory harness-generic today? NO.

- Tool CORE is path-agnostic: `cli.ts:86-89` `--home` required + resolved; zero `.claude` in `agent-memory/src`.
- Breaks: (1) bundle lands only at `.claude/skills/memory/` (F6 deploy); (2) invocation path is a `~/.claude`
  prose literal emitted verbatim (F1/F2/F5); (3) `--home` prose-hardcoded to `~/.claude/agents/<name>`;
  AGENT_HOME has NO per-harness resolver (prose-only); (4) session-id auto-derivation claude-only (F4).
- Fix requires: (a) per-harness deploy target for the bundle; (b) template the `~/.claude/skills/` +
  `~/.claude/agents/<name>` literals through the adapter's skills-dir/agents-dir strategy (the same paths.ts
  the config-IR path already uses) instead of verbatim emission.

## Architectural implication

"Author once, realize everywhere" (VISION) is NOT true today — only claude is deployable end-to-end. The
adapter/strategy pattern is correct for PLACEMENT but stops at the body/deploy boundary.
