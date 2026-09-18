// Hooks placer — deploy a projected hooks render tree to a host `.claude/`:
//   1. ship each hook's worker scripts to `<harnessDir>/hooks/<id>/` (generated
//      substance, overwritten freely — same contract as a skill dir);
//   2. MERGE the projected `settings.json` `hooks` block into the host's
//      existing settings.json, idempotently and NON-DESTRUCTIVELY (never clobber
//      permissions / env / other hooks / unrelated keys).
//
// The merge replaces the old hand-rolled `jq` toggle: registration is now
// forge-managed. Off-by-default is preserved at RUNTIME — the worker re-checks a
// per-repo opt-in flag at fire time, so a registered-but-unopted hook is inert.
//
// The render tree for hooks is: `<root>/settings.json` (the hooks fragment) +
// `<root>/hooks/<id>/<asset>` (the worker scripts). `RenderTree.hooksDir` points
// at `<root>` (the dir holding both).

import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, posix, resolve as resolvePath } from 'node:path';
// The DEFINING module, never the `core/` surface at large: two tokens are
// wanted here — the staging dir the projection writes, and the deploy-time
// self-reference substitution — and both must be the same constant every
// stage reads.
import {
  ENFORCING_STAGE_DIR,
  NEUTRAL_AGENT_ROOT,
  SCOPE_DIR_TOKEN,
  SHARED_STAGE_DIR,
} from '../core/harness-adapter.js';
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

/** Read the projected hooks fragment (`<hooksDir>/<hooksFile>` → `.hooks`). */
function readProjectedHooks(hooksDir: string, hooksFile: string): HooksBlock {
  const f = resolvePath(hooksDir, hooksFile);
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
 * `<harnessDir>/hooks/<id>/` and merge the projected hooks block into
 * `<harnessDir>/settings.json` (created if absent, merged if present).
 */
export function placeHooksLocal(
  harnessDir: string,
  tree: RenderTree,
  names: string[],
  opts: PlaceOpts,
): PlaceResult {
  const log = opts.log ?? (() => {});
  const warn = opts.warn ?? (() => {});
  const hooksFile = opts.hooksFile ?? 'settings.json';
  const report = emptyReport();
  const hooksDir = tree.hooksDir;
  if (!hooksDir) {
    warn('  WARN  no hooksDir in render tree; nothing to place');
    return { rc: 0, report };
  }
  const destRoot = resolvePath(harnessDir, 'hooks');
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
  // ── SHARED ASSETS → the vendor-neutral root ──────────────────────────────────
  // A `HookWorker.shared` asset is byte-identical on every projection, so it has
  // one address instead of one per harness: `<home>/.agents/<id>/`, the sibling
  // of every harness home, beside the agents and skills already deployed there.
  //
  // WHY THE REL PATH ESCAPES `harnessDir`. Every other placement in this file is
  // inside the harness tree, and the manifest keys on rel paths from it, so a
  // `../` rel keeps the shared asset ATTRIBUTABLE: prune removes it when the hook
  // retires, exactly as it does the scoped mechanism modules that already use
  // this shape (`../.agents/<agent>/extensions/...`).
  const sharedRoot = resolvePath(hooksDir, SHARED_STAGE_DIR);
  if (existsSync(sharedRoot)) {
    for (const id of readdirSync(sharedRoot).sort()) {
      const srcDir = resolvePath(sharedRoot, id);
      if (!statSync(srcDir).isDirectory()) continue;
      const files = readdirSync(srcDir)
        .filter((f) => statSync(resolvePath(srcDir, f)).isFile())
        .sort();
      if (files.length === 0) continue;
      const written: string[] = [];
      for (const f of files) {
        const rel = posix.join('..', NEUTRAL_AGENT_ROOT, id, f);
        const dest = resolvePath(harnessDir, rel);
        if (!opts.dry) {
          mkdirSync(dirname(dest), { recursive: true });
          copyFileSync(resolvePath(srcDir, f), dest);
        }
        written.push(rel);
      }
      report.written[`${SHARED_STAGE_DIR}:${id}`] = written;
      log(`  shared ${id} -> ${written.join(', ')}`);
    }
  }
  // Merge the hooks block into the host settings.json.
  const incoming = readProjectedHooks(hooksDir, hooksFile);
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
    const settingsFile = resolvePath(harnessDir, hooksFile);
    const existing: Record<string, unknown> = existsSync(settingsFile)
      ? (JSON.parse(readFileSync(settingsFile, 'utf-8')) as Record<
          string,
          unknown
        >)
      : {};
    const { settings, added } = mergeHooksSettings(existing, incoming);
    if (!opts.dry) {
      mkdirSync(harnessDir, { recursive: true });
      writeFileSync(settingsFile, `${JSON.stringify(settings, null, 2)}\n`);
    }
    log(
      `  ${hooksFile}: merged hooks for [${Object.keys(incoming).join(', ')}] ` +
        `(+${added} new entr${added === 1 ? 'y' : 'ies'}) -> ${settingsFile}`,
    );
  }
  // THE OTHER KIND OF REGISTRATION. A harness whose hook surface is a PROGRAM has
  // no fragment to merge above: the render tree stages one artifact per scope
  // under `enforcing/<scope>/`, and the adapter says where each scope's copy
  // belongs. Nothing placed these before, so omp's mechanism modules were
  // rendered and then left in the tree — the deploy half of the same silence
  // that dropped the cells at projection.
  const scopedRel = opts.scopedRel;
  if (scopedRel) {
    const stageRoot = resolvePath(hooksDir, ENFORCING_STAGE_DIR);
    const scopes = existsSync(stageRoot)
      ? readdirSync(stageRoot)
          .filter((d) => statSync(resolvePath(stageRoot, d)).isDirectory())
          .sort()
      : [];
    for (const scope of scopes) {
      const scopeDir = resolvePath(stageRoot, scope);
      const written: string[] = [];
      for (const file of readdirSync(scopeDir).sort()) {
        const src = resolvePath(scopeDir, file);
        if (!statSync(src).isFile()) continue;
        // The staged dir name IS the scope, session token included — the adapter
        // reads both spellings, so nothing is translated here.
        const rel = scopedRel(file, scope);
        const dest = resolvePath(harnessDir, rel);
        if (!opts.dry) {
          mkdirSync(dirname(dest), { recursive: true });
          // TEXT, not a raw copy: a staged artifact may carry `SCOPE_DIR_TOKEN`
          // (omp's overlay does, to name its own extensions dir) — a fact only
          // knowable HERE, once `dest` is resolved against the real `--home`.
          // See the token's own doc for why projection cannot bake this in.
          const raw = readFileSync(src, 'utf-8');
          const content = raw.includes(SCOPE_DIR_TOKEN)
            ? raw.split(SCOPE_DIR_TOKEN).join(dirname(dest))
            : raw;
          writeFileSync(dest, content);
          // Preserve mode so a launcher's exec bit survives the copy — set at
          // STAGING (`write.ts`, `executable: true`), lost by a read/write
          // round-trip exactly like `copyFileSync` loses it, unless restored.
          chmodSync(dest, statSync(src).mode);
        }
        written.push(rel);
      }
      if (written.length === 0) continue;
      // Testimony under the SCOPE, not under a hook id: one module carries every
      // cell's registrations, so no single cell owns it and a per-cell record would
      // claim the same file many times. Recorded so it retires with the scope.
      report.written[`${ENFORCING_STAGE_DIR}:${scope}`] = written;
      log(`  mechanism ${scope} -> ${written.join(', ')}`);
    }
  }
  log(`  hooks copied: ${report.copied}`);
  return { rc: 0, report };
}
