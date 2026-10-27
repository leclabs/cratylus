// `cratylus uninstall --harness <name> [--scope user|project] [--home <dir>] [--dry-run]`
// — take away from a host what `install` placed there for one harness at one scope,
// and nothing else. `--scope project` takes back the installation of the project the
// working directory is in, and nothing under the home; the user's (the default) leaves
// every project installation untouched.
//
// WHAT IS THIS TOOL'S TO REMOVE is known by construction: the owned root
// (`~/.cratylus/<harness>`) is cratylus's alone, so it goes whole, edits and additions
// inside it included; and every reference the harness's own surfaces hold into it is
// found from where it points, so exactly those go, even where the root or its record
// (`installation.json`) was edited or removed. The product owner's answers
// install wrote into the host's settings (models, whether the status line shows the
// session's agent) are the host's, and stay. Nothing else of the host's is looked at.
//
// AN EARLIER INSTALLATION is the layout before the owned root: files placed on the
// harness's own surfaces, named by a deploy manifest (`deploy/manifest.ts`). It is taken
// back by that record: a path is ours because a placer recorded writing it, a hook
// registration because deploy recorded registering it, a line of the host's config
// because install recorded inserting it, a persona command because an earlier install
// recorded linking or adopting it. "Looks like one of ours" is refused here as it is in
// the prune. Install takes it back the same way when it upgrades a host over it. The
// one exception is the `modelRoles` bindings it seeded in the host's config: which model
// a role runs on is the host's own setting (decision 0112), so they stay, as the host's.
//
// WHAT THE HOST HAS CHANGED SINCE IS THE HOST'S. A recorded file outside the root whose
// bytes no longer hash to the digest of what was written is left; a file recorded before
// digests were kept is cratylus's by that record, and taken back (decision 0114). A reference the
// host has pointed elsewhere, a hook registration in an entry that now runs a command
// of the host's, a config line the host has rewritten: each is left, and NAMED, so the
// product owner sees what remains and why. The report is two lists — removed, and left.
//
// THE ORDER makes a half-finished run recoverable: the references first, then the root
// with its record LAST; for an earlier installation, its persona commands, settings,
// config lines, placed files and runtime config, and its manifest last. A run that
// stops before a record is removed can be run again.
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
import type { InstallScope } from '@cratylus/runtime/runtime-config';
import {
  HARNESS_NAMES,
  type HarnessAdapter,
  adapterByName,
} from '../../adapters/registry/index.js';
import { CLI_BIN } from '../../bin-name.js';
import { NEUTRAL_AGENT_ROOT } from '../../core/harness-adapter.js';
import {
  type DeployManifest,
  type HostEdit,
  MANIFEST_REL,
  MANIFEST_VERSION,
  applyPrune,
  ensureStatusSegment,
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
import { type Placement, placementOf } from '../../deploy/install-scope.js';
import {
  holdsRenderTree,
  readInstallationRecord,
  removeOwnedRoot,
  unlinkOwnedRoot,
} from '../../deploy/owned-root.js';
import { unreadableRuntimeConfig } from '../../deploy/runtime-config.js';
import { harnessDirIn } from '../../deploy/scope.js';
import { settingsJson } from '../../deploy/settings-json.js';
import {
  isBlankOrComment,
  keyOf,
  splitLines,
} from '../../deploy/yaml-lines.js';
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
  /** `--scope`: the installation to take back, the user's (default) or the one in
   *  the project of `cwd`. */
  scope?: InstallScope;
  /** The working directory the project is resolved from. Default: the process's. */
  cwd?: string;
}

