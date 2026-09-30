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
import { dirname, join, resolve } from 'node:path';
import pc from 'picocolors';
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
} from '../../deploy/index.js';
import { containingRoot } from '../../prune/index.js';

export interface UninstallCmdOpts {
  /** Harness adapter name. Required: removing is not something to guess a target for. */
  harness?: string;
  /** Say what would be removed and left; write nothing. */
  dryRun?: boolean;
  /** The user's HOME — the harness's home, the bin dir and the runtime config hang
   *  from it. */
  home: string;
}

/** Something this run took away, or would. */
interface Removal {
  readonly what: string;
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

const settingsJson = (settings: Record<string, unknown>): string =>
  `${JSON.stringify(settings, null, 2)}\n`;

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
  opts: UninstallCmdOpts & { home: string },
  tally: Tally,
): void {
  if (manifest.personaLinks.length === 0) return;
  const self = personaLauncherOf(opts.home, adapter);
  if (self === undefined) {
    for (const rel of manifest.personaLinks) {
      tally.left.push({
        what: join(opts.home, rel),
        why: `recorded as a persona command, but ${adapter.name} has no launcher to check it against`,
      });
    }
    return;
  }
  // Only the recorded links are candidates: no persona names are passed, so a command
  // this install did not place is never even looked at.
  const report = removePersonaCommands({
    home: opts.home,
    harnessDir,
    self,
    personas: [],
    dry: opts.dryRun ?? false,
  });
  for (const l of report.links) {
    if (l.state === 'removed' || l.state === 'remove') {
      tally.removed.push({ what: `${l.link} (persona command)` });
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
  let settings: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
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
    writeFileSync(file, settingsJson(next));
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
  opts: UninstallCmdOpts & { home: string },
  tally: Tally,
): void {
  const neutral = resolve(harnessDir, '..', NEUTRAL_AGENT_ROOT);
  const roots = [harnessDir, neutral];
  // A path outside the harness home — omp's neutral root, a hook's shared assets — may
  // be recorded by another harness's install as well, and that one still needs it.
  const elsewhere = new Map<string, string>();
  for (const name of HARNESS_NAMES) {
    if (name === adapter.name) continue;
    const otherDir = join(opts.home, adapterByName(name).home);
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
    tally.removed.push({ what: abs });
  }
  applyPrune(harnessDir, removable, opts.dryRun ?? false, [neutral]);
}

/** This harness's stanza of the runtime config. The file is emitted whole by deploy,
 *  one stanza per harness, so it goes with the last stanza and not before. */
function removeRuntimeStanza(
  adapter: HarnessAdapter,
  dry: boolean,
  tally: Tally,
): void {
  const file = runtimeConfigTarget();
  if (!existsSync(file)) return;
  let doc: Record<string, unknown>;
  try {
    doc = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  } catch {
    return; // not ours to interpret, and never rewritten unread
  }
  const harnesses = doc.harnesses as Record<string, unknown> | undefined;
  if (
    harnesses === undefined ||
    harnesses === null ||
    typeof harnesses !== 'object' ||
    !Object.hasOwn(harnesses, adapter.name)
  ) {
    return;
  }
  const { [adapter.name]: _gone, ...others } = harnesses;
  const known = new Set(['events', 'harnesses', 'configuration']);
  const foreign = Object.keys(doc).some((k) => !known.has(k));
  const whole = Object.keys(others).length === 0 && !foreign;
  tally.removed.push({
    what: whole
      ? `${file} (the runtime config: ${adapter.name} was its last harness)`
      : `${file}: the ${adapter.name} stanza`,
  });
  if (dry) return;
  if (whole) {
    unlinkSync(file);
  } else {
    writeFileSync(
      file,
      serializeRuntimeConfig({ ...doc, harnesses: others } as never),
    );
  }
}

function print(tally: Tally, dry: boolean): void {
  const say = (line: string): void => {
    process.stdout.write(`${line}\n`);
  };
  say(
    dry
      ? `${pc.bold(`would remove (${tally.removed.length}):`)}`
      : `${pc.bold(`removed (${tally.removed.length}):`)}`,
  );
  for (const r of tally.removed) say(`  ${r.what}`);
  say(
    `${pc.bold(`left (${tally.left.length}) — the host placed or changed these, so they are not touched:`)}`,
  );
  for (const l of tally.left) say(`  ${l.what} — ${l.why}`);
}

export function runUninstall(opts: UninstallCmdOpts): number {
  const fail = (message: string): number => {
    process.stderr.write(`${pc.red('✗')} ${CLI_BIN} uninstall: ${message}\n`);
    return 1;
  };
  if (opts.harness === undefined) {
    return fail(
      `name the harness to remove from with --harness <${HARNESS_NAMES.join('|')}>.`,
    );
  }
  if (!(HARNESS_NAMES as readonly string[]).includes(opts.harness)) {
    return fail(
      `unknown harness '${opts.harness}' (known: ${HARNESS_NAMES.join(', ')}).`,
    );
  }
  const adapter = adapterByName(opts.harness);
  const dry = opts.dryRun ?? false;
  const harnessDir = join(opts.home, adapter.home);
  const manifestFile = join(harnessDir, MANIFEST_REL);

  process.stdout.write(
    `${pc.gray(`harness: ${adapter.name} → ${harnessDir}${dry ? ' (dry-run: nothing is written)' : ''}`)}\n`,
  );
  if (!existsSync(manifestFile)) {
    process.stdout.write(
      `no deploy record at ${manifestFile} — nothing is recorded there as placed by ${CLI_BIN}, so nothing is removed.\n`,
    );
    return 0;
  }
  const fault = recordFault(harnessDir);
  if (fault !== undefined) {
    return fail(
      `the deploy record ${manifestFile} is not usable: ${fault}. Nothing was removed.`,
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
    removeRuntimeStanza(adapter, dry, tally);
    tally.removed.push({ what: `${manifestFile} (the deploy record)` });
    if (!dry) dropFile(harnessDir, manifestFile);
  } catch (e) {
    print(tally, dry);
    return fail(
      `stopped: ${(e as Error).message}. The deploy record is kept, so running it again continues.`,
    );
  }
  print(tally, dry);
  return 0;
}
