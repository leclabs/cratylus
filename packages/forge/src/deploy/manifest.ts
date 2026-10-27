// The DEPLOY RECORD an earlier installation kept — the layout before the owned root,
// on the harness's own surfaces — read so an upgrade or uninstall takes back exactly
// what it recorded placing and editing, and nothing else.
//
// The removal itself (contained → remove) lives in `../prune`; read that module's
// header for WHY a removal is bounded by a record rather than by a naming convention.
// This file holds the record's LOCATION and shape in the harness root, partitioned by
// KIND; the host edits it recorded and how each is undone; and the settings.json hook
// REGISTRATIONS it recorded writing.

import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import type { KindRecord } from '../prune/index.js';
import { splitLines } from './yaml-lines.js';

// Re-exported so the uninstall reads the prune it applies off deploy's own module:
// `contained` is the escape guard INSIDE `applyPrune` and stays addressable only
// where it lives.
export { applyPrune } from '../prune/index.js';

/** Where the record lives, relative to the deployed `.claude/` root. */
export const MANIFEST_REL = '.forge/deploy-manifest.json';
export const MANIFEST_VERSION = 1;

export interface DeployManifest {
  version: number;
  // kind -> name -> the paths that kind's placer wrote for that name.
  kinds: Record<string, KindRecord>;
  // settings.json hook commands this tool registered (the `hooks` kind).
  hookCommands: string[];
  // The persona commands an EARLIER install linked into the user's bin dir, as paths
  // relative to the user's HOME (`.local/bin/<persona>`). Install links none any more;
  // the record stays so install and uninstall can take away what was linked. The bin
  // dir is shared with every other program on the host, so a link is ours only if it
  // is written here.
  personaLinks: string[];
  // agent name -> the `model:` value the last deploy's RENDERED def carried (null ⇒
  // none), for the harness whose def `model:` line is where a host sets a model. A
  // deployed def whose `model:` differs from this, and is not in `hostModels`, is the
  // host's edit. It is what deploy would write, never what the host chose.
  agentModels: Record<string, string | null>;
  // The agents whose `model:` line is the host's, whatever its value against the
  // rendering: one the operator chose at install, or one the host edited afterwards.
  // A deploy places such a def carrying the line the host has, or none where the host
  // removed it, and never renders one over it — a value cannot say this, since a
  // chosen line can equal the rendered one and a removed line equals "none". A manifest
  // written before this list reads as `[]`: `agentModels` alone then decides.
  hostModels: string[];
  // The model roles whose `modelRoles` entry in the host's config is the operator's
  // choice (omp), whatever its value against the one install seeds the entry with: a
  // value cannot say this, since a choice can equal the seed. Such an entry is the
  // host's from then on. A manifest written before this list reads as `[]`.
  hostRoutes: string[];
  // model role -> the value install seeded its `modelRoles` entry with (omp). An entry
  // that still holds that value and is not in `hostRoutes` is install's own seed, which
  // a later install moves to the value it would seed now, or to the model the operator
  // chooses. A manifest written before this record reads as `{}`; an entry recorded in
  // `hostEdits` as an inserted line, standing byte for byte, is then install's own.
  modelRoleSeeds: Record<string, string>;
  // The claude `statusLine` install placed in the host's settings.json: `placed` is the
  // `command` it wrote (a later run that finds another there knows the host changed it),
  // `host` the command the host ran before — the badge worker carries it verbatim — or
  // null where the host had none. `null` ⇒ install placed none. It is what an uninstall
  // restores the host's line from.
  statusLine: { placed: string; host: string | null } | null;
  // rel path (from the deploy root, POSIX) -> the sha-256 of the bytes this tool last
  // WROTE there, for every path in `kinds`. A placed file whose bytes still hash to this
  // is untouched since; one that does not is the host's own edit, and an uninstall
  // leaves it. A path with no digest (recorded before digests were kept) is taken back:
  // the record of placing it is what makes it cratylus's (decision 0114).
  digests: Record<string, string>;
  // rel path (from the deploy root, POSIX) of a host-owned TEXT file install edited
  // (omp's config.yml) -> the lines it put in. The bytes around them are the host's and
  // are never recorded; an uninstall takes these lines out and touches nothing else.
  hostEdits: Record<string, HostEdit>;
  // What this harness's last deploy wrote into the host runtime config, by digest of each
  // part's value: the event vocabulary, this harness's stanza and the configuration of each
  // capability it wrote. The file is shared with the host, which may keep keys of its own
  // in it and may change a part after deploy, so an uninstall takes out a part only while
  // it is still what is recorded, and leaves one that is not. `null` ⇒ none recorded (a
  // deploy from before this was kept, or one that emitted no runtime config), and no part
  // is then taken out, as a change by the host cannot be ruled out.
  runtimeConfig: RuntimeConfigRecord | null;
}

