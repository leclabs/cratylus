// `cratylus uninstall --harness <name> [--dry-run]` — take away from a host what `install`
// placed there for one harness, and nothing else.
//
// WHAT IS THIS TOOL'S TO REMOVE is decided by the deploy manifest and by nothing else
// (`deploy/manifest.ts`): a path is ours because a placer recorded writing it, a hook
// registration because deploy recorded registering it, a line of the host's config
// because install recorded inserting it, a persona command because install recorded
// linking or adopting it. "Looks like one of ours" is refused here as it is in the prune.
//
// WHAT THE HOST HAS CHANGED SINCE IS THE HOST'S. A recorded file whose bytes no longer
// hash to the digest of what was written is left, and so is a file recorded before
// digests were kept, which cannot be told from an edit. A hook registration in an entry
// that now runs a command of the host's, a status line the host has since pointed at
// another command, a config line the host has rewritten: each is left, and NAMED, so the
// operator sees what remains and why. The report is two lists — removed, and left.
//
// THE ORDER makes a half-finished run recoverable: the persona commands first (they
// point at a launcher a later step deletes), then the host's `settings.json` and config
// (nothing may register a worker that is about to go), then the placed files, then the
// runtime config's stanza for this harness, and the manifest LAST. A run that stops
// before the manifest can be run again; one that has removed the manifest has nothing
// left to remove.
//
// `--dry-run` runs every step and writes none, so its report is exactly what a real run
// would say.

import {
  existsSync,
  readFileSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import {
  HARNESS_NAMES,
  type HarnessAdapter,
  adapterByName,
} from '../../adapters/registry/index.js';
import { CLI_BIN } from '../../bin-name.js';
import { NEUTRAL_AGENT_ROOT } from '../../core/harness-adapter.js';
import {
  type DeployManifest,
  MANIFEST_REL,
  MANIFEST_VERSION,
  applyPrune,
  personaLauncherOf,
  placedFileState,
  readManifest,
  recordsHostEdits,
  removePersonaCommands,
  restoreHostStatusLine,
  runtimeConfigTarget,
  serializeRuntimeConfig,
  undoHunks,
  unregisterHookCommands,
  withoutRuntimeParts,
} from '../../deploy/index.js';
import { unreadableRuntimeConfig } from '../../deploy/runtime-config.js';
import { harnessDirIn } from '../../deploy/scope.js';
import { settingsJson } from '../../deploy/settings-json.js';
import { containingRoot } from '../../prune/index.js';
import { fail as failLine, say } from '../style.js';

export interface UninstallCmdOpts {
  /** Harness adapter name. Required: removing is not something to guess a target for. */
  harness?: string;
  /** Say what would be removed and left; write nothing. */
  dryRun?: boolean;
  /** List every item removed, not only how many. */
  verbose?: boolean;
  /** The user's HOME, when the run is for another: the harness's directory is that
   *  home's, and the bin dir and the runtime config hang from it. Absent, the
   *  harness's own directory — its environment variable's where it has one and that
   *  is set, else under the process's HOME — and the process's HOME for the rest. */
  home?: string;
}

/** Something this run took away, or would. */
interface Removal {
  readonly what: string;
  /** Set where the removal is outside the harness directory: the directory or file it
   *  is in, and what to call it. The default report names these, as install and deploy
   *  name what they write there. */
  readonly outside?: { readonly area: string; readonly noun: string };
}

/** The top directory outside `harnessDir` that a recorded `../…` path is in. */
function outsideRoot(harnessDir: string, rel: string): string {
  const parts = rel.split('/');
  return resolve(
    harnessDir,
    ...parts.slice(0, parts.findIndex((p) => p !== '..') + 1),
  );
}

/** Something this run left alone, and why. */
interface Leftover {
  readonly what: string;
  readonly why: string;
}

interface Tally {
  readonly removed: Removal[];
  readonly left: Leftover[];
}

/** Why the record cannot be trusted, or `undefined` when it can. `readManifest` reads a
 *  bad record as EMPTY, which is right for a deploy and wrong here: an uninstall that
 *  took an unreadable record for an empty one would delete it and forget everything it
 *  named. */
function recordFault(harnessDir: string): string | undefined {
  try {
    const parsed = JSON.parse(
      readFileSync(join(harnessDir, MANIFEST_REL), 'utf8'),
    ) as { version?: unknown };
    return parsed.version === MANIFEST_VERSION
      ? undefined
      : `it is version ${String(parsed.version)}, and this command reads version ${MANIFEST_VERSION}`;
  } catch (e) {
    return `it cannot be read (${(e as Error).message})`;
  }
}

/** Every command a `settings.json` `hooks` block registers. */
function registeredCommands(settings: Record<string, unknown>): Set<string> {
  const out = new Set<string>();
  const hooks = settings.hooks;
  if (hooks === null || typeof hooks !== 'object') return out;
  for (const entries of Object.values(hooks as Record<string, unknown>)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries as { hooks?: { command?: unknown }[] }[]) {
      for (const h of entry.hooks ?? []) {
        if (typeof h.command === 'string') out.add(h.command);
      }
    }
  }
  return out;
}

