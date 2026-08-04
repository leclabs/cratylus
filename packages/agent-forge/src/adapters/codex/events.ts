import type { CanonicalEvent } from '@leclabs/agent-schema/hook';

/**
 * Canonical event → Codex hook event name.
 *
 * Codex HAS a hook surface (`~/.codex/hooks.json`, or inline `[hooks]` tables in
 * `config.toml`, discovered beside each active config layer). This module existing
 * at all is the correction of a false claim: the adapter previously declared it
 * realized nothing, on the strength of a comment reading "codex projects none".
 * That was inherited rather than verified, and it made every enforcing guardrail
 * look unrealizable on codex — which would have refused the whole corpus.
 *
 * Events absent from this map have no Codex peer and are genuinely unrealizable
 * here; the build-time refusal names them rather than dropping them.
 */
export const canonicalToCodex: Partial<Record<CanonicalEvent, string>> = {
  'session.start': 'SessionStart',
  'session.end': 'SessionEnd',
  'prompt.submit': 'UserPromptSubmit',
  'turn.end': 'Stop',
  'tool.use.pre': 'PreToolUse',
  'tool.use.post': 'PostToolUse',
  'subagent.start': 'SubagentStart',
  'subagent.end': 'SubagentStop',
  'context.compact.pre': 'PreCompact',
  'context.compact.post': 'PostCompact',
  'permission.request': 'PermissionRequest',
};

/**
 * Codex events whose `matcher` filters on `agent_type` — i.e. the events where a
 * per-agent constraint can actually be SCOPED on this harness.
 *
 * Codex hooks are declared globally; there is no per-agent hook file the way a
 * Claude subagent carries its own front-matter. So the adapter's job is to map the
 * canon's per-agent shape onto the surface that exists, and for these two events
 * the native matcher does it exactly: `matcher` is a regex over `agent_type`.
 *
 * For every OTHER event the documented hook input carries no agent identifier at
 * all (`session_id`, `cwd`, `permission_mode`, `tool_name` — no agent). A
 * constraint bound to two agents cannot be narrowed to them there, and emitting it
 * globally would silently govern every agent instead. That is a behaviour change
 * wearing a projection, so the adapter refuses rather than over-applies.
 */
export const CODEX_AGENT_SCOPED_EVENTS: ReadonlySet<string> = new Set([
  'SubagentStart',
  'SubagentStop',
]);