/** The parts of the host runtime config a deploy wrote, each as the sha-256 of its value. */
export interface RuntimeConfigRecord {
  /** `events.vocabulary`. */
  vocabulary: string;
  /** `harnesses.<this harness>`. */
  stanza: string;
  /** `configuration.<capability>`, per capability the deploy configured. */
  capabilities: Record<string, string>;
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
  /** Set where the record was migrated from one that recorded no edits: what an older
   *  install did to this file beyond the lines adopted cannot be told from the host's. */
  migrated?: boolean;
}

export function emptyManifest(): DeployManifest {
  return {
    version: MANIFEST_VERSION,
    kinds: {},
    hookCommands: [],
    personaLinks: [],
    agentModels: {},
    hostModels: [],
    hostRoutes: [],
    modelRoleSeeds: {},
    statusLine: null,
    digests: {},
    hostEdits: {},
    runtimeConfig: null,
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
      hostModels: parsed.hostModels ?? [],
      hostRoutes: parsed.hostRoutes ?? [],
      modelRoleSeeds: parsed.modelRoleSeeds ?? {},
      statusLine: parsed.statusLine ?? null,
      digests: parsed.digests ?? {},
      hostEdits: parsed.hostEdits ?? {},
      runtimeConfig: parsed.runtimeConfig ?? null,
    };
  } catch {
    return emptyManifest();
  }
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

/** A file's lines with their terminators, so joining them gives the file back. */
const literalLines = (text: string): string[] =>
  splitLines(text).map(([t, e]) => t + e);

/** A line without its terminator. */
const textOf = (line: string): string => line.replace(/[\r\n]+$/, '');

/**
 * The runs of lines that turn `before` into `after`, as a minimal line diff. Lines are
 * aligned by their TEXT, so a last line install had to end (a terminator gained) is a
 * matched line that differs, not a deleted one and an added one. Install only inserts and
 * replaces, so every hunk is one of two shapes: a pure insertion (`before` empty) or one
 * line replaced by one line. A gap that holds both — a flow list rewritten with a block
 * appended right under it — is spliced into the replacement, then the insertion beneath it.
 * The middle between the common head and tail is aligned by longest common subsequence,
 * so two edits apart in a file stay two hunks and the host's lines between them are
 * never part of either.
 */
