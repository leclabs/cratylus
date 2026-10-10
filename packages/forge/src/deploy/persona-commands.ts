// Persona commands — RETIRED; what remains takes away the ones earlier installs linked.
//
// An install used to link `<home>/.local/bin/<persona>` to the harness's generic
// launcher, so a persona could be started by its name. Starting a session as an agent
// now goes only through the harness itself (`omp --agent <name>`), so install links no
// command and places no launcher. The links an earlier install placed or adopted are
// still recorded in the harness's deploy manifest (`DeployManifest.personaLinks`), and
// this module removes exactly those: install does so on every run, uninstall too.
//
// THE BIN DIR IS NOT OURS. A link is ours only if it is RECORDED, and only while it is
// still a symlink into this harness's own home, where the launcher it was linked to
// sat. Its target need not exist: a reinstall prunes the launcher before this runs. A
// recorded name since taken by anything else — a regular file, a link elsewhere — is
// the operator's now: it is reported, dropped from the record, and left as it is.

import { existsSync, lstatSync, readlinkSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { readManifest, writeManifest } from './manifest.js';

/** What a removal did to one recorded command. `remove` is a dry run's `removed`. */
export type PersonaRemovalState = 'removed' | 'remove' | 'kept' | 'gone';

export interface PersonaRemoval {
  /** Absolute path of the command. */
  readonly link: string;
  readonly state: PersonaRemovalState;
  /** Kept only: why it was left. */
  readonly reason?: string;
  /** Kept only: what occupies the name. */
  readonly current?: string;
}

export interface PersonaRemovalReport {
  readonly links: readonly PersonaRemoval[];
}

export interface PersonaRemovalOpts {
  /** The user's HOME, which every recorded link is relative to. */
  readonly home: string;
  /** This harness's deploy root (`harnessDirIn`), where its manifest lives. */
  readonly harnessDir: string;
  readonly dry?: boolean;
}

/** `readlink`, or `undefined` when the entry is not a symlink (or is absent). */
function linkTarget(path: string): string | undefined {
  try {
    return readlinkSync(path);
  } catch {
    return undefined;
  }
}

/** What occupies `path`, for a report: a link's target, or the kind of thing. */
function occupant(path: string): string {
  const target = linkTarget(path);
  if (target !== undefined) return target;
  return lstatSync(path).isDirectory() ? 'a directory' : 'a regular file';
}

/**
 * Remove every persona command the record lists that is still a symlink into
 * `harnessDir`, and forget every recorded one: removed, already gone, or since
 * replaced (which is left and reported). Under `dry` nothing is removed and the
 * record is unchanged.
 */
export function removePersonaCommands(
  opts: PersonaRemovalOpts,
): PersonaRemovalReport {
  const manifest = readManifest(opts.harnessDir);
  if (manifest.personaLinks.length === 0) return { links: [] };
  const inside = `${resolve(opts.harnessDir)}${sep}`;
  const links: PersonaRemoval[] = [];
  for (const rel of [...manifest.personaLinks].sort()) {
    const link = join(opts.home, rel);
    const target = linkTarget(link);
    if (target === undefined) {
      links.push(
        existsSync(link)
          ? {
              link,
              state: 'kept',
              reason: 'placed by an earlier install, since replaced',
              current: occupant(link),
            }
          : { link, state: 'gone' },
      );
      continue;
    }
    if (!resolve(dirname(link), target).startsWith(inside)) {
      links.push({
        link,
        state: 'kept',
        reason: 'placed by an earlier install, since replaced',
        current: target,
      });
      continue;
    }
    if (!opts.dry) unlinkSync(link);
    links.push({ link, state: opts.dry ? 'remove' : 'removed' });
  }
  if (!opts.dry) {
    writeManifest(opts.harnessDir, { ...manifest, personaLinks: [] });
  }
  return { links };
}
