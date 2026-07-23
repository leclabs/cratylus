// ─────────────────────────────────────────────────────────────────────────────
// The event-tap capability's VERB SURFACE — `tap <verb> [args]`.
//
// The runtime kernel (S3) routes `agent-runtime tap <verb>` here: the tap owns
// the arg-parse for its own flags (`--events`, `--sink`, `--settings`) that a
// generic method-reflecting dispatcher cannot know. Verb → port method:
//   install → installTap · remove → removeTap · read → readCapture · status → status
// Unknown verb / unknown lifecycle event fails LOUD (throws) — never a silent
// no-op (matches the kernel's fail-loud contract).
// ─────────────────────────────────────────────────────────────────────────────

import { LIFECYCLE_EVENTS, type LifecycleEvent } from '../../events.js';
import type {
  Record as CaptureRow,
  EventTapHost,
  TapStatus,
} from '../../ports/event-tap.js';
import { EventTapHostClaude } from './claude.js';

/** The verbs the tap capability exposes, each routing to one port method. */
export type TapVerb = 'install' | 'remove' | 'read' | 'status';

/** A verb's outcome, discriminated by verb — the value the kernel serializes. */
export type TapResult =
  | { verb: 'install'; events: LifecycleEvent[]; sink: string }
  | { verb: 'remove' }
  | { verb: 'read'; records: CaptureRow[] }
  | { verb: 'status'; status: TapStatus };

const VERBS: ReadonlySet<string> = new Set([
  'install',
  'remove',
  'read',
  'status',
]);

const LIFECYCLE_SET: ReadonlySet<string> = new Set(LIFECYCLE_EVENTS);

/** Extract `--flag value` pairs (and bare flags) from an argv tail. */
function parseFlags(argv: string[]): Map<string, string> {
  const flags = new Map<string, string>();
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (tok === undefined || !tok.startsWith('--')) continue;
    const key = tok.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      flags.set(key, next);
      i++;
    } else {
      flags.set(key, '');
    }
  }
  return flags;
}

/** Parse + validate the `--events e1,e2,…` list against the lifecycle taxonomy. */
function parseEvents(raw: string | undefined): LifecycleEvent[] {
  if (raw === undefined || raw.trim() === '') {
    throw new Error('tap install: --events is required (comma-separated)');
  }
  const events: LifecycleEvent[] = [];
  for (const part of raw.split(',')) {
    const e = part.trim();
    if (e === '') continue;
    if (!LIFECYCLE_SET.has(e)) {
      throw new Error(
        `tap install: unknown lifecycle event '${e}' (see LIFECYCLE_EVENTS)`,
      );
    }
    events.push(e as LifecycleEvent);
  }
  if (events.length === 0) {
    throw new Error('tap install: --events resolved to an empty set');
  }
  return events;
}

/**
 * Route `tap <verb> [args]` to the tap port. `host` defaults to the Claude
 * realization targeting `--settings` (or the env/cwd default); the kernel may
 * inject the loaded plugin's `eventTap` instead. Passive by construction: no verb
 * blocks, denies, or mutates host control flow — `read`/`status` only observe.
 */
export function dispatchTap(argv: string[], host?: EventTapHost): TapResult {
  const [verb, ...rest] = argv;
  if (verb === undefined || !VERBS.has(verb)) {
    throw new Error(
      `tap: unknown verb '${verb ?? ''}' (expected install|remove|read|status)`,
    );
  }
  const flags = parseFlags(rest);
  const tap =
    host ?? new EventTapHostClaude(flags.get('settings') || undefined);

  switch (verb as TapVerb) {
    case 'install': {
      const events = parseEvents(flags.get('events'));
      const sink = flags.get('sink');
      if (sink === undefined || sink.trim() === '') {
        throw new Error('tap install: --sink <path> is required');
      }
      tap.installTap(events, { path: sink });
      return { verb: 'install', events, sink };
    }
    case 'remove':
      tap.removeTap();
      return { verb: 'remove' };
    case 'read':
      return { verb: 'read', records: tap.readCapture() };
    case 'status':
      return { verb: 'status', status: tap.status() };
  }
}
