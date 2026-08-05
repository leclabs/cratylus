// The canonical `Hook` → Claude `settings.json` `hooks` block serializer. The ONE
// function that emits those bytes, for BOTH callers: the render projection port
// (`claudeHarnessAdapter.hooks`, the live `project → deploy` path) and the IR
// resource writer (`write.ts` / `bundle.ts`). It lives HERE, beside `render.ts`,
// rather than inside `write.ts`, because hook projection is not an IR concern:
// the live path lifts an anatomy `HookCell` into a `Hook` and needs this and
// nothing else from the write tree (S3).
//
// A LEAF-ADJACENT module by construction: it imports only the sibling event map
// and `core/hook` — the harness-agnostic vocabulary `Hook`/`CanonicalEvent` live
// in (S2). It must never reach `core/ir`.

import type { Hook } from '@cratylus/schema/hook';
import { canonicalToClaude } from './events.js';

/**
 * Adapter-private Hook extension fields — never part of the canonical hook
 * schema, carried only so a read→write round trip inside THIS adapter stays
 * lossless for Claude-specific hook shape ([CC6]: `if` filter, per-command
 * `env`, non-command `type`s like `prompt`). A cross-adapter consumer sees a
 * plain `Hook` (structurally compatible; the extra keys are simply ignored).
 */
export interface ClaudeHook extends Hook {
  if?: string;
  env?: Record<string, string>;
  /** Native hook `type` when not `'command'` (e.g. `'prompt'`) [CC6]. */
  kind?: string;
}

/** The Claude `settings.json` `hooks` block shape: native-event → entries, each
 *  entry an optional matcher + `if` filter + one-or-more hook commands
 *  (`command`, or a lifted non-command type such as `prompt`) [CC6]. */
export type ClaudeHooksBlock = Record<
  string,
  Array<{
    matcher?: string;
    /** Permission-rule filter (v2.1.85+) [CC6]. */
    if?: string;
    hooks: Array<{
      type: 'command' | string;
      command?: string;
      /** Present when `type !== 'command'` (e.g. `type: 'prompt'`) [CC6]. */
      prompt?: string;
      timeout?: number;
      /** forge hook id, embedded so reimport preserves it (E3.S2). */
      id?: string;
      env?: Record<string, string>;
    }>;
  }>
>;

/** Serialize forge `Hook`s into the Claude `settings.json` `hooks` block,
 *  collecting per-event losses. The standalone (no caller-allocated arrays)
 *  public entry, used by `claudeHarnessAdapter.hooks` and the plugin-bundle
 *  emitter; `writeClaude` uses the array-threaded `serializeClaudeHooks`
 *  directly so its losses join the surrounding `WriteReport`. */
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
      const claudeEvent = canonicalToClaude[event];
      if (!claudeEvent) {
        warnings.push(
          `hook '${hook.id ?? '?'}': canonical event '${event}' has no Claude equivalent`,
        );
        skipped.push({
          path: `hooks/${hook.id ?? '?'}.yaml`,
          reason: `no Claude mapping for ${event}`,
        });
        continue;
      }
      // A hook lifted from a non-command native type (e.g. `prompt` [CC6])
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
      if (hook.matcher) entry.matcher = hook.matcher;
      if (ch.if !== undefined) entry.if = ch.if;
      out[claudeEvent] ??= [];
      out[claudeEvent].push(entry);
    }
  }
  return out;
}
