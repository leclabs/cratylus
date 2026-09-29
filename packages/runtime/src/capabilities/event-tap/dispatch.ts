// ─────────────────────────────────────────────────────────────────────────────
// The event-tap capability's VERB SURFACE — `eventTap <verb> [args]`.
//
// The runtime kernel routes `cratylus eventTap <verb>` here: the tap owns
// the arg-parse for its own flags (`--events`, `--sink`, `--settings`) that a
// generic method-reflecting dispatcher cannot know, declared beside its verbs.
// Verb → port method:
//   install → install · uninstall → remove · read → readCapture · status → status
// Unknown verb / unknown lifecycle event fails LOUD (throws) — never a silent
// no-op (matches the kernel's fail-loud contract). A flag the verb does not take
// is refused through `../../verb-flags.ts` before anything else: before the host
// config is read, and before any settings file or sink is touched.
//
// WHAT `--events` IS VALIDATED AGAINST. The corpus's vocabulary, read from the host
// config the projection emitted (`RuntimeConfig.events`) — ARCHITECTURE property 4.
// It used to be a `LIFECYCLE_EVENTS` tuple in `../../events.ts`: canon's 28 names,
// hand-copied into a package that "knows no harness and no corpus", agreeing with
// schema's generated copy by coincidence. An UNCONFIGURED host therefore cannot
// validate, and this dispatcher REFUSES rather than accepting anything or falling
// back to a bundled set — a bundled set is how the second copy got there.
//
// THE SIGN IS `event-tap` / `eventTap`, NEVER `tap`. One concept, two registers
// (the kebab↔camel map the corpus declares at `forge/src/core/anatomy-body.ts`'s
// `dimensionField`). `tap` fails circumscription — it carries *passive siphon on a
// stream* but not WHICH stream — so no identifier here abbreviates to it.
// ─────────────────────────────────────────────────────────────────────────────

import type { EventName } from '../../events.js';
import type {
  CaptureRow,
  EventTapHost,
  EventTapStatus,
} from '../../ports/event-tap.js';
import {
  type RuntimeConfig,
  type RuntimeEvents,
  loadRuntimeConfig,
  nativeEventsOf,
} from '../../runtime-config.js';
import { type VerbFlags, refuseUnknown } from '../../verb-flags.js';
import { EventTapHostClaude } from './claude.js';

/** The verbs the event-tap capability exposes, each routing to one port method. */
export type EventTapVerb = 'install' | 'uninstall' | 'read' | 'status';

/** A verb's outcome, discriminated by verb — the value the kernel serializes. */
export type EventTapResult =
  | { verb: 'install'; events: EventName[]; sink: string }
  | { verb: 'uninstall' }
  | { verb: 'read'; records: CaptureRow[] }
  | { verb: 'status'; status: EventTapStatus };

/** The event-tap's verbs, and the flags each takes. */
export const VERBS = {
  install: ['events', 'sink', 'settings'],
  uninstall: ['settings'],
  read: ['settings'],
  status: ['settings'],
} as const satisfies VerbFlags<EventTapVerb>;

/**
 * Extract `--flag value` pairs (and bare flags) from the argv tail of `verb`,
 * refusing every flag it does not take — a single-dash token (`-x`), a lone `-`
 * aside, among them.
 */
function parseFlags(verb: EventTapVerb, argv: string[]): Map<string, string> {
  const flags = new Map<string, string>();
  const given: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (tok === undefined) continue;
    if (!tok.startsWith('--')) {
      if (tok.startsWith('-') && tok !== '-')
        given.push(tok.split('=')[0] as string);
      continue;
    }
    given.push(tok);
    const key = tok.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      flags.set(key, next);
      i++;
    } else {
      flags.set(key, '');
    }
  }
  refuseUnknown('eventTap', verb, given, VERBS[verb]);
  return flags;
}

/**
 * The host's event vocabulary, or a LOUD refusal.
 *
 * Absence is not a degradation to route around: with no vocabulary this capability
 * cannot tell an unknown word from an event this harness does not fire. The error
 * names the file and the command that writes it. The harness's native names are a
 * separate ask, made by harness name through `nativeEventsOf`, which refuses on its
 * own terms when that harness has no stanza.
 */
function configuredEvents(config: RuntimeConfig | null): RuntimeEvents {
  const events = config?.events;
  if (events === undefined || events.vocabulary.length === 0) {
    throw new Error(
      'event-tap: this host has no lifecycle-event vocabulary — the corpus declares ' +
        'it and `cratylus deploy` emits it into the host runtime config ' +
        '($AGENT_RUNTIME_CONFIG, else ~/.cratylus.json). Run a deploy for this ' +
        'harness; the runtime does not carry a vocabulary of its own.',
    );
  }
  return events;
}

/** Parse + validate the `--events e1,e2,…` list against the configured vocabulary. */
function parseEvents(
  raw: string | undefined,
  vocabulary: readonly EventName[],
): EventName[] {
  if (raw === undefined || raw.trim() === '') {
    throw new Error(
      'event-tap install: --events is required (comma-separated)',
    );
  }
  const declared = new Set(vocabulary);
  const events: EventName[] = [];
  for (const part of raw.split(',')) {
    const e = part.trim();
    if (e === '') continue;
    if (!declared.has(e)) {
      throw new Error(
        `event-tap install: unknown lifecycle event '${e}' — this host's vocabulary is ` +
          `[${[...declared].join(', ')}]`,
      );
    }
    events.push(e);
  }
  if (events.length === 0) {
    throw new Error('event-tap install: --events resolved to an empty set');
  }
  return events;
}

/** What a caller may inject in place of what this dispatcher would resolve itself. */
export interface EventTapDispatchOpts {
  /**
   * The port realization. Defaults to the Claude one targeting `--settings` (or the
   * env/cwd default); the kernel may inject the loaded plugin's `eventTap` instead.
   */
  readonly host?: EventTapHost;
  /**
   * The host config. Defaults to the one on disk; injectable so a caller with a
   * config in hand does not re-read it, and so a test drives the same path a host
   * does rather than a second one.
   */
  readonly config?: RuntimeConfig | null;
}

/**
 * Route `eventTap <verb> [args]` to the event-tap port. Passive by construction: no
 * verb blocks, denies, or mutates host control flow — `read`/`status` only observe.
 */
export function dispatchEventTap(
  argv: string[],
  opts: EventTapDispatchOpts = {},
): EventTapResult {
  const [verb, ...rest] = argv;
  if (verb === undefined || !Object.hasOwn(VERBS, verb)) {
    throw new Error(
      `event-tap: unknown verb '${verb ?? ''}' (expected install|uninstall|read|status)`,
    );
  }
  const flags = parseFlags(verb as EventTapVerb, rest);
  const config = opts.config ?? loadRuntimeConfig();
  const configured = configuredEvents(config);
  const tap =
    opts.host ??
    new EventTapHostClaude(
      flags.get('settings') || undefined,
      nativeEventsOf(config, EventTapHostClaude.harness),
    );

  switch (verb as EventTapVerb) {
    case 'install': {
      const events = parseEvents(flags.get('events'), configured.vocabulary);
      const sink = flags.get('sink');
      if (sink === undefined || sink.trim() === '') {
        throw new Error('event-tap install: --sink <path> is required');
      }
      tap.install(events, { path: sink });
      return { verb: 'install', events, sink };
    }
    case 'uninstall':
      tap.remove();
      return { verb: 'uninstall' };
    case 'read':
      return { verb: 'read', records: tap.readCapture() };
    case 'status':
      return { verb: 'status', status: tap.status() };
  }
}
