// ─────────────────────────────────────────────────────────────────────────────
// The runtime LOADER — host-install-based plugin discovery + a capability registry.
//
// The loader answers "which capabilities are present on THIS host, and by which
// plugin?" — the runtime counterpart to agent-forge's config `extends`, but the
// discovery axis is INSTALL, not config: a capability is present iff its package is
// node-resolvable in the host's install. `discover` probes a set of `@leclabs/*`
// capability-package specifiers by dynamic `import()` (STRINGS, never static deps —
// the runtime deps no capability package); an unresolvable specifier means "not
// installed here" and is skipped, a present-but-broken one faults loudly.
//
// The {@link RuntimeHost} folds discovered/registered {@link RuntimePlugin}s into a
// capability→binding index the dispatcher resolves against. Registration is by the
// IMPORTED BINDING (S1 law), addressed at dispatch time by capability name. A second
// plugin claiming an already-bound capability, a duplicate plugin `name`, or a
// plugin that provides no capability each fails LOUD — never a silent last-wins.
// ─────────────────────────────────────────────────────────────────────────────

import type { RuntimePlugin } from './plugin.js';
import type { EventTapHost } from './ports/event-tap.js';
import type { MemoryStrategy } from './ports/memory.js';

/**
 * The capability keyspace — the dispatch `<capability>` axis. One entry per
 * capability port a {@link RuntimePlugin} may provide, mirroring the plugin's
 * optional port fields one-for-one. Iterable so a plugin's provided set is a
 * `filter` over it (DRY: the port fields and this tuple never drift by hand).
 */
export const CAPABILITIES = ['memory', 'eventTap'] as const;

/** A capability name — one of {@link CAPABILITIES}. The dispatch `<capability>`. */
export type Capability = (typeof CAPABILITIES)[number];

/** The typed port a capability resolves to: the S1 contract for that capability. */
export type CapabilityPort = MemoryStrategy | EventTapHost;

/** A resolved capability: which plugin provides it, and the port to dispatch into. */
export interface CapabilityBinding {
  readonly capability: Capability;
  readonly pluginName: string;
  readonly port: CapabilityPort;
}

/** Narrow an arbitrary string to a known {@link Capability}. */
export function isCapability(name: string): name is Capability {
  return (CAPABILITIES as readonly string[]).includes(name);
}

/** The capabilities a plugin actually provides — a present, non-null port field. */
export function capabilitiesOf(plugin: RuntimePlugin): Capability[] {
  return CAPABILITIES.filter((cap) => plugin[cap] != null);
}

/**
 * Raised when a `<capability>` names no capability bound on this host — either an
 * unknown capability word or a known one no installed plugin provides. Carries the
 * bound set so the dispatcher can render a LOUD, actionable message.
 */
export class UnknownCapabilityError extends Error {
  constructor(
    readonly capability: string,
    readonly available: readonly Capability[],
  ) {
    const have = available.length > 0 ? available.join(', ') : '(none)';
    super(`unknown capability '${capability}'; bound on this host: ${have}`);
    this.name = 'UnknownCapabilityError';
  }
}

/**
 * The runtime host: the folded capability registry the dispatcher resolves
 * against. Built by {@link RuntimeHost.register} (explicit wiring / discovery) —
 * each provided capability is indexed once; a re-claim, a duplicate name, or a
 * no-capability plugin throws rather than silently overwriting.
 */
export class RuntimeHost {
  readonly #bindings = new Map<Capability, CapabilityBinding>();
  readonly #plugins: RuntimePlugin[] = [];

