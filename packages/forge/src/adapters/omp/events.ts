// Canonical event → Oh My Pi (`omp`) hook event name.
//
// EVERY NAME BELOW IS READ OFF `omp`'s OWN `HookAPI` — the twenty-four `on(event:
// "…")` overloads in `src/extensibility/hooks/types.ts:481-513` of
// `@oh-my-pi/pi-coding-agent@17.2.9`. Nothing here is inferred from a canonical
// name's resemblance to a native one, because three of the four resemblances in
// this map are FALSE FRIENDS and two of them would have shipped as silent
// misbehaviour. They are called out at their entries.
//
// Events absent from this map have no omp peer and are genuinely unrealizable
// here; the build-time refusal names them rather than dropping them.

import type { EventName, NativeBinding } from '@cratylus/schema/hook';

/**
 * The plain canonical → native map: the events omp fires with no selector needed.
 *
 * THE THREE FALSE FRIENDS, each corrected here rather than in a comment nobody
 * reads at the call site:
 *
 * 1. **`turn.end` is `agent_end`, NOT `turn_end`.** omp's "turn" is a MODEL turn —
 *    `TurnStartEvent`/`TurnEndEvent` carry a `turnIndex` that increments WITHIN one
 *    user exchange, so a hook on `turn_end` fires several times per exchange. The
 *    analogue of Claude's `Stop` is `agent_end`, _"fired when an agent loop ends"_.
 *    Binding the memory-consolidation nudge to `turn_end` would have made it fire
 *    once per model turn — a nudge storm that reads as the cell misbehaving.
 *    `agent_end` additionally carries `willContinue` (`shared-events.ts:193-201`),
 *    a BETTER terminal predicate than the claude adapter has: it says outright when
 *    the session has already scheduled a continuation and this settle is not
 *    user-visible.
 *
 * 2. **`prompt.submit` is `before_agent_start`, NOT `turn_start`.** `TurnStartEvent`
 *    is `{type, turnIndex, timestamp}` — it realizes the MOMENT and carries no
 *    prompt text at all. `BeforeAgentStartEvent` carries `prompt: string`
 *    (`extensions/types.ts:655-660`), which is what a cell binding this event
 *    actually needs. The bootstrap's DELTA mapped this to `turn_start` and graded
 *    it `provide`; that was right about `turn_start` and had not yet weighed
 *    `before_agent_start`, which makes it `proxy`.
 *
 * 3. **`agent_start`/`agent_end` are the MAIN loop, not subagents.** They do not
 *    realize `subagent.*`; the `task` tool's `tool_call`/`tool_result` does, which
 *    is why those live in the ACT table below and not here.
 */
export const canonicalToOmp: Readonly<Record<EventName, string>> = {
  'session.start': 'session_start',
  'session.resume': 'session_switch',
  'session.end': 'session_shutdown',
  'prompt.submit': 'before_agent_start',
  'turn.end': 'agent_end',
  'tool.use.pre': 'tool_call',
  'tool.use.post': 'tool_result',
  'context.compact.pre': 'session_before_compact',
  'context.compact.post': 'session_compact',
};

/**
 * The omp tool name each ACT is carried by.
 *
 * An ACT is a canonical event naming WHAT the agent is doing rather than which
 * lifecycle moment fired — consulting the operator, dispatching a subagent. Every
 * harness carries these on a generic tool event plus a selector, and the selector
 * is where harnesses differ.
 */
const OMP_ACT_TOOL: Readonly<Record<EventName, string>> = {
  'operator.consult.pre': 'ask',
  'subagent.dispatch.pre': 'task',
  'subagent.end': 'task',
};

/**
 * Canonical ACT → the omp ⟨native event, native selector⟩ pair.
 *
 * **EVERY BINDING HERE IS NARROWED, AND THAT IS THE DIFFERENCE FROM CODEX.** Codex
 * spends its only `PreToolUse` selector on `agent_type` and therefore fires these
 * acts unnarrowed, which its adapter has to report as a loss. omp has no such
 * shortage — and the reason is structural rather than lucky:
 *
 * **an omp hook is CODE, so the selector is an `if`.** The handler receives the
 * event with `toolName` on it (`ToolCallEvent`/`ToolResultEvent`,
 * `extensions/types.ts:1183-1256`), so narrowing to `ask` or `task` is a branch the
 * emitted module writes, not a matcher expression the harness has to support. A
 * harness whose hook surface is a config file can only narrow along the axes its
 * schema anticipated; one whose hook surface is a program can narrow on anything
 * the event carries.
 *
 * `unnarrowed` is therefore absent from every entry — not omitted, ABSENT, because
 * there is no loss to declare.
 */
export const canonicalActToOmp: Readonly<Record<EventName, NativeBinding>> =
  Object.fromEntries(
    Object.entries(OMP_ACT_TOOL).map(([canonical, tool]) => [
      canonical,
      {
        event: canonical === 'subagent.end' ? 'tool_result' : 'tool_call',
        matcher: tool,
      },
    ]),
  );

/**
 * What `event` becomes on omp — the ACT binding when there is one, else the plain
 * native name. `undefined` ⇔ unrealizable here.
 *
 * The single question every omp emission site asks, so no site can consult one
 * table and miss the other. Mirrors `codexBindingOf` deliberately: two harnesses
 * with the same two-table shape should answer it the same way.
 */
export function ompBindingOf(event: EventName): NativeBinding | undefined {
  const act = canonicalActToOmp[event];
  if (act) return act;
  const native = canonicalToOmp[event];
  return native === undefined ? undefined : { event: native };
}

/**
 * The omp events a hook can BLOCK — where an enforcing fragment genuinely bounds
 * rather than merely observes.
 *
 * `tool_call` is documented _"Fired before a tool is executed. Hooks can block
 * execution."_ (`extensions/types.ts:304`). Nothing else in omp's hook API takes a
 * blocking result, so this set has exactly one member and is not a stub.
 */
export const OMP_BLOCKING_EVENTS: ReadonlySet<string> = new Set(['tool_call']);
