// ─────────────────────────────────────────────────────────────────────────────
// VERSION SKEW — the version of cratylus that projected a harness's installation
// against the version of the cratylus command its capabilities reach.
//
// The installation records the version that projected it, as its `package.json`'s
// `version`; the command's version is its build's, handed in by the program that
// holds this command: its `cratylus` package's declared version, with the commit it
// was built from as build metadata where the build is no release, so a development
// build never reads as the release. The capability reports both and chooses nothing:
// neither build is preferred, and no call is redirected to another.
// The remedy for a difference is to install again with the cratylus in use, at the
// installation's own scope, which the harness's adapter says at every start of the harness.
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CLI_BIN } from '../../bin-name.js';
import { CAPABILITY_SUMMARIES } from '../../capability.js';
import type { CapabilityInterface, ExplainedVerb } from '../../explanation.js';
import {
  type InstallScope,
  installationRoot,
  installationScope,
} from '../../runtime-config.js';
import type { Verbs } from '../../verbs.js';
import { verbOf } from '../plan/argv.js';

export const VERBS = {
  report: {
    concept: 'version skew',
    effect: 'reads',
    purpose:
      'Report the version of cratylus that projected this installation (artifacts) and the version of the cratylus command its capabilities run (command), with the scope (user or project) and root of the installation; the versions differ where the installation was projected by another build',
    when: 'When a session starts warning of version skew, or to confirm which build projected the installation and which command it reaches',
  },
} as const satisfies Verbs<string, ExplainedVerb>;

export type VersionSkewVerb = keyof typeof VERBS;

export const VERSION_SKEW: CapabilityInterface = {
  name: 'version skew',
  purpose: CAPABILITY_SUMMARIES.versionSkew,
  when: `Whenever the installation's artifacts and the ${CLI_BIN} command may come from different builds: after the command is upgraded, or when a session warns of skew`,
  verbs: VERBS,
};

/** What `versionSkew report` prints. */
export interface VersionSkewReport {
  /** The version recorded by the cratylus that projected the installation. */
  readonly artifacts: string;
  /** The version of the cratylus command the capabilities reach. */
  readonly command: string;
  /** The installation's scope: the user's, or one project's. */
  readonly scope: InstallScope;
  /** The installation's root. */
  readonly installation: string;
}

/** Route `versionSkew <verb>` for the command whose own declared version is
 *  `command`. */
export function dispatchVersionSkew(
  argv: readonly string[],
  build: { readonly version?: string },
): VersionSkewReport {
  const verb: VersionSkewVerb = verbOf(argv, 'versionSkew', VERBS);
  const refuse = (message: string) =>
    new Error(`versionSkew ${verb}: ${message}`);
  if (build.version === undefined)
    throw refuse(`this ${CLI_BIN} command declares no version`);
  let installation: string;
  try {
    installation = installationRoot();
  } catch (e) {
    throw refuse((e as Error).message);
  }
  const manifest = join(installation, 'package.json');
  if (!existsSync(manifest))
    throw refuse(
      `${installation} records no version; run ${CLI_BIN} install again`,
    );
  const { version } = JSON.parse(readFileSync(manifest, 'utf8')) as {
    version?: unknown;
  };
  if (typeof version !== 'string')
    throw refuse(
      `${manifest} records no version; run ${CLI_BIN} install again`,
    );
  return {
    artifacts: version,
    command: build.version,
    scope: installationScope(installation),
    installation,
  };
}
