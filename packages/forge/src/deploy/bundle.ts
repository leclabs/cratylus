// Asset staging — the skill-dir committed-companion capability
// (toolkit/AGENTS.md §Dual-deploy). A `skill-dir` skill renders SKILL.md AND may
// carry committed companion files beside it:
//
// - `assets:` — committed cell-dir companions (a WARN, not a hard error, when
//   absent: a committed asset missing is a corpus mistake to surface, not a
//   deploy-blocking build gap).
//
// (The former `bundle:` build-artifact staging — the memory build artifact — is
// retired: memory is now the standalone `memory` PATH tool, installed via its
// package `bin`, not staged into a skill dir. `assets:` is the surviving,
// live mechanism.)
//
// Faithful port of `resolve._stage_assets`.

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { basename, resolve as resolvePath } from 'node:path';

/** Recursively collect every file under `dir`, as paths RELATIVE to `dir`
 *  (POSIX `/` separators), sorted deterministically. Used by the skill placers
 *  to recurse a skill dir's co-located `scripts/`, `references/`, `assets/`
 *  companions instead of copying only its top-level files — the caller mkdirs
 *  each dest parent to preserve the subtree structure. */
export function walkSkillFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (rel: string): void => {
    const abs = rel ? resolvePath(dir, rel) : dir;
    for (const entry of readdirSync(abs).sort()) {
      const childRel = rel ? `${rel}/${entry}` : entry;
      const st = statSync(resolvePath(dir, childRel));
      if (st.isDirectory()) {
        walk(childRel);
      } else if (st.isFile()) {
        out.push(childRel);
      }
    }
  };
  walk('');
  return out;
}

/** One skill's committed companion-file declarations. `assets` paths are
 *  committed companions (warn if missing), relative to the declaring source's
 *  dir unless absolute. */
export interface SkillCompanions {
  // Committed asset specs (relative to assetBaseDir, or absolute).
  assets?: string[];
}

export interface StageAssetsOpts {
  // Dir the `assets:` specs resolve against (Python: the cell's dir).
  assetBaseDir: string;
  log?: (line: string) => void;
  warn?: (line: string) => void;
}

/** Copy a skill's declared committed companion assets into its rendered skill
 *  dir beside SKILL.md, byte-for-byte (binary-safe). A missing asset is a WARN
 *  (a committed-companion mistake to surface), NOT a deploy-blocking hard error.
 *  Returns the staged basenames. */
export function stageAssets(
  skill: string,
  destDir: string,
  specs: string[] | undefined,
  opts: StageAssetsOpts,
): string[] {
  const log = opts.log ?? (() => {});
  const warn = opts.warn ?? (() => {});
  if (!specs || specs.length === 0) {
    return [];
  }
  mkdirSync(destDir, { recursive: true });
  const staged: string[] = [];
  for (const name of specs.map((s) => s.trim()).filter(Boolean)) {
    const src = resolvePath(opts.assetBaseDir, name);
    if (!existsSync(src)) {
      warn(`  WARN  asset ${skill}/${name} not found at ${src}`);
      continue;
    }
    const base = basename(src);
    copyFileSync(src, resolvePath(destDir, base));
    staged.push(base);
    log(`ASSET  ${skill}/${base} -> ${resolvePath(destDir, base)}`);
  }
  return staged;
}
