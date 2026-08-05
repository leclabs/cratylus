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

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import type { KindRecord } from '../prune/index.js';

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
