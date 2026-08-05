// Deploy manifest + prune — the half of deploy that SUBTRACTS.
//
// Placement alone only ever unions, so a retired artifact outlives its source
// cell forever: the target accumulates, it never converges. Convergence needs
// deletion, and deletion in `~/.claude` is a data-loss hazard — that root also
// holds user-authored skills, plugin installs, and harness files this tool has
// no claim on whatsoever.
//
// So the prune is bounded by a RECORD, not by a rule. Every deploy writes a
// manifest of exactly the harnessDir-relative paths it laid down, keyed by kind
// and name; the next deploy's prune candidates are that manifest's paths and
// NOTHING else. Attribution by naming convention ("looks like one of ours") is
// explicitly refused — a convention cannot distinguish `skills/graphify/`
// installed by the operator from `skills/wake/` shipped by us.
//
// Three further bounds:
//   - a name whose source was MISSING this run (a warned skip) is not a
//     convergence statement, so its prior paths are carried, never swept;
//   - a NARROWED deploy (`--only`) is a subset intent, so prune stays inside the
//     named subset;
//   - with NO prior manifest nothing is attributable, so the first deploy after
//     this mechanism lands only ESTABLISHES the record — it prunes nothing.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import {
  dirname,
  isAbsolute,
  relative,
  resolve as resolvePath,
  sep,
} from 'node:path';

/** Where the record lives, relative to the deployed `.claude/` root. */
export const MANIFEST_REL = '.forge/deploy-manifest.json';
export const MANIFEST_VERSION = 1;

/** harnessDir-relative POSIX paths written for one kind, grouped by name. */
export type KindRecord = Record<string, string[]>;

export interface DeployManifest {
  version: number;
  // kind -> name -> the paths that kind's placer wrote for that name.
  kinds: Record<string, KindRecord>;
  // settings.json hook commands this tool registered (the `hooks` kind).
  hookCommands: string[];
}

export function emptyManifest(): DeployManifest {
  return { version: MANIFEST_VERSION, kinds: {}, hookCommands: [] };
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

/** The paths a prior deploy recorded that this deploy did NOT re-write — the
 *  orphans. `skipped` names (source missing this run) and, under `narrowed`,
 *  every name outside the deployed subset are excluded from candidacy. */
export function staleFiles(
  prior: KindRecord,
  written: KindRecord,
  skipped: string[],
  narrowed: boolean,
): string[] {
  const keep = new Set(Object.values(written).flat());
  const skip = new Set(skipped);
  const candidateNames = narrowed
    ? Object.keys(written)
    : Object.keys(prior).filter((n) => !skip.has(n));
  const stale = new Set<string>();
  for (const name of candidateNames) {
    for (const p of prior[name] ?? []) {
      if (!keep.has(p)) {
        stale.add(p);
      }
    }
  }
  return [...stale].sort();
}

/** The record to persist for this kind after the placer ran. Narrowed deploys
 *  and warned skips carry their prior entries forward untouched. */
export function nextKindRecord(
  prior: KindRecord,
  written: KindRecord,
  skipped: string[],
  narrowed: boolean,
): KindRecord {
  if (narrowed) {
    return { ...prior, ...written };
  }
  const next: KindRecord = { ...written };
  for (const name of skipped) {
    if (prior[name] && !next[name]) {
      next[name] = prior[name];
    }
  }
  return next;
}

/** The kind's top-level dir under the deploy root, and how a name reads out of
 *  an entry there. An agent entry is `<name><agentExt>`, and the extension is the
 *  HARNESS's — it is not a constant of this table, so the table only records THAT
 *  the entry is extended, never with what. Naming `.md` here is what made codex
 *  prune blind: a `.toml` tree filtered by `.md` matches nothing, and nothing
 *  reads as "no orphans". */
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

/** Is `rel` strictly inside `harnessDir` once resolved? A tampered or
 *  hand-edited manifest must not be able to steer a delete out of the root. */
function contained(harnessDir: string, rel: string): boolean {
  const root = resolvePath(harnessDir);
  const abs = resolvePath(root, rel);
  const r = relative(root, abs);
  return r !== '' && !r.startsWith('..') && !isAbsolute(r);
}

/** Remove each stale path, then any directory the removal emptied (up to, but
 *  never including, the deploy root). Returns what was actually removed; a
 *  dry run returns the same set having touched nothing. */
export function applyPrune(
  harnessDir: string,
  stale: string[],
  dry: boolean,
): string[] {
  const removed: string[] = [];
  for (const rel of stale) {
    if (!contained(harnessDir, rel)) {
      continue;
    }
    const abs = resolvePath(harnessDir, rel);
    if (!existsSync(abs)) {
      // already gone (a hand-removed orphan) — still drop it from the record
      removed.push(rel);
      continue;
    }
    if (!dry) {
      unlinkSync(abs);
      pruneEmptyDirs(harnessDir, dirname(abs));
    }
    removed.push(rel);
  }
  return removed;
}

/** Walk up from `dir`, removing each directory that the prune left empty, and
 *  stopping at the deploy root (which is never removed). */
function pruneEmptyDirs(harnessDir: string, dir: string): void {
  const root = resolvePath(harnessDir);
  let cur = resolvePath(dir);
  while (cur !== root && cur.startsWith(root + sep)) {
    if (!existsSync(cur) || readdirSync(cur).length > 0) {
      return;
    }
    rmdirSync(cur);
    cur = dirname(cur);
  }
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
