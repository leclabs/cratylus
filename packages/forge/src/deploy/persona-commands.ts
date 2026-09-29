// Persona commands — a command named after each installed persona, in the user's
// bin dir, linked to the harness's launcher.
//
// `<home>/.local/bin/<persona>` is a symlink to the harness's ONE generic launcher
// (`HarnessAdapter.launcherFile`), which resolves the persona to launch from its own
// invoked name. So `planner -p hi` starts the `planner` persona, the way `omp-agent
// planner -p hi` does, with no per-persona artifact to generate or retire.
//
// THE BIN DIR IS NOT OURS. It holds every program the operator ever put there, and
// this module's whole discipline is what it does about that:
//
//   - PLACING NEVER OVERWRITES. A link is created with `symlink(2)`, which refuses an
//     existing name, and a name that is already taken — a regular file, another
//     program's link, a link to this very launcher that nothing recorded — is BLOCKED
//     and reported with what is there. No path in this module unlinks before it links.
//   - A LINK IS OURS ONLY IF IT IS RECORDED. The harness's deploy manifest lists the
//     links this install placed (`DeployManifest.personaLinks`). A link that merely
//     points at our launcher is indistinguishable from one the operator made by hand,
//     and by the same argument the record is what `remove` obeys.
//   - ONE COMMAND PER PERSONA NAME ACROSS HARNESSES. Two harnesses install the same
//     persona names, and each would place `~/.local/bin/<persona>`. Whichever install
//     is asked first owns the name; the other finds it taken, is blocked, and the
//     report names both launchers. Nothing is suffixed to make room, because a second
//     spelling of a persona's name is a second concept for the operator to remember.
//
// It takes FACTS as data — paths, names, the peers' launchers — so nothing here
// imports an adapter's behaviour: which harness, which launcher and who else is
// installed are the caller's to say.

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readlinkSync,
  realpathSync,
  symlinkSync,
  unlinkSync,
} from 'node:fs';
import { delimiter, dirname, join, resolve } from 'node:path';
import { SESSION_SCOPE } from '../core/harness-adapter.js';
import type { HarnessAdapter } from '../core/harness-adapter.js';
import { readManifest, writeManifest } from './manifest.js';

/** Where the persona commands live, relative to the user's HOME. */
export const PERSONA_BIN_REL = '.local/bin';

/** One harness's launcher, as a peer's claim on the same command names. */
export interface PersonaLauncher {
  readonly harness: string;
  /** Absolute path of the launcher file. */
  readonly launcher: string;
}

/**
 * Where `adapter`'s launcher lands under `home`, or `undefined` when it has none.
 * Asked of the adapter (`scopedRel`) rather than spelled, so it can never disagree
 * with where deploy placed the file.
 */
export function personaLauncherOf(
  home: string,
  adapter: Pick<HarnessAdapter, 'name' | 'home' | 'launcherFile' | 'scopedRel'>,
): PersonaLauncher | undefined {
  if (adapter.launcherFile === undefined || adapter.scopedRel === undefined) {
    return undefined;
  }
  return {
    harness: adapter.name,
    launcher: join(
      home,
      adapter.home,
      adapter.scopedRel(adapter.launcherFile, SESSION_SCOPE),
    ),
  };
}

export interface PersonaCommandsOpts {
  /** The user's HOME — the bin dir hangs from it, and so do recorded links. */
  readonly home: string;
  /** This harness's deploy root (`<home>/<adapter.home>`), where its manifest lives. */
  readonly harnessDir: string;
  /** This harness's launcher: the link target, and the owner of what is recorded. */
  readonly self: PersonaLauncher;
  /** The installed personas, one command each. */
  readonly personas: readonly string[];
  /** Every OTHER harness's launcher, so a taken name can be attributed. */
  readonly peers?: readonly PersonaLauncher[];
  /** `PATH`, for the on-PATH check. Default: the process's. */
  readonly pathEnv?: string;
}

/**
 * What a command name's state is.
 *   - `place`   — free; a placement WOULD create it.
 *   - `placed`  — this call created it.
 *   - `present` — recorded as ours and still linked to the launcher.
 *   - `blocked` — taken by something this install did not place, left as it is.
 */
export type PersonaLinkState = 'place' | 'placed' | 'present' | 'blocked';

export interface PersonaLink {
  readonly persona: string;
  /** Absolute path of the command. */
  readonly link: string;
  /** Absolute path of the launcher it is (or would be) linked to. */
  readonly target: string;
  readonly state: PersonaLinkState;
  /** Blocked only: what occupies the name — a link's target, or the kind of thing. */
  readonly current?: string;
  /** Blocked only: the peer harness whose launcher the occupant is linked to. */
  readonly heldBy?: string;
  /** Blocked only: the occupant already leads to THIS launcher, but this install's
   *  record does not list it — a link someone else made, or one it lost track of. */
  readonly unrecorded?: true;
}

