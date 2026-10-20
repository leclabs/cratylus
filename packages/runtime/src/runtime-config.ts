// ─────────────────────────────────────────────────────────────────────────────
// The INSTALLATION and its RUNTIME CONFIG — what the projection told this host.
//
// Everything cratylus places for a user on a harness lives under one root it owns,
// `~/.cratylus/<harness>/` (the owned root): the corpus's agents and skills, the
// harness's adapters, the version of cratylus that projected them (`package.json`'s
// `version`), where the corpus declares any, each capability's configuration
// (`runtime.json`), and the contexts the release delivers (`delivered/<origin>/
// <context>.json`, read-only). The runtime reads them from there.
//
// WHICH INSTALLATION. A harness's adapter names the root it was placed in on every
// call it makes (`$CRATYLUS_INSTALLATION`), so a capability reached from a harness
// reads the installation that harness runs. Called by the operator with none named,
// it is the project installation nearest above the working directory, as the harness
// would load there, else the one installation under the home, when there is exactly one.
//
// WHICH SCOPE. An installation's record (`installation.json`) says whether it is the
// user's or a project's (`scope`); a record that says neither, or none at all, is the
// user's, installed before there were scopes.
//
// WHY NOT vite's exact shape. Vite resolves `vite.config.ts` from the project it
// runs in. This runtime is installed GLOBALLY and invoked from arbitrary cwd, so
// there is no project to resolve from. The declaration still lives in
// config-is-code at the consumer's site; INSTALL realizes it into the owned root,
// and the runtime reads that. Same direction of authority as every other artifact
// here: declare → project → consume.
// ─────────────────────────────────────────────────────────────────────────────

import { type Dirent, existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { CLI_BIN } from './bin-name.js';
import {
  type DeliveredContext,
  byDelivery,
  deliveredFrom,
} from './capabilities/concepts/delivered.js';

/** The variable a harness's adapter names its installation's root in. Derived from
 *  the bin, never a second literal. */
export const INSTALLATION_ENV = `${CLI_BIN.toUpperCase()}_INSTALLATION`;

/** The directory under the home that holds every installation, one per harness:
 *  `.<bin>`, derived from the bin. */
export const INSTALLATIONS_DIR = `.${CLI_BIN}`;

/** The runtime config's file in an installation's root. */
export const RUNTIME_CONFIG_FILE = 'runtime.json';

/** The directory in an installation's root holding the contexts its release
 *  delivers, one document per context: `<origin>/<context>.json`. */
export const DELIVERED_DIR = 'delivered';

/** Where the config is read from instead, when set. */
export const RUNTIME_CONFIG_ENV = 'AGENT_RUNTIME_CONFIG';

// Derived, never a second literal. The EARLIER layout's host config, at the home
// itself, named after the bin: nothing reads it now, and an upgrade removes it.
export const RUNTIME_CONFIG_NAME = `.${CLI_BIN}.json`;

/** The host's config: the corpus's capability configuration. */
export interface RuntimeConfig {
  /**
   * Each capability's configuration, keyed by capability, as the corpus's skills
   * declared it and install emitted it. Corpus meaning a capability acts on (states,
   * roles, names) arrives here and is spelled nowhere in this package. Opaque to
   * this reader: the capability that consumes its entry validates it. A capability
   * whose entry is absent must REFUSE and say so, never fall back to a set of its
   * own — a bundled fallback is how a second copy of corpus meaning gets in.
   */
  readonly configuration?: Readonly<Record<string, unknown>>;
}

/** Why no installation could be read: none is named and the home holds none, or
 *  holds several. */
export class NoInstallationError extends Error {}

/** An installation's scope: the user's, for every project, or one project's own. */
export type InstallScope = 'user' | 'project';

/** The record in an installation's root of what install did, and its scope. */
export const INSTALLATION_RECORD_FILE = 'installation.json';

/** The scope the installation at `root` records; `user` where its record says none
 *  or cannot be read. */
export function installationScope(root: string): InstallScope {
  return recordedScope(root) ?? 'user';
}

function recordedScope(root: string): InstallScope | null {
  try {
    const { scope } = JSON.parse(
      readFileSync(join(root, INSTALLATION_RECORD_FILE), 'utf8'),
    ) as { scope?: unknown };
    return scope === 'user' || scope === 'project' ? scope : null;
  } catch {
    return null;
  }
}

/**
 * The installation's root: the one `$CRATYLUS_INSTALLATION` names; else, walking up
 * from the working directory, the nearest ancestor but the home whose `.cratylus/`
 * holds exactly one installation recording project scope (a tree with no record, an
 * author's render, is none); else the one installation under the home. Refused,
 * naming what to do, where the home holds none or several and none is named.
 */
export function installationRoot(cwd = process.cwd()): string {
  const named = process.env[INSTALLATION_ENV];
  if (named !== undefined && named !== '') return named;
  const home = resolve(homedir());
  for (let dir = resolve(cwd); ; dir = dirname(dir)) {
    const owned = join(dir, INSTALLATIONS_DIR);
    if (dir !== home && existsSync(owned)) {
      const project = readdirSync(owned, { withFileTypes: true }).filter(
        (e) =>
          e.isDirectory() && recordedScope(join(owned, e.name)) === 'project',
      );
      if (project.length === 1) return join(owned, (project[0] as Dirent).name);
    }
    if (dirname(dir) === dir) break;
  }
  const parent = join(home, INSTALLATIONS_DIR);
  const found = existsSync(parent)
    ? readdirSync(parent, { withFileTypes: true })
        .filter(
          (e) =>
            e.isDirectory() && existsSync(join(parent, e.name, 'package.json')),
        )
        .map((e) => join(parent, e.name))
        .sort()
    : [];
  if (found.length === 1) return found[0] as string;
  throw new NoInstallationError(
    found.length === 0
      ? `no installation under ${parent}; run ${CLI_BIN} install`
      : `${found.length} installations under ${parent} (${found.join(', ')}); name one in $${INSTALLATION_ENV}`,
  );
}

/** The config path: `$AGENT_RUNTIME_CONFIG` ▸ the installation's `runtime.json`, or
 *  `null` where there is no installation to read it from. */
export function runtimeConfigPath(): string | null {
  const override = process.env[RUNTIME_CONFIG_ENV];
  if (override !== undefined && override !== '') return override;
  try {
    return join(installationRoot(), RUNTIME_CONFIG_FILE);
  } catch (e) {
    if (e instanceof NoInstallationError) return null;
    throw e;
  }
}

/** The contexts the installation reached delivers, by origin then position; none
 *  where there is no installation to read them from, or it delivers none. */
export function deliveredContexts(): DeliveredContext[] {
  let root: string;
  try {
    root = installationRoot();
  } catch (e) {
    if (e instanceof NoInstallationError) return [];
    throw e;
  }
  const dir = join(root, DELIVERED_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((origin) => origin.isDirectory())
    .flatMap((origin) =>
      readdirSync(join(dir, origin.name))
        .filter((name) => name.endsWith('.json'))
        .map((name) => {
          const file = join(dir, origin.name, name);
          return deliveredFrom(JSON.parse(readFileSync(file, 'utf8')), file);
        }),
    )
    .sort(byDelivery);
}

/**
 * Read the config, or `null` when absent/unreadable. Absence is NOT an error
 * here: a capability that needs a part of the config refuses on its own terms,
 * naming the command that writes it.
 *
 * A config carrying no capability configuration says nothing.
 */
export function loadRuntimeConfig(
  path = runtimeConfigPath(),
): RuntimeConfig | null {
  if (path === null || !existsSync(path)) return null;
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
