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
 * It carries only what is the CORPUS's: `vocabulary`, every name the corpus
 * signifies. Validation runs against it, so a real-but-unmapped event is refused as
 * UNREALIZABLE ON THIS HARNESS rather than as an unknown word — the difference
 * between a shortfall and a typo. Which of those names a harness can fire, and under
 * what native name, is that harness's alone: see {@link RuntimeHarness}.
 */
export interface RuntimeEvents {
  /** Every event name the corpus declares, in its canonical order. */
  readonly vocabulary: readonly string[];
}

/**
 * One harness's stanza — `harnesses.<harness>` in the host config.
 *
 * ONE PER HARNESS, because one host runs several harnesses off the same runtime and
 * each names the corpus's events its own way. A single flat map let the last deploy
 * overwrite the first harness's names with the second's; a stanza per harness lets a
 * deploy write its own and leave every other one as it found it.
 */
export interface RuntimeHarness {
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
   * The corpus's lifecycle vocabulary. Absent on a config written before deploy
   * emitted one; a capability that needs it must then REFUSE and say so, never fall
   * back to a set of its own — a bundled fallback is how the second copy got there
   * in the first place.
   */
  readonly events?: RuntimeEvents;
  /**
   * Each harness's native event names, keyed by harness name. Read through
   * {@link nativeEventsOf}, which refuses for a harness with no stanza.
   */
  readonly harnesses?: Readonly<Record<string, RuntimeHarness>>;
  /**
   * Each capability's configuration, keyed by capability, as the corpus's skills
   * declared it and deploy emitted it. Corpus meaning a capability acts on (states,
   * roles, names) arrives here and is spelled nowhere in this package. Opaque to
   * this reader: the capability that consumes its entry validates it. The same rule
   * as `events` holds — a capability whose entry is absent must REFUSE and say so,
   * never fall back to a set of its own.
   */
  readonly configuration?: Readonly<Record<string, unknown>>;
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
 * A config carrying ONLY a vocabulary, ONLY harness stanzas, or ONLY capability
 * configuration, is a real config. The `capabilities.length` test used to be the
 * whole liveness check, and it silently discarded a document whose entire payload
 * was the corpus's event names — the deploy-emitted case, where the operator
 * declared no provider override at all.
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
    const harnesses = parseHarnesses(raw.harnesses);
    const configuration = parseConfiguration(raw.configuration);
    if (
      capabilities.length === 0 &&
      events === undefined &&
      harnesses === undefined &&
      configuration === undefined
    )
      return null;
    return {
      capabilities,
      ...(events !== undefined ? { events } : {}),
      ...(harnesses !== undefined ? { harnesses } : {}),
      ...(configuration !== undefined ? { configuration } : {}),
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
 * One harness's native event names, or a LOUD refusal naming the command that
 * writes them.
 *
 * The only way a capability reads native names, and it asks for ONE harness by
 * name: the names are that harness's alone, so there is no answer to "the native
 * names" without saying whose. A harness with no stanza is refused rather than
 * handed an empty map — a map with nothing in it attaches nothing while reporting
 * success. `install` is named first because it works on a bare host with no
 * project; `deploy` is the same write from inside one.
 */
export function nativeEventsOf(
  config: RuntimeConfig | null,
  harness: string,
): Readonly<Record<string, string>> {
  const stanza = config?.harnesses?.[harness];
  if (stanza === undefined) {
    throw new Error(
      `this host has no native event names for harness '${harness}' — the host ` +
        `runtime config ($${RUNTIME_CONFIG_ENV}, else ~/${RUNTIME_CONFIG_NAME}) has no ` +
        `\`harnesses.${harness}\` stanza. Run \`${CLI_BIN} install --harness ${harness}\` ` +
        `(zero-config, works on a bare host) or, from a project, \`${CLI_BIN} deploy ` +
        `--harness ${harness}\`; either writes the ${harness} stanza and leaves every other harness's as it found it.`,
    );
  }
  return stanza.native;
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
  const { vocabulary } = raw as { vocabulary?: unknown };
  const words = Array.isArray(vocabulary)
    ? vocabulary.filter((s): s is string => typeof s === 'string')
    : [];
  return words.length === 0 ? undefined : { vocabulary: words };
}

/**
 * Lift the `harnesses` block, or `undefined` when it holds no stanza.
 *
 * A stanza is `{ native: { <event>: <native name> } }`; an entry without a `native`
 * object is no stanza at all, so the reader refuses for that harness exactly as it
 * does for one never deployed. Non-string names are dropped, as `events` drops
 * non-string words.
 */
function parseHarnesses(
  raw: unknown,
): Readonly<Record<string, RuntimeHarness>> | undefined {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
    return undefined;
  const harnesses: Record<string, RuntimeHarness> = {};
  for (const [harness, stanza] of Object.entries(raw)) {
    const native = (stanza as { native?: unknown } | null)?.native;
    if (native === null || typeof native !== 'object' || Array.isArray(native))
      continue;
    const map: Record<string, string> = {};
    for (const [event, nativeName] of Object.entries(native)) {
      if (typeof nativeName === 'string') map[event] = nativeName;
    }
    harnesses[harness] = { native: map };
  }
  return Object.keys(harnesses).length === 0 ? undefined : harnesses;
}

/**
 * Lift the `configuration` block, or `undefined` when it is absent, malformed or
 * empty — the same reading `events` gets, for the same reason: a block that is not
 * a capability-keyed object says nothing, and "never told" and "told nothing"
 * must produce the same refusal in the capability that needed it.
 */
function parseConfiguration(
  raw: unknown,
): Readonly<Record<string, unknown>> | undefined {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
    return undefined;
  return Object.keys(raw).length === 0
    ? undefined
    : (raw as Readonly<Record<string, unknown>>);
}