export interface PersonaCommandsReport {
  readonly binDir: string;
  /** Whether `binDir` is a directory on `PATH`. */
  readonly onPath: boolean;
  readonly links: readonly PersonaLink[];
}

/** What a removal did to one command name. `remove`/`kept`/`gone` under a dry run
 *  is `remove`: the entry is untouched and would be unlinked. */
export type PersonaRemovalState = 'removed' | 'remove' | 'kept' | 'gone';

export interface PersonaRemoval {
  readonly link: string;
  readonly state: PersonaRemovalState;
  /** Kept only: why this install left it. */
  readonly reason?: string;
  /** Kept only: what occupies the name. */
  readonly current?: string;
}

export interface PersonaRemovalReport {
  readonly binDir: string;
  readonly links: readonly PersonaRemoval[];
}

const binDirOf = (home: string): string => join(home, PERSONA_BIN_REL);

/** `readlink`, or `undefined` when the entry is not a symlink (or is absent). */
function linkTarget(path: string): string | undefined {
  try {
    return readlinkSync(path);
  } catch {
    return undefined;
  }
}

/** Whether the symlink at `link` leads to `launcher` — through resolution when both
 *  exist, and by its literal target otherwise (a launcher not yet placed). */
function leadsTo(link: string, launcher: string): boolean {
  try {
    return realpathSync(link) === realpathSync(launcher);
  } catch {
    const target = linkTarget(link);
    return (
      target !== undefined &&
      resolve(dirname(link), target) === resolve(launcher)
    );
  }
}

/** Whether `dir` is one of `pathEnv`'s entries. */
function isOnPath(dir: string, pathEnv: string): boolean {
  const want = resolve(dir);
  return pathEnv
    .split(delimiter)
    .some((entry) => entry !== '' && resolve(entry) === want);
}

/** What occupies `path`, for a report: a link's target, or the kind of thing. */
function occupant(path: string): string {
  const target = linkTarget(path);
  if (target !== undefined) return target;
  return lstatSync(path).isDirectory() ? 'a directory' : 'a regular file';
}

const relToHome = (home: string, link: string): string =>
  link.slice(home.length + 1);

/** Classify one name against what is on disk. */
function classify(
  opts: PersonaCommandsOpts,
  recorded: ReadonlySet<string>,
  persona: string,
): PersonaLink {
  const link = join(binDirOf(opts.home), persona);
  const target = opts.self.launcher;
  const base = { persona, link, target };
  let exists = true;
  try {
    lstatSync(link);
  } catch {
    exists = false;
  }
  if (!exists) return { ...base, state: 'place' };
  const leadsToSelf = leadsTo(link, target);
  if (leadsToSelf && recorded.has(relToHome(opts.home, link))) {
    return { ...base, state: 'present' };
  }
  const heldBy = (opts.peers ?? []).find((p) => leadsTo(link, p.launcher));
  return {
    ...base,
    state: 'blocked',
    current: occupant(link),
    ...(heldBy ? { heldBy: heldBy.harness } : {}),
    ...(leadsToSelf ? { unrecorded: true } : {}),
  };
}

/**
 * Classify every persona's command name, changing nothing.
 *
 * Reads the record and the bin dir, and writes neither — a caller shows this to the
 * operator before asking to place, and a plan that touched anything would not be
 * one.
 */
export function planPersonaCommands(
  opts: PersonaCommandsOpts,
): PersonaCommandsReport {
  const recorded = new Set(readManifest(opts.harnessDir).personaLinks);
  const binDir = binDirOf(opts.home);
  return {
    binDir,
    onPath: isOnPath(binDir, opts.pathEnv ?? process.env.PATH ?? ''),
    links: [...opts.personas]
      .sort()
      .map((persona) => classify(opts, recorded, persona)),
  };
}

/**
 * Create the commands the plan finds free, and record them.
 *
 * NEVER OVERWRITES, and not by the plan's say-so alone: `symlinkSync` refuses a name
 * that exists, so a name taken between the plan and the link — by another process, or
 * by this call's own earlier iteration — comes back as blocked rather than replaced.
 * Under `dry` nothing is created and the free names stay `place`.
 */
