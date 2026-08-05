import type { EventName, NativeBinding } from '@cratylus/schema/hook';

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
export const canonicalToCodex: Readonly<Record<EventName, string>> = {
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

/**
 * The sentence codex says when it can FIRE an act but not NARROW it.
 *
 * ONE STRING, so the report cannot drift from the reason. Codex spends its only
 * `PreToolUse` selector on `agent_type` (above); there is no second selector for the
 * call's SUBJECT, so an act naming a subject arrives here fireable and unnarrowable.
 */
const CODEX_NO_SUBJECT_SELECTOR =
  "codex's `matcher` selects on `agent_type`, never on the call's subject, so this act's narrowing is not expressible here — the hook fires on EVERY occurrence of that native event and only the worker's own subject branch narrows it";

/**
 * Canonical ACT → the codex ⟨native event, native selector⟩ pair.
 *
 * EVERY BINDING HERE IS `unnarrowed`, AND THAT IS THE FINDING. Codex fires
 * `PreToolUse` exactly as claude does, so both acts are realizable; what codex lacks
 * is the selector. Before this table the loss had no shape: the projector read a
 * `matcher` field it did not understand, emitted the hook without it, and said
 * nothing — so `hooks.json` registered a guardrail that ran on every tool call while
 * the render looked clean. The gap was never the defect. The SILENCE was.
 *
 * NOTE WHAT IS ABSENT: no tool name. Codex's tool set is its own and open-world, and
 * nothing here needs to know it — declining to narrow is a statement about the
 * SELECTOR, not about the tools.
 */
export const canonicalActToCodex: Readonly<Record<EventName, NativeBinding>> = {
  'operator.consult.pre': {
    event: 'PreToolUse',
    unnarrowed: CODEX_NO_SUBJECT_SELECTOR,
  },
  'subagent.dispatch.pre': {
    event: 'PreToolUse',
    unnarrowed: CODEX_NO_SUBJECT_SELECTOR,
  },
};

/**
 * What `event` becomes on codex — the ACT binding when there is one, else the plain
 * native name. `undefined` ⇔ unrealizable here.
 *
 * The single question every codex emission site asks, so no site can consult one
 * table and miss the other.
 */
export function codexBindingOf(event: EventName): NativeBinding | undefined {
  const act = canonicalActToCodex[event];
  if (act) return act;
  const native = canonicalToCodex[event];
  return native === undefined ? undefined : { event: native };
}
