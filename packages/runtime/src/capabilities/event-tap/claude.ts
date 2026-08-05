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

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { RUNTIME_BIN } from '../../bin-name.js';
import type { EventName } from '../../events.js';
import type {
  CaptureRow,
  CaptureSink,
  EventTapHost,
  EventTapStatus,
} from '../../ports/event-tap.js';
import {
  type ClaudeHooksBlock,
  buildEventTapBlock,
  mergeJsonKeys,
  reverseNativeEvents,
} from './claude-serialize.js';

/**
 * Stable id stamped on the tap's own logger entry so teardown can find and
 * surgically remove exactly it — every foreign entry in the target file is left
 * untouched.
 */
// Derived, never a second literal — and this one is PERSISTED IN USER SETTINGS, so a
// drift between it and the bin name does not merely rename a thing, it ORPHANS every
// installed tap: `uninstall` would look for an id no longer written by `install`.
export const EVENT_TAP_ID = `${RUNTIME_BIN}-event-tap`;

/**
 * Resolve the target `settings.json` path, override-first (mirrors the memory
 * strategy's home resolution): explicit ctor arg ▸ `$CLAUDE_SETTINGS_PATH` env ▸
 * `<cwd>/.claude/settings.json`. Lazy (read per call) so a singleton plugin
 * instance honours the environment of each invocation.
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

export class EventTapHostClaude implements EventTapHost {
  readonly #settingsPathOverride: string | undefined;
  readonly #native: Readonly<Record<EventName, string>>;
  readonly #toEvent: Readonly<Record<string, EventName>>;
  #sinkPath: string | undefined;

  /**
   * @param settingsPath absolute path to the target `settings.json`; when omitted
   *  the path is resolved lazily from `$CLAUDE_SETTINGS_PATH` or the cwd's
   *  `.claude/settings.json` (so a plugin singleton is host-portable).
   * @param nativeEvents canonical event → claude native name, from the host config
   *  the projection emitted (`RuntimeConfig.events.native`). REQUIRED, and injected
   *  rather than known: this class held a private copy of forge's map, which is the
   *  duplication the vocabulary repair closed. A strategy that defaulted it would
   *  reopen the copy behind an optional parameter.
   */
  constructor(
    settingsPath: string | undefined,
    nativeEvents: Readonly<Record<EventName, string>>,
  ) {
    this.#settingsPathOverride = settingsPath;
    this.#native = nativeEvents;
    this.#toEvent = reverseNativeEvents(nativeEvents);
  }

  get #settingsPath(): string {
    return resolveSettingsPath(this.#settingsPathOverride);
  }

  install(events: EventName[], sink: CaptureSink): void {
    this.#sinkPath = sink.path;
    if (events.length === 0) return; // nothing to observe

    const { block: tapBlock } = buildEventTapBlock(
      events,
      this.#native,
      loggerCommand(sink.path),
      EVENT_TAP_ID,
    );

    const settingsPath = this.#settingsPath;
    const existing = existsSync(settingsPath)
      ? readFileSync(settingsPath, 'utf8')
      : undefined;
    const base: { hooks?: ClaudeHooksBlock } =
      existing && existing.trim() !== ''
        ? (JSON.parse(existing) as { hooks?: ClaudeHooksBlock })
        : {};

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
        mergeJsonKeys(text, { hooks: cleaned }),
        'utf8',
      );
    } else {
      // No foreign entries remain: drop the whole key so nothing residual is
      // left behind (a bare `hooks: {}` would be residue).
      const { hooks: _removed, ...rest } = base;
      writeFileSync(settingsPath, `${JSON.stringify(rest, null, 2)}\n`, 'utf8');
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
      const native = (payload as { hook_event_name?: string } | undefined)
        ?.hook_event_name;
      const event = native !== undefined ? this.#toEvent[native] : undefined;
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
      const owns = entries.some((e) =>
        e.hooks.some((h) => h.id === EVENT_TAP_ID),
      );
      if (!owns) continue;
      const event = this.#toEvent[native];
      if (event !== undefined) events.add(event);
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