export function placePersonaCommands(
  opts: PersonaCommandsOpts & { readonly dry?: boolean },
): PersonaCommandsReport {
  const plan = planPersonaCommands(opts);
  if (opts.dry) return plan;
  const links: PersonaLink[] = [];
  const placed: string[] = [];
  for (const entry of plan.links) {
    if (entry.state !== 'place') {
      links.push(entry);
      continue;
    }
    try {
      mkdirSync(plan.binDir, { recursive: true });
      symlinkSync(entry.target, entry.link);
      links.push({ ...entry, state: 'placed' });
      placed.push(relToHome(opts.home, entry.link));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err;
      links.push(classify(opts, new Set(), entry.persona));
    }
  }
  if (placed.length > 0) {
    const manifest = readManifest(opts.harnessDir);
    writeManifest(opts.harnessDir, {
      ...manifest,
      personaLinks: [...new Set([...manifest.personaLinks, ...placed])].sort(),
    });
  }
  return { ...plan, links };
}

/**
 * Remove exactly the commands this install placed that still lead to its launcher.
 *
 * The candidates are the recorded links plus each persona's name, so an occupant this
 * install did NOT place is still REPORTED — as kept, with what it is — rather than
 * skipped without a word. A recorded link since replaced by something else is kept
 * too, and dropped from the record: the name is no longer ours to remove. Only a
 * symlink is ever unlinked. Under `dry` nothing is removed and the record is unchanged.
 */
export function removePersonaCommands(
  opts: Omit<PersonaCommandsOpts, 'peers' | 'pathEnv'> & {
    readonly dry?: boolean;
  },
): PersonaRemovalReport {
  const binDir = binDirOf(opts.home);
  const manifest = readManifest(opts.harnessDir);
  const recorded = new Set(manifest.personaLinks);
  const candidates = [
    ...new Set([
      ...manifest.personaLinks.map((rel) => join(opts.home, rel)),
      ...opts.personas.map((p) => join(binDir, p)),
    ]),
  ].sort();
  const links: PersonaRemoval[] = [];
  const forget = new Set<string>();
  for (const link of candidates) {
    const rel = relToHome(opts.home, link);
    if (!existsSync(link) && linkTarget(link) === undefined) {
      if (recorded.has(rel)) {
        forget.add(rel);
        links.push({ link, state: 'gone' });
      }
      continue;
    }
    if (!recorded.has(rel)) {
      links.push({
        link,
        state: 'kept',
        reason: 'not placed by this install',
        current: occupant(link),
      });
      continue;
    }
    if (linkTarget(link) === undefined || !leadsTo(link, opts.self.launcher)) {
      forget.add(rel);
      links.push({
        link,
        state: 'kept',
        reason: 'placed by this install, since replaced',
        current: occupant(link),
      });
      continue;
    }
    forget.add(rel);
    if (!opts.dry) unlinkSync(link);
    links.push({ link, state: opts.dry ? 'remove' : 'removed' });
  }
  if (!opts.dry && forget.size > 0) {
    writeManifest(opts.harnessDir, {
      ...manifest,
      personaLinks: manifest.personaLinks.filter((rel) => !forget.has(rel)),
    });
  }
  return { binDir, links };
}

/**
 * The lines an operator reads about a persona-commands report. `would` says the
 * free names are only planned — a dry run, or an install that was not asked to link.
 */
export function describePersonaCommands(
  report: PersonaCommandsReport,
  would: boolean,
): string[] {
  if (report.links.length === 0) return [];
  const lines = [
    `persona commands (${report.links.length}) in ${report.binDir}:`,
  ];
  for (const l of report.links) {
    switch (l.state) {
      case 'place':
        lines.push(
          `  ${would ? 'would place' : 'place'} ${l.persona} -> ${l.target}`,
        );
        break;
      case 'placed':
        lines.push(`  placed ${l.persona} -> ${l.target}`);
        break;
      case 'present':
        lines.push(`  present ${l.persona} -> ${l.target}`);
        break;
      case 'blocked':
        lines.push(
          l.heldBy
            ? `  blocked ${l.persona}: ${l.link} is linked to the ${l.heldBy} launcher (${l.current}) — left alone, not replaced by ${l.target}`
            : l.unrecorded
              ? `  blocked ${l.persona}: ${l.link} already leads to ${l.target}, but this install did not place it — left alone`
              : `  blocked ${l.persona}: ${l.link} is ${l.current} — left alone, not replaced by ${l.target}`,
        );
        break;
    }
  }
  if (!report.onPath) {
    lines.push(
      `  ! ${report.binDir} is not on PATH — add it to PATH to run these by name`,
    );
  }
  return lines;
}

/** The lines an operator reads about a removal. */
export function describePersonaRemoval(report: PersonaRemovalReport): string[] {
  return report.links.map((l) => {
    switch (l.state) {
      case 'removed':
        return `  removed ${l.link}`;
      case 'remove':
        return `  would remove ${l.link}`;
      case 'gone':
        return `  gone ${l.link} (already absent)`;
      case 'kept':
        return `  kept ${l.link}: ${l.reason} (${l.current})`;
    }
  });
}
