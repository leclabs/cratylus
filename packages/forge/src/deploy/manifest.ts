// Deploy's manifest — the DEPLOY-SPECIFIC half of prune-to-manifest.
//
// The mechanism itself (record → stale → contained → remove, and the bootstrap
// bound that makes an unexpected root safe) lives in `../prune`, because
// `project` converges its `--out` render tree by exactly the same means one
// stage upstream. Read that module's header for WHY the prune is bounded by a
// record rather than by a naming convention; this file holds only what is
// deploy's own and would be meaningless to a projector:
//
//   - the record's LOCATION and shape in a `.claude/` root, partitioned by KIND
//     (a projector has no kinds — its render tree is one unit);
//   - `KIND_ROOT` / `unattributable`, the report over a root SHARED with the
//     operator, the harness, and plugin installs (an `--out` dir is not shared);
//   - the settings.json hook REGISTRATIONS, which only a deploy ever writes.
//
// Deploy's three further bounds on candidacy — a warned skip carries forward, a
// `--only` run prunes inside its subset, and no prior manifest prunes nothing —
// are enforced by `staleFiles`/`nextKindRecord` in `../prune` and consumed here.

import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, relative, resolve as resolvePath } from 'node:path';
import { type KindRecord, recordPath } from '../prune/index.js';
import { splitLines } from './yaml-lines.js';

// Re-exported so deploy's callers keep reading the prune vocabulary off deploy's
// own module — the lift moved the HOME of the mechanism, not deploy's surface.
// Exactly what `deploy.ts` consumes and no more: `contained` is the escape guard
// INSIDE `applyPrune` and stays addressable only where it lives.
export {
  type KindRecord,
  applyPrune,
  nextKindRecord,
  staleFiles,
} from '../prune/index.js';

/** Where the record lives, relative to the deployed `.claude/` root. */
export const MANIFEST_REL = '.forge/deploy-manifest.json';
export const MANIFEST_VERSION = 1;

export interface DeployManifest {
  version: number;
  // kind -> name -> the paths that kind's placer wrote for that name.
  kinds: Record<string, KindRecord>;
  // settings.json hook commands this tool registered (the `hooks` kind).
  hookCommands: string[];
  // The persona commands this harness's install linked into the user's bin dir,
  // as paths relative to the user's HOME (`.local/bin/<persona>`). The bin dir is
  // shared with every other program on the host, so a link is ours only if it is
  // written here — never because it happens to point at our launcher.
  personaLinks: string[];
  // agent name -> the `model:` value the last deploy's RENDERED def carried (null ⇒
  // none), for the harness whose def `model:` line is where a host sets a model. A
  // deployed def whose `model:` differs from this is the host's edit, and the next
  // deploy keeps it: the value here is what deploy would write, never what the host
  // chose, so it stays true while the host's line stands.
  agentModels: Record<string, string | null>;
  // The claude `statusLine` install placed in the host's settings.json: `placed` is the
  // `command` it wrote (a later run that finds another there knows the host changed it),
  // `host` the command the host ran before — the badge worker carries it verbatim — or
  // null where the host had none. `null` ⇒ install placed none. It is what an uninstall
  // restores the host's line from.
  statusLine: { placed: string; host: string | null } | null;
  // rel path (from the deploy root, POSIX) -> the sha-256 of the bytes this tool last
  // WROTE there, for every path in `kinds`. A placed file whose bytes still hash to this
  // is untouched since; one that does not is the host's own edit, and an uninstall
  // leaves it. A path with no digest (recorded before digests were kept) cannot be told
  // either way, and is left too.
  digests: Record<string, string>;
  // rel path (from the deploy root, POSIX) of a host-owned TEXT file install edited
  // (omp's config.yml) -> the lines it put in. The bytes around them are the host's and
  // are never recorded; an uninstall takes these lines out and touches nothing else.
  hostEdits: Record<string, HostEdit>;
}

/** One run of lines install put into a host-owned text file, kept WITH their line
 *  terminators so the file's own line endings come back byte for byte. */
export interface LineHunk {
  /** The line just above the run as install left the file, or null where the run
   *  opens it. It tells two identical runs apart; it need not still match. */
  context: string | null;
  /** What the host had where `after` now stands; empty for a pure insertion. */
  before: string[];
  /** What install wrote. */
  after: string[];
}

