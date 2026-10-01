// ─────────────────────────────────────────────────────────────────────────────
// The event-tap capability's CLAUDE SETTINGS-BLOCK boundary — the SHAPE of the
// artifact, and no longer any of its vocabulary.
//
// WHAT THIS FILE USED TO BE. Its header said the Claude event map was "carried here
// verbatim so the runtime capability owns its harness mapping and NEVER imports
// `@cratylus/forge`". The DAG half of that reasoning is sound and still holds; the
// conclusion drawn from it was not. Avoiding an import is not a licence to copy the
// thing the import would have carried — `lifecycleToClaude` was forge's
// `canonicalToClaude`, byte-identical in all 19 pairs, sitting inside the package
// ARCHITECTURE describes as knowing "no harness and no corpus".
//
// WHAT IT IS NOW. The map arrives as CONFIGURATION THE PROJECTION EMITTED (property
// 4): `deploy` writes the host config from the adapter's own `nativeEvents`, and the
// tap reads it. There is one map, and this module reads it rather than knowing it.
//
// WHAT LEGITIMATELY STAYS. A STRATEGY may name its target — ports abstract, and
// "every capability is pluggable, so a rich harness gets a proxying strategy and a
// poor one gets ours, selected by configuration rather than by code". The claude
// `settings.json` block SHAPE and the key-scoped merge are this strategy's
// mechanism, which is what this package is for. Only the vocabulary was the
// corpus's, and only the vocabulary left.
//
// THE SIGN IS `event-tap` / `eventTap`, NEVER `tap`. `buildTapBlock` shipped the
// rejected root in an exported identifier; it is `buildEventTapBlock`.
// ─────────────────────────────────────────────────────────────────────────────

import type { EventName } from '../../events.js';
import type { RuntimeActBinding } from '../../runtime-config.js';

/**
 * What the host held at the settings path before the install that stamps it, so that
 * teardown — a separate process — can put back what the host had and nothing else.
 * Stamped on the tap's own hook entries, ONLY by an install that finds none of the
 * tap's entries in the file already (a second install must not record the first's
 * output as what the host held).
 *
 * - `created`: there was no file; the install made it, and this many directories to
 *   hold it (0 when the directory already existed).
 * - `text`: the file held this text, byte for byte. Teardown writes it back when the
 *   host has changed nothing since; otherwise it takes out only the tap's entries.
 */
export type TapRestore = { created: number } | { text: string };

/**
 * The claude `settings.json` `hooks` block shape: native-event → entries, each
 * entry an optional matcher + one-or-more hook commands. The tap only ever emits
 * a single `command` hook stamped with its own id, but foreign entries under the
 * same event use the full shape, so the type stays faithful to what may be read.
 */
export type ClaudeHooksBlock = Record<
  string,
  Array<{
    matcher?: string;
    if?: string;
    hooks: Array<{
      type: string;
      command?: string;
      prompt?: string;
      timeout?: number;
      /** The stable id a tap entry is stamped with, so teardown finds it. */
      id?: string;
      /** What the host held before the install that stamped this entry. */
      restore?: TapRestore;
      env?: Record<string, string>;
    }>;
  }>
>;

/**
 * Invert a native map (canonical → native) into native → canonical.
 *
 * Derived per call from the CONFIGURED map rather than kept as a second constant: a
 * reverse map with an independent home is the same duplication one direction over,
 * and this one used to be `claudeToLifecycle`.
 */
export function reverseNativeEvents(
  native: Readonly<Record<EventName, string>>,
): Readonly<Record<string, EventName>> {
  return Object.fromEntries(
    Object.entries(native).map(([event, nativeName]) => [nativeName, event]),
  );
}

/**
 * Build the tap's own `hooks` block: one `command` entry per event the harness fires,
 * each stamped with `tapId` so surgical teardown can find exactly it. An event with
 * no binding is skipped (returned in `skipped`) and never fabricated — a passive
 * observer that invented a binding would be reporting on something the harness does
 * not fire.
 *
 * AN ACT IS BOUND BEFORE A PLAIN NAME, as the projection binds it: an act in `acts`
 * becomes an entry on its native event NARROWED by its matcher, so the tap observes
 * the act and not every tool call. Two acts with one ⟨event, matcher⟩ share the one
 * entry — the same command twice under one matcher would run twice.
 */
export function buildEventTapBlock(
  events: readonly EventName[],
  native: Readonly<Record<EventName, string>>,
  acts: Readonly<Record<EventName, RuntimeActBinding>>,
  command: string,
  tapId: string,
): { block: ClaudeHooksBlock; skipped: EventName[] } {
  const block: ClaudeHooksBlock = {};
  const skipped: EventName[] = [];
  for (const event of events) {
    const act = acts[event];
    const nativeName = act?.event ?? native[event];
    if (nativeName === undefined) {
      skipped.push(event);
      continue;
    }
    const entries = block[nativeName] ?? [];
    block[nativeName] = entries;
    if (act?.matcher !== undefined) {
      if (entries.some((e) => e.matcher === act.matcher)) continue;
      entries.push({
        matcher: act.matcher,
        hooks: [{ type: 'command', command, id: tapId }],
      });
    } else {
      entries.push({ hooks: [{ type: 'command', command, id: tapId }] });
    }
  }
  return { block, skipped };
}

/** Whether Claude Code's `matcher` selects `toolName` — the whole name, as a pattern. */
export function selectsTool(matcher: string, toolName: string): boolean {
  try {
    return new RegExp(`^(?:${matcher})$`).test(toolName);
  } catch {
    return matcher === toolName;
  }
}

/**
 * The event a native event stands for, given what narrows it: the first act whose
 * binding is that native event and whose matcher `selects` the occurrence, else the
 * plain canonical name of the native event. The act wins because it is the narrower
 * claim — `PreToolUse` on `AskUserQuestion` is `operator.consult.pre` before it is
 * `tool.use.pre`. A caller with nothing to narrow by passes no `selects`, and gets
 * the plain name. For a captured occurrence `selects` is {@link selectsTool} of the
 * tool it carried; for an installed entry it is equality with the entry's matcher.
 */
export function eventOfNative(
  toEvent: Readonly<Record<string, EventName>>,
  acts: Readonly<Record<EventName, RuntimeActBinding>>,
  nativeName: string,
  selects?: (matcher: string) => boolean,
): EventName | undefined {
  if (selects !== undefined) {
    for (const [event, act] of Object.entries(acts)) {
      if (
        act.event === nativeName &&
        act.matcher !== undefined &&
        selects(act.matcher)
      )
        return event;
    }
  }
  return toEvent[nativeName];
}

/**
 * Key-scoped JSON merge (relocated from forge's `core/engine/managed.ts`): parse
 * `existing` (undefined/blank ⇒ `{}`), set the owned top-level keys, leave every
 * foreign key untouched. Returns the serialized document (2-space indent, trailing
 * newline). Throws on invalid JSON — a corrupt target must refuse, never be
 * clobbered. This is the passive-preservation primitive: a tap merges only the
 * `hooks` key it owns; permissions/env/etc. survive byte-untouched.
 */
export function mergeJsonKeys(
  existing: string | undefined,
  owned: Record<string, unknown>,
): string {
  const base: Record<string, unknown> =
    existing === undefined || existing.trim() === ''
      ? {}
      : (JSON.parse(existing) as Record<string, unknown>);
  const merged = { ...base, ...owned };
  return `${JSON.stringify(merged, null, 2)}\n`;
}
