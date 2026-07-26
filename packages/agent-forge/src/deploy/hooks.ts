// Hooks placer — deploy a projected hooks render tree to a host `.claude/`:
//   1. ship each hook's worker scripts to `<claudeDir>/hooks/<id>/` (generated
//      substance, overwritten freely — same contract as a skill dir);
//   2. MERGE the projected `settings.json` `hooks` block into the host's
//      existing settings.json, idempotently and NON-DESTRUCTIVELY (never clobber
//      permissions / env / other hooks / unrelated keys).
//
// The merge replaces the old hand-rolled `jq` toggle: registration is now
// agent-forge-managed. Off-by-default is preserved at RUNTIME — the worker re-checks a
// per-repo opt-in flag at fire time, so a registered-but-unopted hook is inert.
//
// The render tree for hooks is: `<root>/settings.json` (the hooks fragment) +
// `<root>/hooks/<id>/<asset>` (the worker scripts). `RenderTree.hooksDir` points
// at `<root>` (the dir holding both).

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import {
  type PlaceOpts,
  type PlaceResult,
  type RenderTree,
  emptyReport,
} from './types.js';

/** One Claude `settings.json` command-hook entry. */
interface HookCmd {
  type: 'command';
  command: string;
  timeout?: number;
}
/** One entry under a native event: optional matcher + its command hooks. */
interface HookEntry {
  matcher?: string;
  hooks: HookCmd[];
}
type HooksBlock = Record<string, HookEntry[]>;

/** Does this event already carry an entry whose hooks include `command`? */
function hasCommand(entries: HookEntry[], command: string): boolean {
  return entries.some((e) => e.hooks?.some((h) => h.command === command));
}

/**
 * Merge a projected `hooks` block into an existing settings object, in place on
 * a clone, idempotently: for each event, append each incoming entry only if no
 * existing entry already registers the same command. Returns the merged settings
 * + the count of entries actually added (0 ⇒ already present, a no-op write).
 * Pure — no IO — so it is unit-testable independently of the placer.
 */
export function mergeHooksSettings(
  existing: Record<string, unknown>,
  incoming: HooksBlock,
): { settings: Record<string, unknown>; added: number } {
  const settings: Record<string, unknown> = { ...existing };
  const hooks: HooksBlock = { ...((settings.hooks as HooksBlock) ?? {}) };
  let added = 0;
  for (const [event, entries] of Object.entries(incoming)) {
    const cur = [...(hooks[event] ?? [])];
    for (const entry of entries) {
      const cmd = entry.hooks?.[0]?.command;
      if (cmd && hasCommand(cur, cmd)) {
        continue; // already registered — idempotent skip
      }
      cur.push(entry);
      added += 1;
    }
    hooks[event] = cur;
  }
  settings.hooks = hooks;
  return { settings, added };
}

/** Read the projected hooks fragment (`<hooksDir>/settings.json` → `.hooks`). */
function readProjectedHooks(hooksDir: string): HooksBlock {
  const f = resolvePath(hooksDir, 'settings.json');
  if (!existsSync(f)) {
    return {};
  }
  const parsed = JSON.parse(readFileSync(f, 'utf-8')) as {
    hooks?: HooksBlock;
  };
  return parsed.hooks ?? {};
}

/** The hook ids in the render tree (the `<hooksDir>/hooks/<id>/` dirs). */
export function hookTreeNames(hooksDir: string): string[] {
  const dir = resolvePath(hooksDir, 'hooks');
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir)
    .filter((d) => statSync(resolvePath(dir, d)).isDirectory())
    .sort();
}

/**
 * Local hooks placer: copy each named hook's worker scripts into
 * `<claudeDir>/hooks/<id>/` and merge the projected hooks block into
 * `<claudeDir>/settings.json` (created if absent, merged if present).
 */
export function placeHooksLocal(
  claudeDir: string,
  tree: RenderTree,
  names: string[],
  opts: PlaceOpts,
): PlaceResult {
  const log = opts.log ?? (() => {});
  const warn = opts.warn ?? (() => {});
  const report = emptyReport();
  const hooksDir = tree.hooksDir;
  if (!hooksDir) {
    warn('  WARN  no hooksDir in render tree; nothing to place');
    return { rc: 0, report };
  }
  const destRoot = resolvePath(claudeDir, 'hooks');
  for (const name of names) {
    const srcDir = resolvePath(hooksDir, 'hooks', name);
    if (!existsSync(srcDir)) {
      warn(`  WARN  no hook dir for ${name} at ${srcDir}`);
      report.warnings.push(`no hook dir for ${name}`);
      report.skipped.push(name);
      continue;
    }
    const destDir = resolvePath(destRoot, name);
    const files = readdirSync(srcDir)
      .filter((f) => statSync(resolvePath(srcDir, f)).isFile())
      .sort();
    if (!opts.dry) {
      mkdirSync(destDir, { recursive: true });
      for (const f of files) {
        copyFileSync(resolvePath(srcDir, f), resolvePath(destDir, f));
      }
    }
    report.copied += 1;
    // Testimony: the worker assets are prunable when the hook retires.
    report.written[name] = files.map((f) => `hooks/${name}/${f}`);
    log(`  hook ${name} -> ${destDir}/ (+${files.length} worker asset(s))`);
  }
  // Merge the hooks block into the host settings.json.
  const incoming = readProjectedHooks(hooksDir);
  // Testimony, registration half: the commands this render tree asks for. A
  // command a PRIOR deploy registered that no longer appears here is a dangling
  // registration — the orchestrator unregisters it (see `manifest.ts`).
  report.registered = [
    ...new Set(
      Object.values(incoming)
        .flat()
        .flatMap((e) => (e.hooks ?? []).map((h) => h.command))
        .filter((c): c is string => Boolean(c)),
    ),
  ];
  if (Object.keys(incoming).length > 0) {
    const settingsFile = resolvePath(claudeDir, 'settings.json');
    const existing: Record<string, unknown> = existsSync(settingsFile)
      ? (JSON.parse(readFileSync(settingsFile, 'utf-8')) as Record<
          string,
          unknown
        >)
      : {};
    const { settings, added } = mergeHooksSettings(existing, incoming);
    if (!opts.dry) {
      mkdirSync(claudeDir, { recursive: true });
      writeFileSync(settingsFile, `${JSON.stringify(settings, null, 2)}\n`);
    }
    log(
      `  settings.json: merged hooks for [${Object.keys(incoming).join(', ')}] ` +
        `(+${added} new entr${added === 1 ? 'y' : 'ies'}) -> ${settingsFile}`,
    );
  }
  log(`  hooks copied: ${report.copied}`);
  return { rc: 0, report };
}