/** Everything install changed in one host-owned text file. */
export interface HostEdit {
  /** Whether install created the file: an uninstall that leaves it empty removes it. */
  created: boolean;
  /** In the order made; an uninstall takes them out newest first. */
  hunks: LineHunk[];
}

export function emptyManifest(): DeployManifest {
  return {
    version: MANIFEST_VERSION,
    kinds: {},
    hookCommands: [],
    personaLinks: [],
    agentModels: {},
    statusLine: null,
    digests: {},
    hostEdits: {},
  };
}

/** Read the record for a deploy root. A missing, unreadable, or malformed
 *  manifest reads as EMPTY — an unattributable target prunes nothing, which is
 *  the safe direction. */
export function readManifest(harnessDir: string): DeployManifest {
  const f = resolvePath(harnessDir, MANIFEST_REL);
  if (!existsSync(f)) {
    return emptyManifest();
  }
  try {
    const parsed = JSON.parse(
      readFileSync(f, 'utf-8'),
    ) as Partial<DeployManifest>;
    if (parsed.version !== MANIFEST_VERSION) {
      return emptyManifest();
    }
    return {
      version: MANIFEST_VERSION,
      kinds: parsed.kinds ?? {},
      hookCommands: parsed.hookCommands ?? [],
      personaLinks: parsed.personaLinks ?? [],
      agentModels: parsed.agentModels ?? {},
      statusLine: parsed.statusLine ?? null,
      digests: parsed.digests ?? {},
      hostEdits: parsed.hostEdits ?? {},
    };
  } catch {
    return emptyManifest();
  }
}

/** Does this root carry a prior record at all? (No record ⇒ nothing is
 *  attributable ⇒ this deploy only establishes one.) */
export function hasManifest(harnessDir: string): boolean {
  return existsSync(resolvePath(harnessDir, MANIFEST_REL));
}

export function writeManifest(harnessDir: string, m: DeployManifest): void {
  const f = resolvePath(harnessDir, MANIFEST_REL);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, `${JSON.stringify(m, null, 2)}\n`, 'utf-8');
}

// ── What an uninstall needs, recorded ────────────────────────────────────────
//
// The record above says WHICH paths this tool wrote; an uninstall also has to know
// whether the host has changed one since, and which lines of a host-owned file were
// this tool's. Both are recorded at the time of writing, from what was written:
// a digest of every placed file's bytes, and the lines install put into a text file
// the host owns. Neither holds the host's own content.

/** The sha-256 (hex) of the file's bytes; undefined where `abs` is absent or not a file. */
export function digestFile(abs: string): string | undefined {
  try {
    if (!statSync(abs).isFile()) return undefined;
    return createHash('sha256').update(readFileSync(abs)).digest('hex');
  } catch {
    return undefined;
  }
}

/** The digests of the files a placer just wrote, read back from the root. Called
 *  straight after placing, so the bytes hashed are the bytes the placer laid down. */
export function digestWritten(
  harnessDir: string,
  written: KindRecord,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rel of Object.values(written).flat()) {
    const digest = digestFile(resolvePath(harnessDir, rel));
    if (digest !== undefined) out[rel] = digest;
  }
  return out;
}

/** The digests to keep once a run has written `fresh`: one per path the new `kinds`
 *  record, `fresh`'s where this run wrote it and the recorded one where it did not
 *  (a warned skip, a name outside a `--only` subset) — carried, never re-read, so a
 *  file the host has edited is not blessed by a run that did not write it. */
export function nextDigests(
  prior: Readonly<Record<string, string>>,
  kinds: Readonly<Record<string, KindRecord>>,
  fresh: Readonly<Record<string, string>>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const record of Object.values(kinds)) {
    for (const rel of Object.values(record).flat()) {
      const digest = fresh[rel] ?? prior[rel];
      if (digest !== undefined) out[rel] = digest;
    }
  }
  return out;
}

/** A file's lines with their terminators, so joining them gives the file back. */
const literalLines = (text: string): string[] =>
  splitLines(text).map(([t, e]) => t + e);

/**
 * The runs of lines that turn `before` into `after`, as a minimal line diff: only
 * insertions and replacements are expected of install's edits, and a deletion would
 * simply carry an empty `after`. The middle between the common head and tail is
 * aligned by longest common subsequence, so two edits apart in a file stay two
 * hunks and the host's lines between them are never part of either.
 */