/** Something this run took away, or would. */
export interface Removal {
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
export interface Leftover {
  readonly what: string;
  readonly why: string;
}

/** What a removal took away and what it left. */
export interface Tally {
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

/** The persona commands an earlier install of this harness linked or adopted. */
function removePersonaLinks(
  harnessDir: string,
  opts: UninstallCmdOpts,
  tally: Tally,
): void {
  // Only the recorded links are candidates, so a command no install placed is never
  // even looked at.
  const report = removePersonaCommands({
    home: opts.home ?? homedir(),
    harnessDir,
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

/** The lines install inserted into host-owned text files — omp's `config.yml` — by
 *  each file's path relative to the harness directory. */
function undoHostEdits(
  harnessDir: string,
  edits: Readonly<Record<string, HostEdit>>,
  dry: boolean,
  tally: Tally,
): void {
  for (const [rel, edit] of Object.entries(edits)) {
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

/** The lines of a config file's `modelRoles` mapping, the key line with them, each
 *  with its terminator: a top-level YAML block, or a JSON (flow) object written over
 *  lines, as a host that keeps its config as JSON has it. Empty where the file has
 *  no such mapping. */
function modelRolesBlock(text: string): Set<string> {
  const lines = splitLines(text);
  const block = new Set<string>();
  const flow = lines.findIndex(([t]) => /^\s*"?modelRoles"?\s*:\s*\{/.test(t));
  if (flow >= 0) {
    let depth = 0;
    for (let i = flow; i < lines.length; i++) {
      const [t, le] = lines[i] as [string, string];
      block.add(t + le);
      depth += (t.replace(/"(?:[^"\\]|\\.)*"/g, '').match(/\{/g) ?? []).length;
      depth -= (t.replace(/"(?:[^"\\]|\\.)*"/g, '').match(/\}/g) ?? []).length;
      if (depth <= 0) break;
    }
    return block;
  }
  const at = lines.findIndex(
    ([t]) => !/^\s/.test(t) && keyOf(t) === 'modelRoles',
  );
  if (at < 0) return block;
  for (let i = at + 1; i < lines.length; i++) {
    const [t, le] = lines[i] as [string, string];
    if (isBlankOrComment(t)) continue;
    if (!/^[ \t]/.test(t)) break;
    block.add(t + le);
  }
  if (block.size > 0) {
    const [t, le] = lines[at] as [string, string];
    block.add(t + le);
  }
  return block;
}

/**
 * An earlier installation's host edits without the `modelRoles` bindings it seeded:
 * which model a role runs on is the host's own setting (decision 0112), so those
 * bindings stay as the host's from then on, the `modelRoles:` key with them, and each
 * is named. Every other line it recorded is undone as recorded.
 */
function keepingModelRoles(
  harnessDir: string,
  edits: Readonly<Record<string, HostEdit>>,
  tally: Tally,
): Record<string, HostEdit> {
  const out: Record<string, HostEdit> = {};
  for (const [rel, edit] of Object.entries(edits)) {
    const file = resolve(harnessDir, rel);
    const block = existsSync(file)
      ? modelRolesBlock(readFileSync(file, 'utf8'))
      : new Set<string>();
    const kept: string[] = [];
    const hunks = edit.hunks.flatMap((hunk) => {
      if (hunk.before.length > 0) {
        // A seed the earlier install moved in place, or a host line it ended so a seed
        // could follow (a JSON comma): every line stands inside the mapping, as the host's.
        if (hunk.after.length > 0 && hunk.after.every((l) => block.has(l))) {
          kept.push(...hunk.after);
          return [];
        }
        return [hunk];
      }
      const after = hunk.after.filter((l) => !block.has(l));
      if (after.length === hunk.after.length) return [hunk];
      kept.push(...hunk.after.filter((l) => block.has(l)));
      return after.length > 0 ? [{ ...hunk, after }] : [];
    });
    out[rel] = { ...edit, hunks };
    const bindings = kept.filter((l) => /^\s/.test(l)).map((l) => l.trim());
    if (bindings.length > 0) {
      tally.left.push({
        what: `${file}: ${bindings.join(' / ')}`,
        why: 'model role bindings the earlier install seeded are the host’s own setting from now on, so they stay',
      });
    }
  }
  return out;
}

/**
 * A harness installed before install recorded its edits to the host's config file:
 * the status line layout it wrote there is recorded nowhere. A `statusLine` block byte
 * for byte the one it wrote is cratylus's by that installation (decision 0114), so it
 * is adopted as a recorded edit and taken out; one that is not cannot be told from the
 * host's, and stands, named. The `modelRoles` bindings it seeded are the host's own
 * either way (decision 0112).
 */
function unrecordedStatusLine(
  adapter: HarnessAdapter,
  harnessDir: string,
  tally: Tally,
): Record<string, HostEdit> {
  const host = adapter.statusSegment;
  const rel = host?.configRels.find((r) => existsSync(join(harnessDir, r)));
  if (host === undefined || rel === undefined) return {};
  const file = join(harnessDir, rel);
  const { edit } = ensureStatusSegment(file, host, { adopt: true, dry: true });
  if (edit !== undefined) return { [rel]: edit };
  if (/^statusLine\s*:/m.test(readFileSync(file, 'utf8')))
    tally.left.push({
      what: file,
      why: `${adapter.name} was installed before install recorded its edits to this file, and the status line layout there is not byte for byte the one it wrote, so it cannot be told from yours and stands as it is`,
    });
  return {};
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
  // OMP's neutral root sits outside its harness home and may also be recorded
  // by another install; preserve files that manifest still owns.
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
    if (state === 'changed') {
      tally.left.push({ what: abs, why: 'the host changed it since install' });
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
 *  installed harness has one — the canon's parts too, the event vocabulary and the
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
  const { rest, removed, changed, left } = removal;
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

/**
 * Take back an EARLIER installation of `adapter` — the layout before the owned root —
 * by its deploy manifest in the harness directory: its persona commands, its settings
 * and config lines, its placed files while they are as written, its runtime config, and
 * the manifest last. `undefined` where there is no manifest, so nothing to take back.
 * A manifest that cannot be trusted is refused, with nothing removed.
 */
export function removeEarlierInstallation(
  adapter: HarnessAdapter,
  opts: Pick<UninstallCmdOpts, 'home' | 'dryRun'>,
): Tally | undefined {
  const dry = opts.dryRun ?? false;
  const harnessDir = harnessDirIn(adapter, opts.home);
  const manifestFile = join(harnessDir, MANIFEST_REL);
  if (!existsSync(manifestFile)) return undefined;
  const fault = recordFault(harnessDir);
  if (fault !== undefined) {
    throw new Error(
      `the earlier installation's deploy record ${manifestFile} is not usable: ${fault}; repair or delete the record and run it again`,
    );
  }
  const manifest = readManifest(harnessDir);
  // Read now: the persona step below rewrites the record, and a rewrite reads back as
  // one that records edits whatever it was.
  const editsRecorded = recordsHostEdits(harnessDir);
  const tally: Tally = { removed: [], left: [] };
  removePersonaLinks(harnessDir, opts, tally);
  restoreSettings(adapter, harnessDir, manifest, dry, tally);
  undoHostEdits(
    harnessDir,
    keepingModelRoles(
      harnessDir,
      editsRecorded
        ? manifest.hostEdits
        : unrecordedStatusLine(adapter, harnessDir, tally),
      tally,
    ),
    dry,
    tally,
  );
  removePlacedFiles(adapter, harnessDir, manifest, opts, tally);
  removeRuntimeStanza(adapter, manifest, opts.home, dry, tally);
  tally.removed.push({ what: `${manifestFile} (the deploy record)` });
  if (!dry) dropFile(harnessDir, manifestFile);
  return tally;
}

/**
 * Take back the installation of `adapter` at `placement`: every reference into the
 * root, found from where it points, so a root or record the host edited or removed
 * leaves none dangling; then the root, whole. The product owner's answers install wrote
 * into the host's settings are the host's, and stay. `undefined` where there is
 * neither a root nor a reference into one.
 */
export function removeOwnedInstallation(
  adapter: HarnessAdapter,
  placement: Placement,
  dry: boolean,
): Tally | undefined {
  const { harnessDir, root, scope } = placement;
  const present = existsSync(root);
  const record = present ? readInstallationRecord(root) : null;
  const unlinked = unlinkOwnedRoot({
    adapter,
    harnessDir,
    root,
    scope,
    record,
    dry,
  });
  if (!present && unlinked.changed.length === 0) return undefined;
  const tally: Tally = { removed: [], left: [...unlinked.left] };
  for (const what of unlinked.changed)
    tally.removed.push({
      what: `${what} (a reference into ${root})`,
      outside: { area: dirname(what), noun: 'reference' },
    });
  if (present) tally.removed.push({ what: `${root} (the owned root, whole)` });
  if (!dry) removeOwnedRoot(root);
  return tally;
}

/** The report: what was removed, by area unless `--verbose` lists each, and what was
 *  left always (the host's, so the product owner sees what remains and why). */
function print(tally: Tally, run: { dry: boolean; verbose: boolean }): void {
  const verb = run.dry ? 'would remove' : 'removed';
  if (run.verbose) {
    for (const r of tally.removed) say(`${verb} ${r.what}`);
  } else {
    const groups = new Map<string, Removal[]>();
    for (const r of tally.removed) {
      const key =
        r.outside === undefined
          ? r.what
          : `${r.outside.noun}\0${r.outside.area}`;
      groups.set(key, [...(groups.get(key) ?? []), r]);
    }
    for (const items of groups.values()) {
      const [first] = items as [Removal, ...Removal[]];
      say(
        first.outside === undefined || first.outside.noun === 'runtime config'
          ? `${verb} ${first.what}`
          : `${verb} ${plural(items.length, first.outside.noun)} from ${first.outside.area}`,
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
  const scope = opts.scope ?? 'user';
  const placement = placementOf(adapter, scope, {
    cwd: opts.cwd ?? process.cwd(),
    home: opts.home,
  });
  if ('refused' in placement) return fail(placement.refused);
  const { root } = placement;
  const run = { dry: opts.dryRun ?? false, verbose: opts.verbose ?? false };
  // A project's `.cratylus/<harness>` holding files but no installation record, with
  // nothing referring into it, is an earlier render tree: not this command's.
  if (
    scope === 'project' &&
    holdsRenderTree(root) &&
    unlinkOwnedRoot({ ...placement, adapter, record: null, dry: true }).changed
      .length === 0
  ) {
    return fail(
      `${root} holds files but no installation record, so it is an earlier render tree, not an installation; nothing is removed, so remove it yourself if it is no longer wanted`,
    );
  }
  const tally: Tally = { removed: [], left: [] };
  let found = false;
  try {
    // A project installation is only its root and the references into it; an earlier
    // installation, from before the owned root, was only ever the user's.
    const steps = [
      () => removeOwnedInstallation(adapter, placement, run.dry),
      ...(scope === 'user'
        ? [() => removeEarlierInstallation(adapter, opts)]
        : []),
    ];
    for (const remove of steps) {
      const done = remove();
      if (done === undefined) continue;
      found = true;
      tally.removed.push(...done.removed);
      tally.left.push(...done.left);
    }
  } catch (e) {
    print(tally, run);
    return fail(
      `stopped: ${(e as Error).message}; what is not yet removed is still recorded, so running it again continues`,
    );
  }
  if (!found) {
    say(
      scope === 'project'
        ? `nothing of ${CLI_BIN} is installed in ${adapter.name} in this project (no ${root}), so nothing is removed`
        : `nothing of ${CLI_BIN} is installed in ${adapter.name} here (no ${root}, and no earlier installation's record), so nothing is removed`,
    );
    return 0;
  }
  print(tally, run);
  say(
    run.dry
      ? 'next: run it again without --dry-run to remove them'
      : `next: restart ${adapter.name} to drop what it still has loaded`,
  );
  return 0;
}