/** Remove the file at `abs` and any directory that leaves empty, up to `root`. */
function dropFile(root: string, abs: string): void {
  unlinkSync(abs);
  let dir = dirname(abs);
  const top = resolve(root);
  while (dir !== top && dir.startsWith(`${top}/`)) {
    try {
      rmdirSync(dir);
    } catch {
      return; // not empty — somebody else's files are in it
    }
    dir = dirname(dir);
  }
}

/** The persona commands this harness's install linked or adopted. */
function removePersonaLinks(
  adapter: HarnessAdapter,
  harnessDir: string,
  manifest: DeployManifest,
  opts: UninstallCmdOpts,
  tally: Tally,
): void {
  if (manifest.personaLinks.length === 0) return;
  const self = personaLauncherOf(harnessDir, adapter);
  if (self === undefined) {
    for (const rel of manifest.personaLinks) {
      tally.left.push({
        what: join(opts.home ?? homedir(), rel),
        why: `recorded as a persona command, but ${adapter.name} has no launcher to check it against`,
      });
    }
    return;
  }
  // Only the recorded links are candidates: no persona names are passed, so a command
  // this install did not place is never even looked at.
  const report = removePersonaCommands({
    home: opts.home ?? homedir(),
    harnessDir,
    self,
    personas: [],
    dry: opts.dryRun ?? false,
  });
  for (const l of report.links) {
    if (l.state === 'removed' || l.state === 'remove') {
      tally.removed.push({
        what: `${l.link} (persona command)`,
        outside: { area: dirname(l.link), noun: 'persona command' },
      });
    } else if (l.state === 'kept') {
      tally.left.push({
        what: l.link,
        why: `${l.reason ?? 'not placed by this install'} (${l.current ?? 'occupied'})`,
      });
    }
  }
}

/** The host's `settings.json`: the status line install wrapped or set, and the hook
 *  registrations deploy added. One read, one write. */
function restoreSettings(
  adapter: HarnessAdapter,
  harnessDir: string,
  manifest: DeployManifest,
  dry: boolean,
  tally: Tally,
): void {
  if (manifest.statusLine === null && manifest.hookCommands.length === 0)
    return;
  const file = join(harnessDir, adapter.hooksFile);
  if (!existsSync(file)) return;
  let text: string;
  let settings: Record<string, unknown>;
  try {
    text = readFileSync(file, 'utf8');
    const parsed: unknown = JSON.parse(text);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error('not a JSON object');
    }
    settings = parsed as Record<string, unknown>;
  } catch (e) {
    tally.left.push({
      what: file,
      why: `its hook registrations and status line were not touched — it is not readable JSON (${(e as Error).message})`,
    });
    return;
  }

  let next = settings;
  let changed = false;

  if (manifest.statusLine !== null) {
    const undone = restoreHostStatusLine(next, manifest.statusLine);
    if (undone.state === 'restored') {
      tally.removed.push({
        what: `${file}: statusLine unwrapped to the host's own command (${manifest.statusLine.host})`,
      });
    } else if (undone.state === 'removed') {
      tally.removed.push({ what: `${file}: statusLine (the persona badge)` });
    } else if (undone.state === 'changed') {
      tally.left.push({
        what: `${file}: statusLine`,
        why: 'the host runs a different command than the one install placed',
      });
    }
    if (undone.state === 'restored' || undone.state === 'removed') {
      next = undone.settings;
      changed = true;
    }
  }

  if (manifest.hookCommands.length > 0) {
    const before = registeredCommands(next);
    const dropped = unregisterHookCommands(next, manifest.hookCommands);
    if (dropped.removed > 0) {
      const after = registeredCommands(dropped.settings);
      const hooks = dropped.settings.hooks as Record<string, unknown>;
      // `hooks` goes when nothing is left in it — it was install's to add.
      const { hooks: _emptied, ...withoutHooks } = dropped.settings;
      next = Object.keys(hooks).length === 0 ? withoutHooks : dropped.settings;
      changed = true;
      for (const command of manifest.hookCommands) {
        if (before.has(command) && !after.has(command)) {
          tally.removed.push({ what: `${file}: hook registration ${command}` });
        }
      }
    }
    const still = registeredCommands(next);
    for (const command of manifest.hookCommands) {
      if (still.has(command)) {
        tally.left.push({
          what: `${file}: hook registration ${command}`,
          why: 'its entry also runs a command the host placed, so it is not wholly install’s to remove',
        });
      }
    }
  }

  if (!changed || dry) return;
  if (Object.keys(next).length === 0) {
    dropFile(harnessDir, file);
  } else {
    writeFileSync(file, settingsJson(next, text));
  }
}

