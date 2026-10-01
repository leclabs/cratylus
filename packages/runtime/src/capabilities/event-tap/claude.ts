// ─────────────────────────────────────────────────────────────────────────────
// The CLAUDE realization of the {@link EventTapHost} port.
//
// Relocated from forge's `runtime/event-tap/claude.ts` into the runtime capability,
// re-based onto the runtime-owned port (this capability imports ZERO from
// `@cratylus/forge`). Its Claude event map is INJECTED, not held: it arrives as
// configuration the projection emitted, because a private copy of forge's map is
// what "re-based onto the local Claude harness mapping" turned out to mean. `install`
// merges a PASSIVE logger entry into the target `settings.json` (foreign top-level
// keys AND foreign per-event entries preserved); `remove` surgically drops only
// the tap's own entry; `readCapture`/`status` derive from the target file so they
// are correct across separate CLI invocations (no reliance on in-process state).
// ─────────────────────────────────────────────────────────────────────────────

import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { CLI_BIN } from '../../bin-name.js';
import type { EventName } from '../../events.js';
import type {
  CaptureRow,
  CaptureSink,
  EventTapHost,
  EventTapStatus,
} from '../../ports/event-tap.js';
import type { RuntimeActBinding } from '../../runtime-config.js';
import {
  type ClaudeHooksBlock,
  type TapRestore,
  buildEventTapBlock,
  eventOfNative,
  mergeJsonKeys,
  reverseNativeEvents,
  selectsTool,
} from './claude-serialize.js';

/**
 * Stable id stamped on the tap's own logger entry so teardown can find and
 * surgically remove exactly it — every foreign entry in the target file is left
 * untouched.
 */
// Derived, never a second literal — and this one is PERSISTED IN USER SETTINGS, so a
// drift between it and the bin name does not merely rename a thing, it ORPHANS every
// installed tap: `uninstall` would look for an id no longer written by `install`.
export const EVENT_TAP_ID = `${CLI_BIN}-event-tap`;

/**
 * Resolve the target `settings.json` path, override-first: explicit ctor arg ▸
 * `$CLAUDE_SETTINGS_PATH` env ▸ `<cwd>/.claude/settings.json`. Lazy (read per
 * call) so an instance honours the environment of each invocation.
 */
function resolveSettingsPath(override: string | undefined): string {
  if (override !== undefined) return override;
  const env = process.env.CLAUDE_SETTINGS_PATH;
  if (env !== undefined && env.trim() !== '') return env;
  return join(process.cwd(), '.claude', 'settings.json');
}

/**
 * The passive observer command: copy the event JSON from stdin into the capture
 * stream, add a record separator, then always succeed. It writes NOTHING to its
 * own output channel and issues no decision, so it provably cannot block, deny,
 * or mutate the host — the {@link CaptureSink} non-interference contract.
 */