  /** Fold one plugin into the registry. Returns `this` for chaining. Throws loud
   *  on a duplicate name, a no-capability plugin, or a capability re-claim. */
  register(plugin: RuntimePlugin): this {
    if (this.#plugins.some((p) => p.name === plugin.name)) {
      throw new Error(
        `runtime: duplicate plugin name '${plugin.name}' — names are per-plugin unique`,
      );
    }
    const provided = capabilitiesOf(plugin);
    if (provided.length === 0) {
      throw new Error(
        `runtime: plugin '${plugin.name}' provides no capability (${CAPABILITIES.join(' | ')})`,
      );
    }
    for (const cap of provided) {
      const existing = this.#bindings.get(cap);
      if (existing) {
        throw new Error(
          `runtime: capability '${cap}' already bound by '${existing.pluginName}'; '${plugin.name}' conflicts`,
        );
      }
      // The port is present by `capabilitiesOf`'s non-null filter.
      this.#bindings.set(cap, {
        capability: cap,
        pluginName: plugin.name,
        port: plugin[cap] as CapabilityPort,
      });
    }
    this.#plugins.push(plugin);
    return this;
  }

  /** Resolve a `<capability>` to its binding, or throw {@link UnknownCapabilityError}. */
  resolve(capability: string): CapabilityBinding {
    const binding = isCapability(capability)
      ? this.#bindings.get(capability)
      : undefined;
    if (binding == null) {
      throw new UnknownCapabilityError(capability, this.capabilities());
    }
    return binding;
  }

  /** The capabilities bound on this host, in binding order. */
  capabilities(): Capability[] {
    return [...this.#bindings.keys()];
  }

  /** The plugins registered on this host, in registration order. */
  get plugins(): readonly RuntimePlugin[] {
    return this.#plugins;
  }
}

/**
 * The default `@leclabs/*` capability-package specifiers `discover` probes. These
 * are import STRINGS, not package dependencies — node resolution at runtime decides
 * presence, so the runtime never deps a capability package. S9/later shards extend
 * this as capability packages land.
 */
export const KNOWN_CAPABILITY_PACKAGES = ['@leclabs/agent-memory'] as const;

/**
 * A "specifier did not resolve" import failure — the package is not installed on
 * this host (as opposed to a present-but-broken package throwing during evaluation,
 * which must propagate LOUD). Recognized runtime-agnostically: node emits the
 * `ERR_MODULE_NOT_FOUND` / `ERR_PACKAGE_PATH_NOT_EXPORTED` codes, while a bundler's
 * resolver (Vite under vitest) throws a message-only "cannot find / failed to
 * resolve" error. Codes are matched first; the message is the runtime-agnostic
 * fallback and is NARROW (resolution wording only), so a package's own load-time
 * error is never misclassified as absent.
 */
function isModuleNotFound(err: unknown): boolean {
  const code = (err as { code?: unknown } | null)?.code;
  if (code === 'ERR_MODULE_NOT_FOUND' || code === 'MODULE_NOT_FOUND')
    return true;
  if (code === 'ERR_PACKAGE_PATH_NOT_EXPORTED') return true;
  const message = (err as { message?: unknown } | null)?.message;
  return (
    typeof message === 'string' &&
    /cannot find (package|module)|failed to (resolve|load) (import|url)/i.test(
      message,
    )
  );
}

/** Structural check: an imported `runtimePlugin` export shaped like a plugin. */
function isRuntimePlugin(value: unknown): value is RuntimePlugin {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { name?: unknown }).name === 'string'
  );
}

/**
 * Host-install-based discovery: dynamic-`import()` each specifier and collect its
 * `runtimePlugin` named export. A specifier that does not resolve is NOT installed
 * on this host and is skipped; a specifier that resolves but exports no valid
 * `runtimePlugin` is skipped (it is not a runtime capability package); any OTHER
 * import error (a present-but-broken package) propagates LOUD.
 */
export async function discover(
  specifiers: readonly string[] = KNOWN_CAPABILITY_PACKAGES,
): Promise<RuntimePlugin[]> {
  const found: RuntimePlugin[] = [];
  for (const spec of specifiers) {
    let mod: Record<string, unknown>;
    try {
      mod = (await import(spec)) as Record<string, unknown>;
    } catch (err) {
      if (isModuleNotFound(err)) continue;
      throw err;
    }
    const rp = mod.runtimePlugin;
    if (isRuntimePlugin(rp)) found.push(rp);
  }
  return found;
}

/**
 * Build a {@link RuntimeHost} from host-installed capability packages — discover,
 * then register each. The runtime bin's entrypoint; a capability re-claim among
 * installed packages surfaces here as a loud registration throw.
 */
export async function bootstrap(
  specifiers?: readonly string[],
): Promise<RuntimeHost> {
  const host = new RuntimeHost();
  for (const plugin of await discover(specifiers)) {
    host.register(plugin);
  }
  return host;
}
