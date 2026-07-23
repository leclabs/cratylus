// ─────────────────────────────────────────────────────────────────────────────
// The CLAUDE realization of the {@link EventTapHost} port.
//
// Relocated from agent-forge's `runtime/event-tap/claude.ts` into the runtime
// capability, re-based onto the runtime-owned port + the local Claude harness
// mapping (this capability imports ZERO from `@leclabs/agent-forge`). `installTap`
// merges a PASSIVE logger entry into the target `settings.json` (foreign top-level
// keys AND foreign per-event entries preserved); `removeTap` surgically drops only
// the tap's own entry; `readCapture`/`status` derive from the target file so they
// are correct across separate CLI invocations (no reliance on in-process state).
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { LifecycleEvent } from '../../events.js';
import type {
  Record as CaptureRow,
  CaptureSink,
  EventTapHost,
  TapStatus,
} from '../../ports/event-tap.js';
import {
  type ClaudeHooksBlock,
  buildTapBlock,
  claudeToLifecycle,
  mergeJsonKeys,
} from './claude-serialize.js';

/**
 * Stable id stamped on the tap's own logger entry so teardown can find and
 * surgically remove exactly it — every foreign entry in the target file is left
 * untouched.
 */
export const TAP_ID = 'agent-runtime-event-tap';

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
 * `settings.json` alone, so a fresh `tap read` process needs no in-memory state.
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
  #sinkPath: string | undefined;

  /** @param settingsPath absolute path to the target `settings.json`; when
   *  omitted the path is resolved lazily from `$CLAUDE_SETTINGS_PATH` or the
   *  cwd's `.claude/settings.json` (so a plugin singleton is host-portable). */
  constructor(settingsPath?: string) {
    this.#settingsPathOverride = settingsPath;
  }

  get #settingsPath(): string {
    return resolveSettingsPath(this.#settingsPathOverride);
  }

  installTap(events: LifecycleEvent[], sink: CaptureSink): void {
    this.#sinkPath = sink.path;
    if (events.length === 0) return; // nothing to observe

    const { block: tapBlock } = buildTapBlock(
      events,
      loggerCommand(sink.path),
      TAP_ID,
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

  removeTap(): void {
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
        .map((e) => ({ ...e, hooks: e.hooks.filter((h) => h.id !== TAP_ID) }))
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
      const event =
        native !== undefined ? claudeToLifecycle[native] : undefined;
      if (event === undefined) continue; // not a recognizable capture row
      rows.push({ event, payload });
    }
    return rows;
  }

  status(): TapStatus {
    const settingsPath = this.#settingsPath;
    if (!existsSync(settingsPath)) return { attached: false, events: [] };
    const text = readFileSync(settingsPath, 'utf8');
    if (text.trim() === '') return { attached: false, events: [] };
    const base = JSON.parse(text) as { hooks?: ClaudeHooksBlock };
    const events = new Set<LifecycleEvent>();
    for (const [native, entries] of Object.entries(base.hooks ?? {})) {
      const owns = entries.some((e) => e.hooks.some((h) => h.id === TAP_ID));
      if (!owns) continue;
      const lifecycle = claudeToLifecycle[native];
      if (lifecycle !== undefined) events.add(lifecycle);
    }
    return { attached: events.size > 0, events: [...events] };
  }

  /**
   * Recover the sink path from the installed tap entry in `settings.json`, so a
   * fresh process (`tap read`) reads captures with no prior in-memory sink.
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
          if (h.id === TAP_ID && h.command !== undefined) {
            const path = capturePathFromCommand(h.command);
            if (path !== undefined) return path;
          }
        }
      }
    }
    return undefined;
  }
}