export function lineHunks(before: string, after: string): LineHunk[] {
  const a = literalLines(before);
  const b = literalLines(after);
  const ka = a.map(textOf);
  const kb = b.map(textOf);
  let head = 0;
  while (head < a.length && head < b.length && ka[head] === kb[head]) head += 1;
  let tailA = a.length;
  let tailB = b.length;
  while (tailA > head && tailB > head && ka[tailA - 1] === kb[tailB - 1]) {
    tailA -= 1;
    tailB -= 1;
  }
  const hunks: LineHunk[] = [];
  const paired = (ai: number, bi: number): void => {
    if (a[ai] === b[bi]) return;
    hunks.push({
      context: bi > 0 ? (b[bi - 1] as string) : null,
      before: [a[ai] as string],
      after: [b[bi] as string],
    });
  };
  for (let k = 0; k < head; k += 1) paired(k, k);

  const x = ka.slice(head, tailA);
  const y = kb.slice(head, tailB);
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
  let open: { start: number; before: string[]; after: string[] } | undefined;
  const close = (): void => {
    if (open === undefined) return;
    const above = head + open.start - 1;
    let context: string | null = above >= 0 ? (b[above] as string) : null;
    const pairs = Math.min(open.before.length, open.after.length);
    for (let k = 0; k < pairs; k += 1) {
      hunks.push({
        context,
        before: [open.before[k] as string],
        after: [open.after[k] as string],
      });
      context = open.after[k] as string;
    }
    if (open.after.length > pairs) {
      hunks.push({ context, before: [], after: open.after.slice(pairs) });
    } else if (open.before.length > pairs) {
      hunks.push({ context, before: open.before.slice(pairs), after: [] });
    }
    open = undefined;
  };
  let i = 0;
  let j = 0;
  while (i < x.length || j < y.length) {
    if (i < x.length && j < y.length && x[i] === y[j]) {
      close();
      paired(head + i, head + j);
      i += 1;
      j += 1;
      continue;
    }
    open ??= { start: j, before: [], after: [] };
    if (j < y.length && (i === x.length || at(i, j + 1) >= at(i + 1, j))) {
      open.after.push(b[head + j] as string);
      j += 1;
    } else {
      open.before.push(a[head + i] as string);
      i += 1;
    }
  }
  close();
  for (let k = 0; tailA + k < a.length; k += 1) paired(tailA + k, tailB + k);
  return hunks;
}

/** What became of one hunk when an uninstall took it out.
 *   - `undone`   — every line install wrote stood in the file and is gone (or, for a
 *                  replaced line, is the host's original again).
 *   - `partial`  — some lines were taken out; the rest are in `changed` or `holding`.
 *   - `restored` — install's lines are gone and the original stands: the host put it
 *                  back itself.
 *   - `changed`  — nothing was taken: the host changed or removed what install wrote. */
export type HunkState = 'undone' | 'partial' | 'restored' | 'changed';

export interface HunkUndo {
  readonly hunk: LineHunk;
  readonly state: HunkState;
  /** The lines install wrote that were taken out. */
  readonly removed: string[];
  /** Lines install wrote that the host has since changed or removed: whatever the host
   *  has there instead is untouched. */
  readonly changed: string[];
  /** Lines install wrote that stay because lines of the host's stand beneath them, so
   *  the host's lines keep the structure they were written under. */
  readonly holding: string[];
}

const indentOf = (line: string): number =>
  (/^[ \t]*/.exec(line) as RegExpExecArray)[0].length;

/** Whether `line` carries anything a YAML reader would take as content. */
const isContent = (line: string): boolean => {
  const t = line.trim();
  return t !== '' && !t.startsWith('#');
};

/** Where each of `hunk.after` stands in `lines`, or -1: searched forward from under the
 *  hunk's context line, in order, and from the top for a line that moved. */
function locate(lines: readonly string[], hunk: LineHunk): number[] {
  const context = hunk.context === null ? -1 : lines.indexOf(hunk.context);
  const taken = new Set<number>();
  let from = context + 1;
  return hunk.after.map((line) => {
    let at = lines.indexOf(line, from);
    if (at < 0 || taken.has(at)) {
      at = lines.findIndex((l, i) => l === line && !taken.has(i));
    }
    if (at >= 0) {
      taken.add(at);
      from = Math.max(from, at + 1);
    }
    return at;
  });
}

/** Whether a line of the host's stands beneath `lines[at]`, past the lines `gone`: the
 *  next line with content is indented deeper, or is a list item under a `key:`. */
