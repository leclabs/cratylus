// The canonical `Hook` → Claude `settings.json` `hooks` block serializer. The ONE
// function that emits those bytes for the render projection port
// (`claudeHarnessAdapter.hooks`, the live `project → deploy` path).
//
// It lives HERE, beside `render.ts`, because hook projection is not an IR
// concern. It used to live inside the claude IR adapter's `write.ts`, which the
// live projection therefore had to reach into for this one function; extracting
// it cut that reach, and `write.ts` was deleted with the rest of the IR lineage.
//
// A LEAF-ADJACENT module by construction: it imports only the sibling event map
// and `@cratylus/schema/hook`, which is where the harness-agnostic `Hook` /
// `CanonicalEvent` vocabulary lives.
//
// EVERY CLAIM BELOW ABOUT CLAUDE'S NATIVE HOOK SHAPE — the `if` filter, per-command
// `env`, and the non-`command` hook types — is read off Claude Code's hook
// documentation: <https://code.claude.com/docs/en/hooks-guide.md>.

import type { Hook } from '@cratylus/schema/hook';
import { claudeBindingOf } from './events.js';

/**
 * Adapter-private Hook extension fields — never part of the canonical hook
 * schema, carried only so a read→write round trip inside THIS adapter stays
 * lossless for Claude-specific hook shape (the `if` filter, per-command `env`,
 * and non-command `type`s like `prompt`). A cross-adapter consumer sees a
 * plain `Hook` (structurally compatible; the extra keys are simply ignored).
 */
export interface ClaudeHook extends Hook {
  if?: string;
  env?: Record<string, string>;
  /** Native hook `type` when not `'command'` (e.g. `'prompt'`). */
  kind?: string;
  /**
   * A claude-native `matcher` read back off a host's own `settings.json`.
   *
   * ADAPTER-PRIVATE, AND THAT IS THE POINT. The canonical `Hook` carried this field
   * until 2026-08-05 and a canon cell filled it with claude tool names; the shape now
   * has no such field, so a selector can only ever be a harness fact — either
   * COMPUTED from the act (`canonicalActToClaude`) or, here, round-tripped from bytes
   * this harness itself wrote. The computed one wins when both are present.
   */
  matcher?: string;
}

/** The Claude `settings.json` `hooks` block shape: native-event → entries, each
 *  entry an optional matcher + `if` filter + one-or-more hook commands
 *  (`command`, or a lifted non-command type such as `prompt`). */
export type ClaudeHooksBlock = Record<
  string,
  Array<{
    matcher?: string;
    /** Permission-rule filter (v2.1.85+). */
    if?: string;
    hooks: Array<{
      type: 'command' | string;
      command?: string;
      /** Present when `type !== 'command'` (e.g. `type: 'prompt'`). */
      prompt?: string;
      timeout?: number;
      /** forge hook id, embedded so a re-read of these bytes preserves it. */
      id?: string;
      env?: Record<string, string>;
    }>;
  }>
>;

/** Serialize forge `Hook`s into the Claude `settings.json` `hooks` block,
 *  collecting per-event losses. The standalone (no caller-allocated arrays)
 *  public entry, and the one the live projection uses
 *  (`claudeHarnessAdapter.hooks`). The array-threaded form below stays exported
 *  for a caller that needs its losses to join a larger report. */
export function serializeClaudeHooksReport(hooks: Hook[]): {
  filename: string;
  hooks: ClaudeHooksBlock;
  warnings: string[];
  skipped: { path: string; reason: string }[];
} {
  const warnings: string[] = [];
  const skipped: { path: string; reason: string }[] = [];
  const block = serializeClaudeHooks(hooks, warnings, skipped);
  return { filename: 'settings.json', hooks: block, warnings, skipped };
}

/** The array-threaded form: emission order is CALLER order — the caller's
 *  `Hook[]` sequence is preserved per event, which is load-bearing (a blocking
 *  stance gate must precede a non-blocking nudge). Never sort here. */
export function serializeClaudeHooks(
  hooks: Hook[],
  warnings: string[],
  skipped: { path: string; reason: string }[],
): ClaudeHooksBlock {
  const out: ClaudeHooksBlock = {};
  for (const hook of hooks) {
    const ch = hook as ClaudeHook;
    for (const event of hook.events) {
      // The act's native pair, COMPUTED here — the cell named the act and nothing
      // else, so this is the only place the tool names can enter.
      const binding = claudeBindingOf(event);
      if (!binding) {
        warnings.push(
          `hook '${hook.id ?? '?'}': canonical event '${event}' has no Claude equivalent`,
        );
        skipped.push({
          path: `hooks/${hook.id ?? '?'}.yaml`,
          reason: `no Claude mapping for ${event}`,
        });
        continue;
      }
      const claudeEvent = binding.event;
      // A hook lifted from a non-command native type (e.g. `prompt`)
      // carries its adapter-private `kind`; round-trip it to the SAME native
      // shape rather than misrepresenting it as `type: command`.
      const isPrompt = ch.kind !== undefined && ch.kind !== 'command';
      const cmd: ClaudeHooksBlock[string][number]['hooks'][number] = isPrompt
        ? { type: ch.kind as string, prompt: hook.command }
        : { type: 'command', command: hook.command };
      if (hook.timeout !== undefined) cmd.timeout = hook.timeout;
      if (hook.id !== undefined) cmd.id = hook.id; // stable across reimport
      if (ch.env !== undefined) cmd.env = ch.env;
      const entry: ClaudeHooksBlock[string][number] = {
        hooks: [cmd],
      };
      const matcher = binding.matcher ?? ch.matcher;
      if (matcher) entry.matcher = matcher;
      // A harness that can FIRE an act but not NARROW it says so — the channel
      // exists on every adapter, so no adapter can lose a narrowing in silence.
      if (binding.unnarrowed)
        warnings.push(
          `hook '${hook.id ?? '?'}': act '${event}' fires as claude '${claudeEvent}', but ${binding.unnarrowed}`,
        );
      if (ch.if !== undefined) entry.if = ch.if;
      out[claudeEvent] ??= [];
      out[claudeEvent].push(entry);
    }
  }
  return out;
}
