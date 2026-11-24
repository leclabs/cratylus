// ─────────────────────────────────────────────────────────────────────────────
// The INSTALLATION — what the projection told this host.
//
// Everything cratylus places for a user on a harness lives under one root it owns,
// `~/.cratylus/<harness>/` (the owned root): the canon's agents and rules, the
// harness's adapters and the version of cratylus that projected them (`package.json`'s
// `version`). The runtime reads them from there.
//
// WHICH INSTALLATION. A harness's adapter names the root it was placed in on every
// call it makes (`$CRATYLUS_INSTALLATION`), so a capability reached from a harness
// reads the installation that harness runs. Called by the product owner with none named,
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

/** The variable a harness's adapter names its installation's root in. Derived from
 *  the bin, never a second literal. */
export const INSTALLATION_ENV = `${CLI_BIN.toUpperCase()}_INSTALLATION`;

/** The directory under the home that holds every installation, one per harness:
 *  `.<bin>`, derived from the bin. */
export const INSTALLATIONS_DIR = `.${CLI_BIN}`;

/** The variable that named the EARLIER layout's host config, which install and
 *  uninstall still take back. */
export const RUNTIME_CONFIG_ENV = 'AGENT_RUNTIME_CONFIG';

// Derived, never a second literal. The EARLIER layout's host config, at the home
// itself, named after the bin: nothing reads it now, and an upgrade removes it.
export const RUNTIME_CONFIG_NAME = `.${CLI_BIN}.json`;

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
