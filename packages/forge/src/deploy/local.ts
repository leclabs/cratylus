// Local filesystem placer — copy generated defs into a `.claude/` root on this
// host and seed each agent's sidecar layers if-absent. The def is overwritten
// freely (generated substance); the sidecars are protected
// (`substance-over-accident`). Skills are generated substance with no
// sidecars — overwrite freely.
//
// The PLACER never deletes. It only TESTIFIES — `report.written` records the
// harnessDir-relative path of every file it lays down, and the orchestrator
// (`deploy.ts` → `manifest.ts`) uses that record, and only that record, to
// converge the target. The memory sidecars are deliberately absent from the
// testimony: they live outside the deploy root and are the self-authored
// individual, so no deploy may ever sweep them.
//
// Faithful port of `place/local.py`.

import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import {
  assertShimsResolvable,
  stageAssets,
  walkSkillFiles,
} from './bundle.js';
import { SEED_FILES } from './seeds.js';
import {
  type PlaceOpts,
  type PlaceResult,
  type RenderTree,
  emptyReport,
} from './types.js';

/** Write <harnessDir>/agents/<name><agentExt> for each name (the harness-specific
 *  declaration); seed the harness-NEUTRAL memory home
 *  <home>/.agents/<name>/{SEMANTIC,PROCEDURAL,EPISODIC} (a sibling of .claude,
 *  mirroring memory `homeForName`) only if absent. */
export function placeAgentsLocal(
  harnessDir: string,
  defsDir: string,
  names: string[],
  opts: PlaceOpts,
): PlaceResult {
  const log = opts.log ?? (() => {});
  const warn = opts.warn ?? (() => {});
  const agentExt = opts.agentExt ?? '.md';
  const report = emptyReport();
  const agents = resolvePath(harnessDir, 'agents');
  if (!opts.dry) {
    mkdirSync(agents, { recursive: true });
  }
  for (const name of names) {
    const src = resolvePath(defsDir, `${name}${agentExt}`);
    if (!existsSync(src)) {
      warn(`  WARN  no def for ${name} at ${src}`);
      report.warnings.push(`no def for ${name}`);
      report.skipped.push(name);
      continue;
    }
    if (!opts.dry) {
      writeFileSync(
        resolvePath(agents, `${name}${agentExt}`),
        readFileSync(src, 'utf-8'),
        'utf-8',
      );
    }
    report.copied += 1;
    // Testimony: the def is the ONLY thing this placer may later prune. The
    // sidecars below are never recorded — never ours to remove.
    // The extension must match what was WRITTEN, not what claude happens to use:
    // the manifest is the prune record, and a record naming a path that does not
    // exist can never converge — the real file becomes permanently unattributable.
    report.written[name] = [`agents/${name}${agentExt}`];
    // Memory sidecars live in the harness-NEUTRAL home ~/.agents/<name> (mirrors
    // memory `homeForName`), a sibling of `.claude` — NOT under
    // `.claude/agents` (Claude-specific; only <name>.md declaration lives there).
    const selfdir = resolvePath(harnessDir, '..', '.agents', name);
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

/** Copy <skillsSrc>/<name>/ -> <harnessDir>/skills/<name>/ — SKILL.md plus any
 *  staged companion assets beside it (byte-for-byte, binary-safe). Skills are
 *  generated substance with no sidecars — overwrite freely. Before copying, the
 *  deploy layer STAGES declared committed `assets:` companions into the source
 *  skill dir (a missing asset warns, never blocks). */
export function placeSkillsLocal(
  harnessDir: string,
  tree: RenderTree,
  names: string[],
  opts: PlaceOpts,
): PlaceResult {
  const log = opts.log ?? (() => {});
  const warn = opts.warn ?? (() => {});
  const report = emptyReport();
  const destRoot = resolvePath(harnessDir, 'skills');
  // A shim placed against a bin that does not execute is a broken artifact, and a
  // deploy that ships one must not report success. Collected across skills so the
  // refusal is reported once with every affected shim named, then carried out as
  // rc 2 — see `assertShimsResolvable` for why this is a verdict and not a throw.
  let refusal: string | null = null;
  for (const name of names) {
    const srcDir = resolvePath(tree.skillsDir, name);
    if (!existsSync(resolvePath(srcDir, 'SKILL.md'))) {
      warn(
        `  WARN  no SKILL.md for ${name} at ${resolvePath(srcDir, 'SKILL.md')}`,
      );
      report.warnings.push(`no SKILL.md for ${name}`);
      report.skipped.push(name);
      continue;
    }
    // Stage committed `assets:` companions into the SOURCE skill dir first, so
    // they copy beside SKILL.md. A missing asset is a WARN, never a hard error.
    const comp = tree.companions?.[name];
    if (comp?.assets) {
      stageAssets(name, srcDir, comp.assets, {
        assetBaseDir: srcDir,
        log,
        warn,
      });
    }
    const destDir = resolvePath(destRoot, name);
    // Recurse the WHOLE skill dir: co-located `scripts/`, `references/`,
    // `assets/` subtrees ride along, structure preserved.
    const files = walkSkillFiles(srcDir);
    if (!opts.dry) {
      mkdirSync(destDir, { recursive: true });
      for (const rel of files) {
        const srcFile = resolvePath(srcDir, rel);
        const destFile = resolvePath(destDir, rel);
        mkdirSync(dirname(destFile), { recursive: true });
        copyFileSync(srcFile, destFile);
        // Preserve mode so exec bits on `scripts/*` survive the copy
        // (copyFileSync does not carry the source mode).
        chmodSync(destFile, statSync(srcFile).mode);
      }
    }
    report.copied += 1;
    // Testimony: exactly the files copied for this skill, dest-relative. A file
    // sitting in the target skill dir that we did NOT copy is not recorded and
    // therefore survives every future prune.
    report.written[name] = files.map((rel) => `skills/${name}/${rel}`);
    const extra = files.filter((f) => f !== 'SKILL.md');
    const tail = extra.length
      ? ` (+${extra.length} asset${extra.length === 1 ? '' : 's'})`
      : '';
    log(`  skill ${name} -> ${destDir}/SKILL.md${tail}`);
    // AFTER placing: the shims are on the host now, so the binding they spawn is
    // this deploy's problem. `--version`, never `which`.
    if (refusal === null) {
      refusal = assertShimsResolvable(srcDir, files, { dry: opts.dry });
    }
  }
  log(`  skills copied: ${report.copied}`);
  if (refusal !== null) {
    warn(refusal);
    report.warnings.push(
      'runtime bin unresolvable on this host — deployed shims are inert',
    );
    return { rc: 2, report };
  }
  return { rc: 0, report };
}
