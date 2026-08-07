// ─────────────────────────────────────────────────────────────────────────────
// The HOST RUNTIME CONFIG — which capability providers this host uses.
//
// WHY THIS EXISTS. A capability was a "plugin" in SHAPE only: the provider was
// hardcoded in three places (a static import in the CLI, a KNOWN_CAPABILITY_PACKAGES
// literal in the loader, a direct constructor in the memory CLI). Nothing could
// select a different MemoryStrategy, so the port's whole reason for existing —
// swappable strategies — was unreachable. A plugin architecture with no
// configuration surface is a shape, not a mechanism.
//
// WHY NOT vite's exact shape. Vite resolves `vite.config.ts` from the project it
// runs in. This runtime is installed GLOBALLY and invoked from arbitrary cwd (a
// deployed skill shim under the harness config home), so there is no project to
// resolve from. The declaration still lives in config-is-code at the consumer's
// site; DEPLOY realizes it into a host config, and the runtime reads that. Same
// direction of authority as every other artifact here: declare → project → consume.
//
// RESOLUTION. `resolveFrom` is the directory whose `node_modules` the specifiers
// resolve against — normally the site that installed them. This matters under an
// isolated store, where a globally-installed bin cannot see a package it does not
// declare: resolving from the site is what lets a THIRD-PARTY strategy load at all.
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { CLI_BIN } from './bin-name.js';

/** Where the host config lives, unless `$AGENT_RUNTIME_CONFIG` overrides it. */
export const RUNTIME_CONFIG_ENV = 'AGENT_RUNTIME_CONFIG';
// Derived, never a second literal. The host config dotfile is named AFTER the bin,
// so an independent copy is a rename waiting to orphan every host's existing file —
// the config would move while the file on disk did not. One home, in `bin-name.ts`.
export const RUNTIME_CONFIG_NAME = `.${CLI_BIN}.json`;

/**
 * The corpus's lifecycle-event vocabulary, as this host received it.
 *
 * WHY IT IS HERE AND NOT IN `events.ts`. `events.ts` used to carry 28 literals —
 * canon's vocabulary, hand-copied into the package ARCHITECTURE says "knows no
 * harness and no corpus", agreeing with schema's generated copy by coincidence.
 * Property 4 names the only channel a corpus fact may travel by: "everything
 * corpus-specific reaches it as configuration the projection emitted". This is that
 * configuration, and forge's `deploy/runtime-config.ts` is its producer.
 *
 * TWO FIELDS, because they answer different questions:
 *   · `vocabulary` — every name the corpus signifies. Validation runs against it, so
 *     a real-but-unmapped event is refused as UNREALIZABLE ON THIS HARNESS rather
 *     than as an unknown word. Collapsing the two into `native`'s keyspace would
 *     lose that distinction, and with it the difference between a shortfall and a
 *     typo.
 *   · `native` — this harness's peer name for each event it can actually fire. The
 *     map the event-tap capability used to hold as a private, byte-identical copy of
 *     forge's.
 */
export interface RuntimeEvents {
  /** Every event name the corpus declares, in its canonical order. */
  readonly vocabulary: readonly string[];
  /** Canonical name → this harness's native name, for the events it can fire. */
  readonly native: Readonly<Record<string, string>>;
}

/** The host's declared capability providers, and the vocabulary they speak. */
export interface RuntimeConfig {
  /** Dir whose `node_modules` the specifiers resolve against. */
  readonly resolveFrom?: string;
  /** Capability provider package specifiers, in registration order. */
  readonly capabilities: readonly string[];
  /**
   * The lifecycle vocabulary + this host's harness map. Absent on a config written
   * before deploy emitted one; a capability that needs it must then REFUSE and say
   * so, never fall back to a set of its own — a bundled fallback is how the second
   * copy got there in the first place.
   */
  readonly events?: RuntimeEvents;
}

/** The config path: `$AGENT_RUNTIME_CONFIG` ▸ `~/.cratylus.json`. */
export function runtimeConfigPath(): string {
  const override = process.env[RUNTIME_CONFIG_ENV];
  return override && override !== ''
    ? override
    : join(homedir(), RUNTIME_CONFIG_NAME);
}

/**
 * Read the host config, or `null` when absent/unreadable. Absence is NOT an error:
 * a bare install with no config falls back to the CLI's bundled default set, so
 * configuring is opt-in and the zero-config path keeps working.
 *
 * A config carrying ONLY a vocabulary is a real config. The `capabilities.length`
 * test used to be the whole liveness check, and it silently discarded a document
 * whose entire payload was the corpus's event names — the deploy-emitted case,
 * where the operator declared no provider override at all.
 */
export function loadRuntimeConfig(
  path = runtimeConfigPath(),
): RuntimeConfig | null {
  if (!existsSync(path)) return null;
  try {
    const raw = JSON.parse(
      readFileSync(path, 'utf-8'),
    ) as Partial<RuntimeConfig>;
    const capabilities = Array.isArray(raw.capabilities)
      ? raw.capabilities.filter((s): s is string => typeof s === 'string')
      : [];
    const events = parseEvents(raw.events);
    if (capabilities.length === 0 && events === undefined) return null;
    return {
      capabilities,
      ...(events !== undefined ? { events } : {}),
      ...(typeof raw.resolveFrom === 'string'
        ? { resolveFrom: raw.resolveFrom }
        : {}),
    };
  } catch {
    // A malformed config must not wedge the runtime; the default set still loads.
    return null;
  }
}

/**
 * Lift the `events` block, or `undefined` when it is absent or says nothing.
 *
 * An EMPTY vocabulary reads as absent on purpose. A present-but-empty block would
 * otherwise validate every event name to `false` while looking configured — the
 * difference between "this host was never told" and "this host was told nothing",
 * which are the same fact and must produce the same refusal.
 */
function parseEvents(raw: unknown): RuntimeEvents | undefined {
  if (raw === null || typeof raw !== 'object') return undefined;
  const { vocabulary, native } = raw as {
    vocabulary?: unknown;
    native?: unknown;
  };
  const words = Array.isArray(vocabulary)
    ? vocabulary.filter((s): s is string => typeof s === 'string')
    : [];
  if (words.length === 0) return undefined;
  const map: Record<string, string> = {};
  if (native !== null && typeof native === 'object') {
    for (const [event, nativeName] of Object.entries(
      native as Record<string, unknown>,
    )) {
      if (typeof nativeName === 'string') map[event] = nativeName;
    }
  }
  return { vocabulary: words, native: map };
}
