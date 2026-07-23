import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { claudeToCanonical } from '../../adapters/claude/events.js';
import {
  type ClaudeHooksBlock,
  serializeClaudeHooksReport,
} from '../../adapters/claude/write.js';
import { type Hook, mergeJsonKeys } from '../../core/index.js';
import type {
  Record as CaptureRow,
  CaptureSink,
  EventTapHost,
  LifecycleEvent,
  TapStatus,
} from './port.js';

/**
 * Stable id stamped on the tap's own logger entry so teardown can find and
 * surgically remove exactly it — every foreign entry in the target file is left
 * untouched.
 */
const TAP_ID = 'agent-forge-event-tap';

/**
 * The Claude realization of {@link EventTapHost}. `installTap` merges a PASSIVE
 * logger entry into the target's `settings.json` (foreign top-level keys AND
 * foreign entries preserved), reusing the canonical→native event mapping and
 * entry shape the projection adapter already owns. `removeTap` surgically drops
 * only the tap's own entry, restoring the file to its prior state.
 */
export class EventTapHostClaude implements EventTapHost {
  readonly #settingsPath: string;
  #sinkPath: string | undefined;

  /** @param settingsPath absolute path to the target `settings.json`. */
  constructor(settingsPath: string) {
    this.#settingsPath = settingsPath;
  }

  installTap(events: LifecycleEvent[], sink: CaptureSink): void {
    this.#sinkPath = sink.path;
    if (events.length === 0) return; // nothing to observe

    // Reuse the projection adapter's canonical→native mapping + entry shape by
    // routing our logger through a canonical Hook. `serializeClaudeHooksReport`
    // stamps our TAP_ID onto each emitted command (teardown keys off it).
    const hook: Hook = {
      id: TAP_ID,
      events: events as [LifecycleEvent, ...LifecycleEvent[]],
      command: loggerCommand(sink.path),
    };
    const { hooks: tapBlock } = serializeClaudeHooksReport([hook]);

    const existing = existsSync(this.#settingsPath)
      ? readFileSync(this.#settingsPath, 'utf8')
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

    mkdirSync(dirname(this.#settingsPath), { recursive: true });
    writeFileSync(
      this.#settingsPath,
      mergeJsonKeys(existing, { hooks: mergedHooks }),
      'utf8',
    );
  }

  removeTap(): void {
    if (!existsSync(this.#settingsPath)) return;
    const text = readFileSync(this.#settingsPath, 'utf8');
    if (text.trim() === '') return;
    const base = JSON.parse(text) as Record<string, unknown> & {
      hooks?: ClaudeHooksBlock;
    };
    const hooks = base.hooks;
    if (!hooks) return;

    const cleaned: ClaudeHooksBlock = {};
    for (const [event, entries] of Object.entries(hooks)) {
      const kept = entries
        .map((e) => ({ ...e, hooks: e.hooks.filter((h) => h.id !== TAP_ID) }))
        .filter((e) => e.hooks.length > 0);
      if (kept.length > 0) cleaned[event] = kept;
    }

    if (Object.keys(cleaned).length > 0) {
      writeFileSync(
        this.#settingsPath,
        mergeJsonKeys(text, { hooks: cleaned }),
        'utf8',
      );
    } else {
      // No foreign entries remain: drop the whole key so nothing residual is
      // left behind (a bare `hooks: {}` would be residue).
      const { hooks: _removed, ...rest } = base;
      writeFileSync(
        this.#settingsPath,
        `${JSON.stringify(rest, null, 2)}\n`,
        'utf8',
      );
    }
    this.#sinkPath = undefined;
  }

  readCapture(): CaptureRow[] {
    if (this.#sinkPath === undefined || !existsSync(this.#sinkPath)) return [];
    const rows: CaptureRow[] = [];
    for (const line of readFileSync(this.#sinkPath, 'utf8').split('\n')) {
      if (line.trim() === '') continue;
      const payload = safeJson(line);
      const native = (payload as { hook_event_name?: string } | undefined)
        ?.hook_event_name;
      const event =
        native !== undefined ? claudeToCanonical[native] : undefined;
      if (event === undefined) continue; // not a recognizable capture row
      rows.push({ event, payload });
    }
    return rows;
  }

  status(): TapStatus {
    if (!existsSync(this.#settingsPath)) return { attached: false, events: [] };
    const text = readFileSync(this.#settingsPath, 'utf8');
    if (text.trim() === '') return { attached: false, events: [] };
    const base = JSON.parse(text) as { hooks?: ClaudeHooksBlock };
    const events = new Set<LifecycleEvent>();
    for (const [native, entries] of Object.entries(base.hooks ?? {})) {
      const owns = entries.some((e) => e.hooks.some((h) => h.id === TAP_ID));
      if (!owns) continue;
      const canonical = claudeToCanonical[native];
      if (canonical !== undefined) events.add(canonical);
    }
    return { attached: events.size > 0, events: [...events] };
  }
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

function safeJson(line: string): unknown {
  try {
    return JSON.parse(line);
  } catch {
    return line;
  }
}