/** The lines install inserted into host-owned text files — omp's `config.yml`. */
function undoHostEdits(
  harnessDir: string,
  manifest: DeployManifest,
  dry: boolean,
  tally: Tally,
): void {
  for (const [rel, edit] of Object.entries(manifest.hostEdits)) {
    const file = resolve(harnessDir, rel);
    if (!existsSync(file)) continue;
    if (edit.migrated === true) {
      tally.left.push({
        what: file,
        why: 'an install from before edits were recorded may have changed more of this file than the lines adopted — a value it turned (`showHookStatus`), a segment it put in a list of yours — and nothing records which, so it is left as it stands; the lines that were adopted are the ones taken out',
      });
    }
    const text = readFileSync(file, 'utf8');
    const undone = undoHunks(text, edit.hunks);
    for (const { hunk, removed, changed, holding } of undone.results) {
      const said = (lines: readonly string[]): string =>
        lines
          .map((l) => l.trim())
          .filter((l) => l !== '')
          .join(' / ');
      // A host line that only gained a terminator is not something install added.
      const terminatorOnly =
        hunk.before.length === 1 &&
        hunk.before[0]?.trim() === hunk.after[0]?.trim();
      if (removed.length > 0 && !terminatorOnly) {
        tally.removed.push({ what: `${file}: ${said(removed)}` });
      }
      if (changed.length > 0) {
        tally.left.push({
          what: `${file}: ${said(changed)}`,
          why: 'the host has changed or removed what install wrote there, so what stands there is the host’s',
        });
      }
      if (holding.length > 0) {
        tally.left.push({
          what: `${file}: ${said(holding)}`,
          why: 'lines the host wrote stand beneath it, so it stays with them',
        });
      }
    }
    if (undone.text === text || dry) continue;
    if (edit.created && undone.text === '') {
      dropFile(harnessDir, file);
    } else {
      writeFileSync(file, undone.text);
    }
  }
}

/** A harness installed before install recorded its edits to the host's config file:
 *  what it added there is in the file with nothing saying which lines they are, and an
 *  uninstall that removed by resemblance would be guessing at the host's own. */
function reportUnrecordedConfig(
  adapter: HarnessAdapter,
  harnessDir: string,
  tally: Tally,
): void {
  const rels =
    adapter.roleRouting?.configRels ?? adapter.statusSegment?.configRels ?? [];
  const file = rels.map((rel) => join(harnessDir, rel)).find(existsSync);
  if (file === undefined) return;
  tally.left.push({
    what: file,
    why: `${adapter.name} was installed before install recorded its edits to this file, so a \`modelRoles\` entry or status line layout it added cannot be told from yours; run \`${CLI_BIN} install --harness ${adapter.name}\` again, which records the lines it finds there byte for byte as it would write them, then uninstall`,
  });
}

/** Every path a placer recorded, once each. */
function recordedPaths(manifest: DeployManifest): string[] {
  return [
    ...new Set(
      Object.values(manifest.kinds).flatMap((kind) =>
        Object.values(kind).flat(),
      ),
    ),
  ].sort();
}