export function lineHunks(before: string, after: string): LineHunk[] {
  const a = literalLines(before);
  const b = literalLines(after);
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head += 1;
  let tailA = a.length;
  let tailB = b.length;
  while (tailA > head && tailB > head && a[tailA - 1] === b[tailB - 1]) {
    tailA -= 1;
    tailB -= 1;
  }
  const x = a.slice(head, tailA);
  const y = b.slice(head, tailB);
  const width = y.length + 1;
  const lcs = new Uint32Array((x.length + 1) * width);
  const at = (i: number, j: number): number => lcs[i * width + j] as number;
  for (let i = x.length - 1; i >= 0; i -= 1) {
    for (let j = y.length - 1; j >= 0; j -= 1) {
      lcs[i * width + j] =
        x[i] === y[j]
          ? at(i + 1, j + 1) + 1
          : Math.max(at(i + 1, j), at(i, j + 1));
    }
  }
  const hunks: LineHunk[] = [];
  let open: { start: number; before: string[]; after: string[] } | undefined;
  const close = (): void => {
    if (open === undefined) return;
    const above = head + open.start - 1;
    hunks.push({
      context: above >= 0 ? (b[above] as string) : null,
      before: open.before,
      after: open.after,
    });
    open = undefined;
  };
  let i = 0;
  let j = 0;
  while (i < x.length || j < y.length) {
    if (i < x.length && j < y.length && x[i] === y[j]) {
      close();
      i += 1;
      j += 1;
      continue;
    }
    open ??= { start: j, before: [], after: [] };
    if (j < y.length && (i === x.length || at(i, j + 1) >= at(i + 1, j))) {
      open.after.push(y[j] as string);
      j += 1;
    } else {
      open.before.push(x[i] as string);
      i += 1;
    }
  }
  close();
  return hunks;
}

/** What became of one hunk when an uninstall took it out.
 *   - `undone`   — `after` stood in the file and was replaced by `before`.
 *   - `restored` — `after` is gone and `before` stands: the host put it back itself.
 *   - `changed`  — neither stands: the host changed or removed what install wrote,
 *                  so nothing was touched. */
export type HunkState = 'undone' | 'restored' | 'changed';

export interface HunkUndo {
  readonly hunk: LineHunk;
  readonly state: HunkState;
}

/** Where `run` stands in `lines`, preferring the place under `context`; -1 when nowhere. */
function findRun(
  lines: readonly string[],
  run: readonly string[],
  context: string | null,
): number {
  let first = -1;
  for (let i = 0; i + run.length <= lines.length; i += 1) {
    if (!run.every((line, k) => lines[i + k] === line)) continue;
    if ((i > 0 ? lines[i - 1] : null) === context) return i;
    if (first < 0) first = i;
  }
  return first;
}

/** `text` with each hunk taken out, newest first, and what became of each (in the
 *  order recorded). A hunk whose lines are not there as written is left alone. */
export function undoHunks(
  text: string,
  hunks: readonly LineHunk[],
): { text: string; results: HunkUndo[] } {
  const lines = literalLines(text);
  const results: HunkUndo[] = [];
  for (const hunk of [...hunks].reverse()) {
    const at =
      hunk.after.length > 0 ? findRun(lines, hunk.after, hunk.context) : -1;
    if (at >= 0) {
      lines.splice(at, hunk.after.length, ...hunk.before);
      results.push({ hunk, state: 'undone' });
      continue;
    }
    const back =
      hunk.before.length > 0 && findRun(lines, hunk.before, hunk.context) >= 0;
    results.push({ hunk, state: back ? 'restored' : 'changed' });
  }
  return { text: lines.join(''), results: results.reverse() };
}

/** Record what install did to the host-owned text file `file`, in `harnessDir`'s
 *  manifest. Merged with what is already there for the file, and never twice: a hunk
 *  already recorded is not recorded again. */
export function noteHostEdit(
  harnessDir: string,
  file: string,
  edit: HostEdit,
): void {
  if (edit.hunks.length === 0) return;
  const manifest = readManifest(harnessDir);
  const key = recordPath(relative(harnessDir, file));
  const prior = manifest.hostEdits[key];
  const hunks = [...(prior?.hunks ?? [])];
  for (const hunk of edit.hunks) {
    if (!hunks.some((h) => JSON.stringify(h) === JSON.stringify(hunk))) {
      hunks.push(hunk);
    }
  }
  writeManifest(harnessDir, {
    ...manifest,
    hostEdits: {
      ...manifest.hostEdits,
      [key]: { created: (prior?.created ?? false) || edit.created, hunks },
    },
  });
}