function hasChild(
  lines: readonly string[],
  gone: ReadonlySet<number>,
  at: number,
): boolean {
  const own = lines[at] as string;
  const opens = textOf(own).trimEnd().endsWith(':');
  for (let j = at + 1; j < lines.length; j += 1) {
    const next = lines[j] as string;
    if (gone.has(j) || !isContent(next)) continue;
    return (
      indentOf(next) > indentOf(own) ||
      (opens &&
        indentOf(next) === indentOf(own) &&
        next.trimStart().startsWith('- '))
    );
  }
  return false;
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

/** Take one hunk out of `lines`, in place. */
function undoHunk(lines: string[], hunk: LineHunk): HunkUndo {
  const none = { removed: [], changed: [], holding: [] };

  // A line install replaced: the host's original goes back where it stood.
  if (hunk.before.length === 1 && hunk.after.length === 1) {
    const [was] = hunk.before as [string];
    const [wrote] = hunk.after as [string];
    const at = findRun(lines, [wrote], hunk.context);
    // A line only given its terminator (install appended beneath the file's last line)
    // is put back unterminated only while it IS the last line: with anything after it,
    // the terminator is what keeps the host's lines apart.
    if (at >= 0 && textOf(was) === textOf(wrote) && at !== lines.length - 1) {
      return { hunk, state: 'restored', ...none };
    }
    if (at >= 0) {
      lines[at] = was;
      return { hunk, state: 'undone', ...none, removed: [wrote] };
    }
    return lines.includes(was)
      ? { hunk, state: 'restored', ...none }
      : { hunk, state: 'changed', ...none, changed: [wrote] };
  }

  // Lines install inserted: each is taken out ON ITS OWN, so a line the host has changed
  // does not keep its neighbours in the file. A line with a host line beneath it stays,
  // bottom up, so what the host wrote is never left without the block it sits in.
  if (hunk.before.length === 0 && hunk.after.length > 0) {
    const where = locate(lines, hunk);
    const gone = new Set<number>();
    const removed: string[] = [];
    const changed: string[] = [];
    const holding: string[] = [];
    for (let k = hunk.after.length - 1; k >= 0; k -= 1) {
      const line = hunk.after[k] as string;
      const at = where[k] as number;
      if (at < 0) changed.unshift(line);
      else if (hasChild(lines, gone, at)) holding.unshift(line);
      else {
        gone.add(at);
        removed.unshift(line);
      }
    }
    const kept = lines.filter((_, i) => !gone.has(i));
    lines.splice(0, lines.length, ...kept);
    const state =
      removed.length === 0
        ? 'changed'
        : changed.length + holding.length === 0
          ? 'undone'
          : 'partial';
    return { hunk, state, removed, changed, holding };
  }

  // Any other shape is taken whole or not at all.
  const at =
    hunk.after.length > 0 ? findRun(lines, hunk.after, hunk.context) : -1;
  if (at >= 0) {
    lines.splice(at, hunk.after.length, ...hunk.before);
    return { hunk, state: 'undone', ...none, removed: [...hunk.after] };
  }
  const back =
    hunk.before.length > 0 && findRun(lines, hunk.before, hunk.context) >= 0;
  return back || hunk.after.length === 0
    ? { hunk, state: 'restored', ...none }
    : { hunk, state: 'changed', ...none, changed: [...hunk.after] };
}

/** `text` with each hunk taken out, newest first, and what became of each (in the
 *  order recorded). A line the host has changed since is left as it is. */
export function undoHunks(
  text: string,
  hunks: readonly LineHunk[],
): { text: string; results: HunkUndo[] } {
  const lines = literalLines(text);
  const results = [...hunks].reverse().map((hunk) => undoHunk(lines, hunk));
  return { text: lines.join(''), results: results.reverse() };
}

/** A hunk that records `count` lines ALREADY in `text`, from line `from`, as install's:
 *  what an install from before edits were recorded put there. */
export function adoptedHunk(
  text: string,
  from: number,
  count: number,
): LineHunk {
  const lines = literalLines(text);
  return {
    context: from > 0 ? (lines[from - 1] as string) : null,
    before: [],
    after: lines.slice(from, from + count),
  };
}

/** Whether the record on disk was written by a version that records host edits. One
 *  written before carries no `hostEdits` at all — which is not the same as carrying an
 *  empty one: the first cannot say what install put in the host's config files, the
 *  second says it put nothing. `readManifest` reads both as empty. */
export function recordsHostEdits(harnessDir: string): boolean {
  try {
    const parsed = JSON.parse(
      readFileSync(resolvePath(harnessDir, MANIFEST_REL), 'utf-8'),
    ) as Partial<DeployManifest>;
    return parsed.hostEdits !== undefined;
  } catch {
    return false;
  }
}

/** One Claude `settings.json` command-hook entry. */
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
