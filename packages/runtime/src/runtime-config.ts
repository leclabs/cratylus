// ─────────────────────────────────────────────────────────────────────────────
// The HOST RUNTIME CONFIG — what the projection told this host about the corpus.
//
// It carries each capability's configuration, as the corpus's skills declared it.
// Which capabilities exist is not among them: they ship inside the runtime and are
// known when it is built.
//
// WHY NOT vite's exact shape. Vite resolves `vite.config.ts` from the project it
// runs in. This runtime is installed GLOBALLY and invoked from arbitrary cwd (a
// deployed skill shim under the harness config home), so there is no project to
// resolve from. The declaration still lives in config-is-code at the consumer's
// site; DEPLOY realizes it into a host config, and the runtime reads that. Same
// direction of authority as every other artifact here: declare → project → consume.
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

/** The host's config: the corpus's capability configuration. */
export interface RuntimeConfig {
  /**
   * Each capability's configuration, keyed by capability, as the corpus's skills
   * declared it and deploy emitted it. Corpus meaning a capability acts on (states,
   * roles, names) arrives here and is spelled nowhere in this package. Opaque to
   * this reader: the capability that consumes its entry validates it. A capability
   * whose entry is absent must REFUSE and say so, never fall back to a set of its
   * own — a bundled fallback is how a second copy of corpus meaning gets in.
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
 * Read the host config, or `null` when absent/unreadable. Absence is NOT an error
 * here: a capability that needs a part of the config refuses on its own terms,
 * naming the command that writes it.
 *
 * A config carrying no capability configuration says nothing.
 */
export function loadRuntimeConfig(
  path = runtimeConfigPath(),
): RuntimeConfig | null {
  if (!existsSync(path)) return null;
  try {
    const raw = JSON.parse(
      readFileSync(path, 'utf-8'),
    ) as Partial<RuntimeConfig>;
    const configuration = parseConfiguration(raw.configuration);
    return configuration === undefined ? null : { configuration };
  } catch {
    // A malformed config must not wedge the runtime; it reads as none.
    return null;
  }
}

/**
 * Lift the `configuration` block, or `undefined` when it is absent, malformed or
 * empty: a block that is not a capability-keyed object says nothing, and "never
 * told" and "told nothing" must produce the same refusal in the capability that
 * needed it.
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