/** The kind's top-level dir under the deploy root, and how a name reads out of
 *  an entry there. An agent entry is `<name><agentExt>`, and the extension is the
 *  HARNESS's — it is not a constant of this table, so the table only records THAT
 *  the entry is extended, never with what. Naming `.md` here would make prune
 *  blind to a harness whose agents carry another extension: a tree filtered by
 *  `.md` matches nothing, and nothing reads as "no orphans". */
const KIND_ROOT: Record<string, { dir: string; extended?: boolean }> = {
  agent: { dir: 'agents', extended: true },
  skill: { dir: 'skills' },
  hooks: { dir: 'hooks' },
};

/**
 * REPORT-ONLY. Names sitting in the kind's dir that this tool cannot account
 * for: neither in the render tree nor in the manifest. Two populations are mixed
 * in here and NOTHING can separate them — an operator's own artifact, and an
 * orphan a pre-manifest deploy left behind. Because they cannot be separated,
 * they are never deleted; the dry run merely SHOWS them so the operator can
 * judge. Deriving ownership from what a dir happens to contain is exactly the
 * inference `applyPrune` refuses, and it stays refused: this returns a list, and
 * no caller may pass it to a delete.
 */
export function unattributable(
  harnessDir: string,
  kind: string,
  treeNames: string[],
  manifestNames: string[],
  agentExt = '.md',
): string[] {
  const spec = KIND_ROOT[kind];
  if (!spec) {
    return [];
  }
  const dir = resolvePath(harnessDir, spec.dir);
  if (!existsSync(dir)) {
    return [];
  }
  const suffix = spec.extended ? agentExt : undefined;
  const known = new Set([...treeNames, ...manifestNames]);
  return readdirSync(dir)
    .filter((e) => (suffix ? e.endsWith(suffix) : true))
    .map((e) => (suffix ? e.slice(0, -suffix.length) : e))
    .filter((n) => !known.has(n))
    .sort();
}

/** One Claude `settings.json` command-hook entry (mirrors `hooks.ts`). */
interface HookCmd {
  type?: string;
  command?: string;
  timeout?: number;
}
interface HookEntry {
  matcher?: string;
  hooks?: HookCmd[];
}
type HooksBlock = Record<string, HookEntry[]>;

/**
 * Drop the settings entries whose commands are ALL stale — the registrations a
 * prior deploy added for a hook the render tree no longer carries. Surgical by
 * construction: an entry is dropped only when every command in it appears in
 * `commands`, so a foreign entry (or a mixed one) is never collateral. Pure —
 * no IO — and returns the count actually dropped.
 *
 * Left standing, such a registration is worse than clutter: the harness fires a
 * command whose worker script this same prune just deleted.
 */
export function unregisterHookCommands(
  existing: Record<string, unknown>,
  commands: string[],
): { settings: Record<string, unknown>; removed: number } {
  const drop = new Set(commands);
  if (drop.size === 0) {
    return { settings: existing, removed: 0 };
  }
  const settings: Record<string, unknown> = { ...existing };
  const hooks: HooksBlock = { ...((settings.hooks as HooksBlock) ?? {}) };
  let removed = 0;
  for (const [event, entries] of Object.entries(hooks)) {
    const kept = (entries ?? []).filter((e) => {
      const cmds = (e.hooks ?? []).map((h) => h.command ?? '');
      const ours = cmds.length > 0 && cmds.every((c) => drop.has(c));
      if (ours) {
        removed += 1;
      }
      return !ours;
    });
    if (kept.length === 0) {
      delete hooks[event];
    } else {
      hooks[event] = kept;
    }
  }
  settings.hooks = hooks;
  return { settings, removed };
}

/** Apply `unregisterHookCommands` to a settings file on disk. */
export function unregisterHookCommandsAt(
  settingsFile: string,
  commands: string[],
  dry: boolean,
): number {
  if (commands.length === 0 || !existsSync(settingsFile)) {
    return 0;
  }
  let existing: Record<string, unknown>;
  try {
    existing = JSON.parse(readFileSync(settingsFile, 'utf-8')) as Record<
      string,
      unknown
    >;
  } catch {
    return 0; // never rewrite a file we could not parse
  }
  const { settings, removed } = unregisterHookCommands(existing, commands);
  if (removed > 0 && !dry) {
    writeFileSync(
      settingsFile,
      `${JSON.stringify(settings, null, 2)}\n`,
      'utf-8',
    );
  }
  return removed;
}
