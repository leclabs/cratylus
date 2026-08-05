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
import { RUNTIME_BIN } from './bin-name.js';

/** Where the host config lives, unless `$AGENT_RUNTIME_CONFIG` overrides it. */
export const RUNTIME_CONFIG_ENV = 'AGENT_RUNTIME_CONFIG';
// Derived, never a second literal. The host config dotfile is named AFTER the bin,
// so an independent copy is a rename waiting to orphan every host's existing file —
// the config would move while the file on disk did not. One home, in `bin-name.ts`.
export const RUNTIME_CONFIG_NAME = `.${RUNTIME_BIN}.json`;

/** The host's declared capability providers. */
export interface RuntimeConfig {
  /** Dir whose `node_modules` the specifiers resolve against. */
  readonly resolveFrom?: string;
  /** Capability provider package specifiers, in registration order. */
  readonly capabilities: readonly string[];
}

/** The config path: `$AGENT_RUNTIME_CONFIG` ▸ `~/.cratylus-run.json`. */
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
    if (capabilities.length === 0) return null;
    return {
      capabilities,
      ...(typeof raw.resolveFrom === 'string'
        ? { resolveFrom: raw.resolveFrom }
        : {}),
    };
  } catch {
    // A malformed config must not wedge the runtime; the default set still loads.
    return null;
  }
}