/** The placed files: removed while their bytes are still the ones written. */
function removePlacedFiles(
  adapter: HarnessAdapter,
  harnessDir: string,
  manifest: DeployManifest,
  opts: UninstallCmdOpts,
  tally: Tally,
): void {
  const neutral = resolve(harnessDir, '..', NEUTRAL_AGENT_ROOT);
  const roots = [harnessDir, neutral];
  // A path outside the harness home — omp's neutral root, a hook's shared assets — may
  // be recorded by another harness's install as well, and that one still needs it.
  const elsewhere = new Map<string, string>();
  for (const name of HARNESS_NAMES) {
    if (name === adapter.name) continue;
    const otherDir = harnessDirIn(adapterByName(name), opts.home);
    for (const rel of recordedPaths(readManifest(otherDir))) {
      elsewhere.set(resolve(otherDir, rel), name);
    }
  }
  const removable: string[] = [];
  for (const rel of recordedPaths(manifest)) {
    const abs = resolve(harnessDir, rel);
    const state = placedFileState(harnessDir, rel, manifest.digests);
    if (state === 'absent') continue;
    if (state === 'changed' || state === 'unverified') {
      tally.left.push({
        what: abs,
        why:
          state === 'changed'
            ? 'the host changed it since install'
            : 'no digest was recorded when it was placed, so a change by the host cannot be ruled out',
      });
      continue;
    }
    if (containingRoot(roots, abs) === null) {
      tally.left.push({
        what: abs,
        why: 'outside the directories an uninstall removes from',
      });
      continue;
    }
    const peer = elsewhere.get(abs);
    if (peer !== undefined) {
      tally.left.push({
        what: abs,
        why: `the ${peer} install records it too and still needs it`,
      });
      continue;
    }
    removable.push(rel);
    tally.removed.push({
      what: abs,
      ...(rel.startsWith('../')
        ? { outside: { area: outsideRoot(harnessDir, rel), noun: 'file' } }
        : {}),
    });
  }
  applyPrune(harnessDir, removable, opts.dryRun ?? false, [neutral]);
}

/** What cratylus put in the runtime config in `home`'s file (or, where
 *  `$AGENT_RUNTIME_CONFIG` is set, that path): this harness's stanza, and — when no other
 *  installed harness has one — the corpus's parts too, the event vocabulary and the
 *  configuration of the capabilities the deploy recorded writing. A part is taken out
 *  while it is what the deploy recorded; one the host has changed since stands, as does
 *  every key the host placed, each named. The file goes only when nothing is left in it. */
function removeRuntimeStanza(
  adapter: HarnessAdapter,
  manifest: DeployManifest,
  home: string | undefined,
  dry: boolean,
  tally: Tally,
): void {
  const file = runtimeConfigTarget(process.env, home);
  const unreadable = unreadableRuntimeConfig(file);
  if (unreadable !== undefined) {
    // Not ours to interpret, and never rewritten unread: it stands, byte for byte,
    // and the report says so.
    tally.left.push({
      what: file,
      why: `the runtime config ${unreadable}, so what ${adapter.name}'s install wrote there cannot be told from the host's; this uninstall removes the record of what was written, so to take it out, repair the file or move it away, run \`${CLI_BIN} install --harness ${adapter.name}\` again, which records it, then uninstall; or remove ${adapter.name}'s parts from it by hand`,
    });
    return;
  }
  if (!existsSync(file)) return;
  const doc = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  const removal = withoutRuntimeParts(doc, {
    harness: adapter.name,
    installed: HARNESS_NAMES.filter(
      (name) =>
        name !== adapter.name &&
        existsSync(join(harnessDirIn(adapterByName(name), home), MANIFEST_REL)),
    ),
    record: manifest.runtimeConfig,
  });
  if (removal === undefined) return;
  const { rest, removed, changed, unrecorded, left } = removal;
  if (rest === null) {
    tally.removed.push({
      what: `${file} (the runtime config: ${adapter.name} was its last harness)`,
      outside: { area: file, noun: 'runtime config' },
    });
  } else if (removed.length > 0) {
    tally.removed.push({
      what: `${file}: ${removed.join(', ')}`,
      outside: { area: file, noun: 'runtime config' },
    });
  }
  if (changed.length > 0) {
    tally.left.push({
      what: `${file}: ${changed.join(', ')}`,
      why: 'the host changed what install wrote there since install',
    });
  }
  if (unrecorded.length > 0) {
    tally.left.push({
      what: `${file}: ${unrecorded.join(', ')}`,
      why: `no record was kept of what ${adapter.name}'s deploy wrote there, so a change by the host cannot be ruled out; run \`${CLI_BIN} install --harness ${adapter.name}\` again, which records it, then uninstall`,
    });
  }
  if (left.length > 0) {
    tally.left.push({
      what: `${file}: ${left.join(', ')}`,
      why: 'the host placed them, so the file stays with them',
    });
  }
  if (dry) return;
  if (rest === null) {
    unlinkSync(file);
  } else if (removed.length > 0) {
    writeFileSync(file, serializeRuntimeConfig(rest));
  }
}

