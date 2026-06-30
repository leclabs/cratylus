// Bundle + asset staging — the skill-dir companion-file capability
// (toolkit/AGENTS.md §Dual-deploy). A `skill-dir` skill (e.g. `memory`)
// renders SKILL.md AND carries companion files beside it:
//
// - `bundle:` — a BUILD-ARTIFACT companion (a build OUTPUT, e.g. the
//   dependency-free `episodic.mjs` toolsource), sourced relative to a base root
//   and gitignored at source. A declared-but-unbuilt artifact is a HARD ERROR
//   ([[no-permissive-defaults]]) — never silently ship a home without its tool.
// - `assets:` — committed cell-dir companions (a WARN, not a hard error, when
//   absent: a committed asset missing is a corpus mistake to surface, not a
//   deploy-blocking build gap).
//
// Faithful port of `resolve._stage_bundle` / `_stage_assets`. In the Python
// pipeline these run at PROJECTION time; T3.1 moves the staging guarantee into
// the deploy layer (the task's capability #4), so the deploy engine itself owns
// the bundle hard-error when it ships a skill dir.

import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { basename, resolve as resolvePath } from 'node:path';

/** One skill's companion-file declarations, resolved against `baseRoot`.
 *  `bundle` paths are build outputs (hard-error if missing); `assets` paths are
 *  committed companions (warn if missing). All paths are relative to the
 *  declaring source's root unless absolute. */
export interface SkillCompanions {
  // Build-artifact bundle specs (relative to baseRoot, or absolute).
  bundle?: string[];
  // Committed asset specs (relative to assetBaseDir, or absolute).
  assets?: string[];
}

export interface StageBundlesOpts {
  // Root the `bundle:` specs resolve against (Python: cells.ROOT = packages/mind).
  baseRoot: string;
  // Optional sink for the per-file log lines (defaults to no-op).
  log?: (line: string) => void;
}

/** A declared-but-unbuilt bundle artifact — the deploy-blocking hard error. */
export class BundleMissingError extends Error {
  constructor(
    public readonly skill: string,
    public readonly spec: string,
    public readonly resolvedPath: string,
  ) {
    super(
      `${skill}: bundle '${spec}' not built at ${resolvedPath} — build it first (e.g. \`pnpm --filter episodic build\`)`,
    );
    this.name = 'BundleMissingError';
  }
}

/** Copy a skill's declared BUILD-ARTIFACT bundles into its (already-rendered)
 *  skill dir beside SKILL.md, byte-for-byte (binary-safe), each staged under
 *  its basename. A declared-but-unbuilt artifact throws `BundleMissingError`
 *  ([[no-permissive-defaults]]) — never silently ship a home without its tool.
 *  Returns the staged basenames. */
export function stageBundle(
  skill: string,
  destDir: string,
  specs: string[] | undefined,
  opts: StageBundlesOpts,
): string[] {
  const log = opts.log ?? (() => {});
  if (!specs || specs.length === 0) {
    return [];
  }
  mkdirSync(destDir, { recursive: true });
  const staged: string[] = [];
  for (const spec of specs.map((s) => s.trim()).filter(Boolean)) {
    const src = resolvePath(opts.baseRoot, spec);
    if (!existsSync(src) || !statSync(src).isFile()) {
      throw new BundleMissingError(skill, spec, src);
    }
    const name = basename(src);
    copyFileSync(src, resolvePath(destDir, name));
    staged.push(name);
    log(`BUNDLE ${skill}/${name} -> ${resolvePath(destDir, name)}`);
  }
  return staged;
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
