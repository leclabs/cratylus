// ─────────────────────────────────────────────────────────────────────────────
// MODULE SCANNING — the one home for "which cell modules live in this directory".
//
// A plugin package is scanned in TWO shapes: as SOURCE inside the workspace
// (`.ts`, loaded through tsx) and as an INSTALLED, BUILT package (`.js`). Every
// scan used to hardcode a `*.ts` glob, so an installed package matched NOTHING —
// and silently, because a zero-match glob is an empty list, not an error. A
// consumer would have gotten an empty catalog with no diagnostic at all.
//
// Scanning both extensions is therefore a correctness requirement of shipping the
// corpus as a build-time plugin, not a convenience. Declaration files are excluded
// (`.d.ts` is not a cell), and a name present in both shapes is yielded once.
// ─────────────────────────────────────────────────────────────────────────────

import { glob } from 'node:fs/promises';
import { join } from 'node:path';

/** Module extensions a cell may be authored or built as, in resolution order —
 *  source first so an in-workspace scan prefers the authored module. */
export const MODULE_EXTENSIONS = ['.ts', '.js', '.mjs'] as const;

/** Whether a scanned filename is a cell module (not a declaration file). */
function isModuleFile(p: string): boolean {
  if (p.endsWith('.d.ts')) return false;
  return MODULE_EXTENSIONS.some((e) => p.endsWith(e));
}

/** Strip a known module extension, leaving the cell name. */
export function stripModuleExtension(p: string): string {
  for (const e of MODULE_EXTENSIONS) {
    if (p.endsWith(e)) return p.slice(0, -e.length);
  }
  return p;
}

/**
 * The cell-module names directly under `dir`, extension-stripped, sorted, unique.
 * `exclude` names (already extension-free) are dropped — e.g. a `base` module that
 * is shared scaffolding rather than a cell.
 */
export async function scanModuleNames(
  dir: string,
  exclude: readonly string[] = [],
): Promise<string[]> {
  const names = new Set<string>();
  for await (const p of glob('*.{ts,js,mjs}', { cwd: dir })) {
    if (!isModuleFile(p)) continue;
    const name = stripModuleExtension(p);
    if (!exclude.includes(name)) names.add(name);
  }
  return [...names].sort();
}

/**
 * The names of self-contained cell DIRECTORIES under `dir` — a directory holding
 * `<base>.<ext>` (e.g. `wake/skill.ts` or, installed, `wake/skill.js`). The
 * directory name is the cell name.
 */
export async function scanCellDirNames(
  dir: string,
  base: string,
): Promise<string[]> {
  const names = new Set<string>();
  for await (const p of glob(`*/${base}.{ts,js,mjs}`, { cwd: dir })) {
    if (!isModuleFile(p)) continue;
    const slash = p.indexOf('/');
    if (slash > 0) names.add(p.slice(0, slash));
  }
  return [...names].sort();
}

/**
 * Resolve a cell module to its on-disk path, trying each extension in order.
 * Returns null when absent — the caller decides whether that is a hard failure,
 * so a missing module never degrades into a silent skip.
 */
export async function resolveModulePath(
  dir: string,
  name: string,
): Promise<string | null> {
  for (const e of MODULE_EXTENSIONS) {
    const candidate = join(dir, `${name}${e}`);
    try {
      const { access } = await import('node:fs/promises');
      await access(candidate);
      return candidate;
    } catch {
      // try the next extension
    }
  }
  return null;
}