const plural = (n: number, noun: string): string =>
  `${n} ${noun}${n === 1 ? '' : 's'}`;

/** The report: counts always, what was removed outside the harness directory always
 *  (install and deploy name every write there, so uninstall names what it takes back),
 *  what was left always (the host's, so the operator sees what remains and why), and
 *  each item removed only under `--verbose`. */
function print(
  tally: Tally,
  run: { dry: boolean; verbose: boolean; harness: string; harnessDir: string },
): void {
  const { dry, verbose } = run;
  const verb = dry ? 'would remove' : 'removed';
  const inside = tally.removed.filter((r) => r.outside === undefined);
  say(
    `${verb} ${plural(inside.length, 'item')} from ${run.harness} (${run.harnessDir})`,
  );
  if (verbose) {
    for (const r of tally.removed) say(`  ${r.what}`);
  } else {
    const groups = new Map<string, Removal[]>();
    for (const r of tally.removed) {
      if (r.outside === undefined) continue;
      const key = `${r.outside.noun}\0${r.outside.area}`;
      groups.set(key, [...(groups.get(key) ?? []), r]);
    }
    for (const items of groups.values()) {
      const { area, noun } = items[0]?.outside as NonNullable<
        Removal['outside']
      >;
      say(
        noun === 'runtime config'
          ? `${verb} ${items[0]?.what}`
          : `${verb} ${plural(items.length, noun)} from ${area}`,
      );
    }
  }
  if (tally.left.length > 0) {
    say(
      `left ${plural(tally.left.length, 'item')} the host placed or changed, which are not touched:`,
    );
    for (const l of tally.left) say(`  ${l.what} — ${l.why}`);
  }
}

export function runUninstall(opts: UninstallCmdOpts): number {
  const fail = (message: string): number => {
    failLine('uninstall', message);
    return 1;
  };
  if (opts.harness === undefined) {
    return fail(
      `no harness named; pass --harness <${HARNESS_NAMES.join('|')}>`,
    );
  }
  if (!(HARNESS_NAMES as readonly string[]).includes(opts.harness)) {
    return fail(
      `unknown harness '${opts.harness}'; pass one of --harness <${HARNESS_NAMES.join('|')}>`,
    );
  }
  const adapter = adapterByName(opts.harness);
  const dry = opts.dryRun ?? false;
  const harnessDir = harnessDirIn(adapter, opts.home);
  const manifestFile = join(harnessDir, MANIFEST_REL);
  const run = {
    dry,
    verbose: opts.verbose ?? false,
    harness: adapter.name,
    harnessDir,
  };

  if (!existsSync(manifestFile)) {
    say(
      `no deploy record at ${manifestFile}, so nothing there is recorded as placed by ${CLI_BIN} and nothing is removed`,
    );
    return 0;
  }
  const fault = recordFault(harnessDir);
  if (fault !== undefined) {
    return fail(
      `the deploy record ${manifestFile} is not usable: ${fault}; nothing was removed, so repair or delete the record and run it again`,
    );
  }

  const manifest = readManifest(harnessDir);
  // Read now: the persona step below rewrites the record, and a rewrite reads back as
  // one that records edits whatever it was.
  const editsRecorded = recordsHostEdits(harnessDir);
  const tally: Tally = { removed: [], left: [] };
  try {
    removePersonaLinks(adapter, harnessDir, manifest, opts, tally);
    restoreSettings(adapter, harnessDir, manifest, dry, tally);
    if (!editsRecorded) reportUnrecordedConfig(adapter, harnessDir, tally);
    undoHostEdits(harnessDir, manifest, dry, tally);
    removePlacedFiles(adapter, harnessDir, manifest, opts, tally);
    removeRuntimeStanza(adapter, manifest, opts.home, dry, tally);
    tally.removed.push({ what: `${manifestFile} (the deploy record)` });
    if (!dry) dropFile(harnessDir, manifestFile);
  } catch (e) {
    print(tally, run);
    return fail(
      `stopped: ${(e as Error).message}; the deploy record is kept, so running it again continues`,
    );
  }
  print(tally, run);
  say(
    dry
      ? 'next: run it again without --dry-run to remove them'
      : `next: restart ${adapter.name} to drop what it still has loaded`,
  );
  return 0;
}