function loggerCommand(capturePath: string): string {
  const p = capturePath.replace(/'/g, `'\\''`);
  return `{ cat; printf '\\n'; } >> '${p}'; exit 0`;
}

/**
 * Recover the capture path a tap logger command writes to (the inverse of
 * {@link loggerCommand}). Lets `readCapture` find the sink from the installed
 * `settings.json` alone, so a fresh `eventTap read` process needs no in-memory state.
 */
function capturePathFromCommand(command: string): string | undefined {
  const m = command.match(/>> '(.*)'; exit 0$/);
  if (m === null || m[1] === undefined) return undefined;
  return m[1].replace(/'\\''/g, `'`);
}

function safeJson(line: string): unknown {
  try {
    return JSON.parse(line);
  } catch {
    return line;
  }
}

/** How many directories, counted up from `dir`, do not yet exist. */
function missingDirectories(dir: string): number {
  let missing = 0;
  for (let d = dir; !existsSync(d); d = dirname(d)) missing += 1;
  return missing;
}

/** Whether `hooks` already holds an entry of the tap's own. */
function holdsTapEntry(hooks: ClaudeHooksBlock | undefined): boolean {
  return Object.values(hooks ?? {}).some((entries) =>
    entries.some((e) => e.hooks.some((h) => h.id === EVENT_TAP_ID)),
  );
}

/** What the host holds at `settingsPath`, as {@link TapRestore} records it. */
function restoreOf(
  existing: string | undefined,
  settingsPath: string,
): TapRestore {
  if (existing === undefined) {
    return { created: missingDirectories(dirname(settingsPath)) };
  }
  if (existing.trim() === '') return { blank: existing };
  return {
    indent: /\n([ \t]+)\S/.exec(existing)?.[1] ?? '',
    trailer: /\s*$/.exec(existing)?.[0] ?? '',
  };
}

/** Serialize `value` in the layout the host's file had, else 2-space with a newline. */
function render(value: unknown, restore: TapRestore | undefined): string {
  if (restore !== undefined && 'indent' in restore) {
    return `${JSON.stringify(value, null, restore.indent)}${restore.trailer}`;
  }
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Remove `dir` and up to `count - 1` parents above it, stopping at the first that
 * holds anything: a directory install made is the host's once the host puts
 * something in it.
 */
function removeEmptyDirectories(dir: string, count: number): void {
  let d = dir;
  for (let i = 0; i < count; i += 1, d = dirname(d)) {
    try {
      rmdirSync(d);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENOTEMPTY' || code === 'EEXIST') return;
      throw err;
    }
  }
}

/**
 * What an install attached, against what was asked. Every requested event lands in
 * exactly one list: `tapped` are the ones the tap now observes, `skipped` are the
 * ones Claude Code fires no native event for.
 */
export interface EventTapInstall {
  readonly tapped: EventName[];
  readonly skipped: EventName[];
}

export class EventTapHostClaude implements EventTapHost {
  /**
   * The harness this strategy realizes the port for — the name its native event
   * names are asked for by (`nativeEventsOf(config, EventTapHostClaude.harness)`),
   * matching the adapter's `name` that deploy wrote the stanza under.
   */
  static readonly harness = 'claude';

  readonly #settingsPathOverride: string | undefined;
  readonly #native: Readonly<Record<EventName, string>>;
  readonly #acts: Readonly<Record<EventName, RuntimeActBinding>>;
  readonly #toEvent: Readonly<Record<string, EventName>>;
  #sinkPath: string | undefined;

  /**
   * @param settingsPath absolute path to the target `settings.json`; when omitted
   *  the path is resolved lazily from `$CLAUDE_SETTINGS_PATH` or the cwd's
   *  `.claude/settings.json` (so an instance is host-portable).
   * @param nativeEvents canonical event → claude native name, from the host config
   *  the projection emitted (`harnesses.claude.native`, read by `nativeEventsOf`).
   *  REQUIRED, and injected rather than known: this class held a private copy of
   *  forge's map, which is the duplication the vocabulary repair closed. A strategy
   *  that defaulted it would reopen the copy behind an optional parameter.
   * @param nativeActs canonical act → the claude ⟨event, matcher⟩ it realizes as, from
   *  the same stanza (`harnesses.claude.acts`, read by `nativeActsOf`). Empty for a
   *  stanza an earlier deploy wrote, whose act events are then skipped. REQUIRED for
   *  the reason `nativeEvents` is: an omitted map is one more place to know a binding.
   */
  constructor(
    settingsPath: string | undefined,
    nativeEvents: Readonly<Record<EventName, string>>,
    nativeActs: Readonly<Record<EventName, RuntimeActBinding>>,
  ) {
    this.#settingsPathOverride = settingsPath;
    this.#native = nativeEvents;
    this.#acts = nativeActs;
    this.#toEvent = reverseNativeEvents(nativeEvents);
  }

  get #settingsPath(): string {
    return resolveSettingsPath(this.#settingsPathOverride);
  }

  /**
   * Why an event this host cannot bind is skipped, said of `subject` (the event, or
   * the list of them).
   *
   * A stanza that carries NO act bindings is one an earlier deploy wrote, before they
   * existed — and then an event with no entry in `native` is either one Claude Code
   * fires nothing for or an act whose binding the stanza was never given. The runtime
   * cannot tell which (which events are acts is the corpus's to say, and arrives only
   * in the stanza's `acts`), so it names both and the deploy that writes the binding,
   * rather than assert the first of a case that may be the second. A stanza that
   * carries act bindings but not this one is current, and the first is then the fact.
   */
  skipReason(subject: string): string {
    if (Object.keys(this.#acts).length === 0) {
      return (
        `this host's ${EventTapHostClaude.harness} stanza holds no act bindings (it was written before them), ` +
        `so the binding for ${subject} may be missing from it: \`${CLI_BIN} install --harness ${EventTapHostClaude.harness}\` ` +
        `(or \`${CLI_BIN} deploy --harness ${EventTapHostClaude.harness}\`) writes it; failing that, Claude Code has no native peer for ${subject}`
      );
    }
    return `Claude Code fires no native event for ${subject}`;
  }

  /**
   * Attach the tap to every event in `events` that Claude Code fires, and REPORT
   * which those were and which it does not fire — the port's `install` returns
   * nothing, and a strategy that dropped the second list on the floor let an
   * install that tapped nothing (or less than was asked) read as success. When NONE
   * of the requested events has a native peer it REFUSES, writing nothing: an
   * empty `hooks` block is a tap that is attached to nothing.
   */
  install(events: EventName[], sink: CaptureSink): EventTapInstall {
    if (events.length === 0) return { tapped: [], skipped: [] }; // nothing to observe

    const { block: tapBlock, skipped } = buildEventTapBlock(
      events,
      this.#native,
      this.#acts,
      loggerCommand(sink.path),
      EVENT_TAP_ID,
    );
    const tapped = events.filter((e) => !skipped.includes(e));
    if (tapped.length === 0) {
      throw new Error(
        `eventTap install: ${this.skipReason(skipped.join(', '))} — there is nothing to tap; nothing was written.`,
      );
    }
    this.#sinkPath = sink.path;

    const settingsPath = this.#settingsPath;
    const existing = existsSync(settingsPath)
      ? readFileSync(settingsPath, 'utf8')
      : undefined;
    const base: { hooks?: ClaudeHooksBlock } =
      existing && existing.trim() !== ''
        ? (JSON.parse(existing) as { hooks?: ClaudeHooksBlock })
        : {};

    // Install is what knows what the host held; uninstall runs in another process and
    // learns it from the stamp, not from memory. A file that already carries the
    // tap's entries is a second install over a first, which stamped what the host held.
    if (!holdsTapEntry(base.hooks)) {
      const restore = restoreOf(existing, settingsPath);
      for (const entries of Object.values(tapBlock)) {
        for (const entry of entries) {
          for (const hook of entry.hooks) hook.restore = restore;
        }
      }
    }

    // Merge per native event so a foreign entry under the same event survives
    // (the top-level key merge below preserves permissions/env/etc.).
    const mergedHooks: ClaudeHooksBlock = { ...(base.hooks ?? {}) };
    for (const [event, entries] of Object.entries(tapBlock)) {
      mergedHooks[event] = [...(mergedHooks[event] ?? []), ...entries];
    }

    mkdirSync(dirname(settingsPath), { recursive: true });
    writeFileSync(
      settingsPath,
      mergeJsonKeys(existing, { hooks: mergedHooks }),
      'utf8',
    );
    return { tapped, skipped };
  }

  remove(): void {
    const settingsPath = this.#settingsPath;
    if (!existsSync(settingsPath)) return;
    const text = readFileSync(settingsPath, 'utf8');
    if (text.trim() === '') return;
    const base = JSON.parse(text) as Record<string, unknown> & {
      hooks?: ClaudeHooksBlock;
    };
    const hooks = base.hooks;
    if (!hooks) return;

    // What the install stamped on its entries; any one will do.
    const restore = Object.values(hooks)
      .flat()
      .flatMap((e) => e.hooks)
      .find((h) => h.id === EVENT_TAP_ID && h.restore !== undefined)?.restore;

    const cleaned: ClaudeHooksBlock = {};
    for (const [event, entries] of Object.entries(hooks)) {
      const kept = entries
        .map((e) => ({
          ...e,
          hooks: e.hooks.filter((h) => h.id !== EVENT_TAP_ID),
        }))
        .filter((e) => e.hooks.length > 0);
      if (kept.length > 0) cleaned[event] = kept;
    }

    if (Object.keys(cleaned).length > 0) {
      writeFileSync(
        settingsPath,
        render({ ...base, hooks: cleaned }, restore),
        'utf8',
      );
      this.#sinkPath = undefined;
      return;
    }
    // No foreign entries remain: drop the whole key so nothing residual is left
    // behind (a bare `hooks: {}` would be residue).
    const { hooks: _removed, ...rest } = base;
    const nothingElse = Object.keys(rest).length === 0;
    if (nothingElse && restore !== undefined && 'created' in restore) {
      // The tap's entries were all the file held and install made the file: put the
      // host back as it was before install, file and the directories made for it.
      unlinkSync(settingsPath);
      removeEmptyDirectories(dirname(settingsPath), restore.created);
    } else if (nothingElse && restore !== undefined && 'blank' in restore) {
      writeFileSync(settingsPath, restore.blank, 'utf8');
    } else {
      writeFileSync(settingsPath, render(rest, restore), 'utf8');
    }
    this.#sinkPath = undefined;
  }

  readCapture(): CaptureRow[] {
    const sinkPath = this.#sinkPath ?? this.#recoverSinkPath();
    if (sinkPath === undefined || !existsSync(sinkPath)) return [];
    const rows: CaptureRow[] = [];
    for (const line of readFileSync(sinkPath, 'utf8').split('\n')) {
      if (line.trim() === '') continue;
      const payload = safeJson(line);
      const { hook_event_name: native, tool_name: tool } = (payload ?? {}) as {
        hook_event_name?: string;
        tool_name?: string;
      };
      const event =
        native !== undefined
          ? eventOfNative(
              this.#toEvent,
              this.#acts,
              native,
              tool === undefined
                ? undefined
                : (matcher) => selectsTool(matcher, tool),
            )
          : undefined;
      if (event === undefined) continue; // not a recognizable capture row
      rows.push({ event, payload });
    }
    return rows;
  }

  status(): EventTapStatus {
    const settingsPath = this.#settingsPath;
    if (!existsSync(settingsPath)) return { attached: false, events: [] };
    const text = readFileSync(settingsPath, 'utf8');
    if (text.trim() === '') return { attached: false, events: [] };
    const base = JSON.parse(text) as { hooks?: ClaudeHooksBlock };
    const events = new Set<EventName>();
    for (const [native, entries] of Object.entries(base.hooks ?? {})) {
      for (const entry of entries) {
        if (!entry.hooks.some((h) => h.id === EVENT_TAP_ID)) continue;
        const event = eventOfNative(
          this.#toEvent,
          this.#acts,
          native,
          entry.matcher === undefined
            ? undefined
            : (matcher) => matcher === entry.matcher,
        );
        if (event !== undefined) events.add(event);
      }
    }
    return { attached: events.size > 0, events: [...events] };
  }

  /**
   * Recover the sink path from the installed tap entry in `settings.json`, so a
   * fresh process (`eventTap read`) reads captures with no prior in-memory sink.
   */
  #recoverSinkPath(): string | undefined {
    const settingsPath = this.#settingsPath;
    if (!existsSync(settingsPath)) return undefined;
    const text = readFileSync(settingsPath, 'utf8');
    if (text.trim() === '') return undefined;
    const base = JSON.parse(text) as { hooks?: ClaudeHooksBlock };
    for (const entries of Object.values(base.hooks ?? {})) {
      for (const entry of entries) {
        for (const h of entry.hooks) {
          if (h.id === EVENT_TAP_ID && h.command !== undefined) {
            const path = capturePathFromCommand(h.command);
            if (path !== undefined) return path;
          }
        }
      }
    }
    return undefined;
  }
}
