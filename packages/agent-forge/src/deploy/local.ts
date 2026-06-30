// Local filesystem placer — copy generated defs into a `.claude/` root on this
// host and seed each agent's sidecar layers if-absent. The def is overwritten
// freely (generated substance); the sidecars are protected
// ([[substance-over-accident]]). Skills are generated substance with no
// sidecars — overwrite freely. NEVER PRUNES: agent/skill deletion is a manual
// per-host def rm + sidecar archive, never an automatic sweep.
//
// Faithful port of `place/local.py`.

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
import { stageAssets, stageBundle } from './bundle.js';
import { SEED_FILES } from './seeds.js';
import {
  type PlaceOpts,
  type PlaceResult,
  type RenderTree,
  emptyReport,
} from './types.js';

/** Write <claudeDir>/agents/<name>.md for each name; seed
 *  <claudeDir>/agents/<name>/{SELF,MEMORY,EPISODIC} only if absent. */
export function placeAgentsLocal(
  claudeDir: string,
  defsDir: string,
  names: string[],
  opts: PlaceOpts,
): PlaceResult {
  const log = opts.log ?? (() => {});
  const warn = opts.warn ?? (() => {});
  const report = emptyReport();
  const agents = resolvePath(claudeDir, 'agents');
  if (!opts.dry) {
    mkdirSync(agents, { recursive: true });
  }
  for (const name of names) {
    const src = resolvePath(defsDir, `${name}.md`);
    if (!existsSync(src)) {
      warn(`  WARN  no def for ${name} at ${src}`);
      report.warnings.push(`no def for ${name}`);
      continue;
    }
    if (!opts.dry) {
      writeFileSync(
        resolvePath(agents, `${name}.md`),
        readFileSync(src, 'utf-8'),
        'utf-8',
      );
    }
    report.copied += 1;
    const selfdir = resolvePath(agents, name);
    if (!opts.dry) {
      mkdirSync(selfdir, { recursive: true });
    }
    for (const [fname, seedfn] of SEED_FILES) {
      const f = resolvePath(selfdir, fname);
      if (existsSync(f)) {
        report.present.push(`${name}/${fname}`);
      } else if (!opts.dry) {
        writeFileSync(f, seedfn(name), 'utf-8');
        report.seeded.push(`${name}/${fname}`);
      } else {
        report.seeded.push(`${name}/${fname}`);
      }
    }
  }
  log(`  defs copied: ${report.copied}`);
  log(
    `  layers seeded (${report.seeded.length}): ${report.seeded.join(', ') || '-'}`,
  );
  log(
    `  layers present, untouched (${report.present.length}): ${report.present.join(', ') || '-'}`,
  );
  return { rc: 0, report };
}

/** Copy <skillsSrc>/<name>/ -> <claudeDir>/skills/<name>/ — SKILL.md plus any
 *  staged companion assets beside it (byte-for-byte, binary-safe). Skills are
 *  generated substance with no sidecars — overwrite freely. Before copying, the
 *  deploy layer STAGES declared `bundle:`/`assets:` companions into the source
 *  skill dir (bundle hard-errors if a build output is absent). */
export function placeSkillsLocal(
  claudeDir: string,
  tree: RenderTree,
  names: string[],
  opts: PlaceOpts,
): PlaceResult {
  const log = opts.log ?? (() => {});
  const warn = opts.warn ?? (() => {});
  const report = emptyReport();
  const destRoot = resolvePath(claudeDir, 'skills');
  for (const name of names) {
    const srcDir = resolvePath(tree.skillsDir, name);
    if (!existsSync(resolvePath(srcDir, 'SKILL.md'))) {
      warn(
        `  WARN  no SKILL.md for ${name} at ${resolvePath(srcDir, 'SKILL.md')}`,
      );
      report.warnings.push(`no SKILL.md for ${name}`);
      continue;
    }
    // Stage companions into the SOURCE skill dir first (the bundle hard-error
    // is raised here, before any host bytes move). This runs even on --dry-run:
    // a missing build artifact is a topology fault we surface regardless.
    const comp = tree.companions?.[name];
    if (comp?.assets) {
      stageAssets(name, srcDir, comp.assets, {
        assetBaseDir: srcDir,
        log,
        warn,
      });
    }
    if (comp?.bundle) {
      const baseRoot = tree.bundleBaseRoot;
      if (!baseRoot) {
        throw new Error(
          `${name} declares bundle but RenderTree.bundleBaseRoot is unset`,
        );
      }
      const staged = stageBundle(name, srcDir, comp.bundle, { baseRoot, log });
      for (const b of staged) {
        report.bundled.push(`${name}/${b}`);
      }
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
    const extra = files.filter((f) => f !== 'SKILL.md');
    const tail = extra.length
      ? ` (+${extra.length} asset${extra.length === 1 ? '' : 's'})`
      : '';
    log(`  skill ${name} -> ${destDir}/SKILL.md${tail}`);
  }
  log(`  skills copied: ${report.copied}`);
  return { rc: 0, report };
}
