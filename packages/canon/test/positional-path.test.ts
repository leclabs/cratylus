// POSITIONAL-PATH gate — a path may not be built from a COUNT of parent hops.
//
// THE LAW. `join(here, '..', '..')` and `cd "$(dirname "$0")/../../.."` encode the asking
// file's OWN location in their bodies. Nothing about `'..', '..'` says which directory it
// was calibrated for, so moving the file silently changes what it points at — and the
// failure surfaces somewhere else entirely, as an absence.
//
// MEASURED, not imagined. One refactor moved code between directories and broke five of
// these. Every one presented as "found nothing" rather than "looked in the wrong place":
//
//   render-oracle.sh      5 hops → `no baseline at …/.render-oracle`   (reads: missing FILE)
//   project-targets.ts    2 hops → `cellTargets()` returned []
//   plan-set.ts           2 hops → the designator oracle collapsed 200+ ids → 0
//   two test suites       segment chains → `worker exited 127`
//
// TWO OF THE FIVE WERE SILENT, and that is the harm rather than the breakage. An empty
// list is not an error, so the gates consuming those results went green. A dark gate reads
// exactly like a healthy corpus, which is the failure this whole suite exists to refuse.
//
// WHY TWO HOPS AND NOT ONE. A single `'..'` is a sibling reference — `join(here, '..',
// 'tooling')` — and it stays true under any move that keeps the file among its siblings.
// Two is where the expression starts encoding a DEPTH the reader cannot see from the call.
// The threshold is the point at which the count becomes the bug, not a taste about brevity.
//
// WHAT IS NOT CONVICTED, and must not be: `dirname(fileURLToPath(import.meta.url))` and
// `$(dirname "$0")`. Naming a file's OWN directory is not a count and cannot go stale —
// it is the one positional expression that survives every move, and it is what
// `tooling/repo-root.ts` is built on.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { requireRepoRoot } from '../tooling/repo-root.js';

const repoRoot = requireRepoRoot(dirname(fileURLToPath(import.meta.url)));

/**
 * The pinned sites, and the ONLY reason this list exists: the law was written after the
 * corpus, and landing it red for correct work would make the gate the thing to route
 * around. It is SHRINK-ONLY and it has an END — `t-drain-the-ratchet` empties it, and when
 * the last pin comes off **this list and the leg below are deleted rather than left at
 * zero**. An exemption list with no members is a mechanism with no subject: it iterates
 * nothing and reads green for having looked at nothing, which is the exact shape this file
 * refuses everywhere else.
 */
const RATCHET: ReadonlySet<string> = new Set([
  'packages/canon/test/deploy-drift-notice.test.ts',
  'packages/canon/test/gate-convicts.test.ts',
  'packages/canon/test/ground-conformance.test.ts',
  'packages/canon/test/hook-rule-boundary.test.ts',
  'packages/canon/test/memory-nudge.test.ts',
  'packages/canon/test/runtime-shim.test.ts',
  'packages/canon/test/support/guardrail/calibrate-stance-judge.sh',
  'packages/canon/test/support/guardrail/test-deploy-drift-notice.sh',
  'packages/canon/test/support/guardrail/test-stance-guardrail.sh',
  'packages/canon/tooling/plan-set.ts',
  'packages/canon/tooling/project-targets.ts',
  'packages/canon/tooling/render-oracle/render-oracle.sh',
  'packages/canon/tooling/scaffold-cli.ts',
  'packages/forge/src/cli/commands/catalog.ts',
  'packages/forge/test/deploy/integrate-smoke.test.ts',
  'packages/forge/test/project/projection-facts.test.ts',
  'packages/forge/test/project/tree.test.ts',
  'packages/memory/test/cell-verb-roster.test.ts',
]);

/** This file and the helper both PRINT the offending shapes as specimens. The
 *  haystack-contains-the-needle hazard, resolved the way the veracity gates resolve it:
 *  by identity, and by stripping comments first so only executable text is judged. */
const SPECIMEN_CARRIERS: ReadonlySet<string> = new Set([
  'packages/canon/test/positional-path.test.ts',
  'packages/canon/tooling/repo-root.ts',
  'packages/canon/tooling/repo-root.sh',
]);

// ── pure predicates ──────────────────────────────────────────────────────────

/** Strip comments. Prose that DESCRIBES a positional path is not one — this file's own
 *  header names four, and every repaired site explains what it replaced. */
function stripComments(src: string, shell: boolean): string {
  return shell
    ? src
        .split('\n')
        .filter((l) => !l.trimStart().startsWith('#'))
        .join('\n')
    : src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Hop counts of every `join(...)`/`resolve(...)` in `src` that uses ≥2 `'..'`. */
function tsHops(src: string): number[] {
  const out: number[] = [];
  for (const m of stripComments(src, false).matchAll(
    /(?:join|resolve)\(([^;]{0,400}?)\)/gs,
  )) {
    const n = (m[1] as string).match(/['"]\.\.['"]/g)?.length ?? 0;
    if (n >= 2) out.push(n);
  }
  return out;
}

/** Shell lines carrying ≥2 consecutive `../`. */
function shellHops(src: string): string[] {
  return stripComments(src, true)
    .split('\n')
    .filter((l) => /(\.\.\/){2,}/.test(l))
    .map((l) => l.trim());
}

/** Every offending authored file, as `path → count`. Pure over a supplied corpus so the
 *  controls drive the SAME function the live check does. */
function offenders(
  files: ReadonlyMap<string, string>,
): { file: string; hits: number }[] {
  const out: { file: string; hits: number }[] = [];
  for (const [file, src] of files) {
    const hits = file.endsWith('.sh')
      ? shellHops(src).length
      : tsHops(src).length;
    if (hits > 0) out.push({ file, hits });
  }
  return out;
}

function authored(): Map<string, string> {
  const files = new Map<string, string>();
  const tracked = execFileSync('git', ['ls-files', 'packages'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
    .split('\n')
    .filter((f) => /\.(ts|mjs|sh)$/.test(f));
  for (const rel of tracked)
    files.set(rel, readFileSync(join(repoRoot, rel), 'utf8'));
  return files;
}

// ── the gate ─────────────────────────────────────────────────────────────────

describe('POSITIONAL-PATH gate — no path is built from a hop count', () => {
  it('reads a real corpus — the DENOMINATOR is sites examined, not hits found', () => {
    // The honest steady state of this law is zero violations, so a leg that counted
    // VIOLATIONS would read green for having looked at nothing. What is asserted is the
    // size of the search space.
    const files = authored();
    expect(files.size, 'the scan found no sources at all').toBeGreaterThan(150);
    expect(
      [...files.keys()].filter((f) => f.endsWith('.sh')).length,
    ).toBeGreaterThan(3);
    expect(files.has('packages/canon/tooling/repo-root.ts')).toBe(true);
  });

  it('no unpinned file builds a path from a hop count', () => {
    const failures = offenders(authored())
      .filter((o) => !RATCHET.has(o.file) && !SPECIMEN_CARRIERS.has(o.file))
      .map(
        (o) =>
          `POSITIONAL ${o.file} — ${o.hits} path(s) built from a hop count; use tooling/repo-root`,
      );
    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('the ratchet is SHRINK-ONLY — every pin still names a live offender', () => {
    // A pin that no longer convicts is a pin that has been repaired, and leaving it makes
    // the list a place where the law quietly stops applying.
    const live = new Set(offenders(authored()).map((o) => o.file));
    const stale = [...RATCHET].filter((f) => !live.has(f));
    expect(
      stale,
      `repaired — remove from RATCHET: ${stale.join(', ')}`,
    ).toEqual([]);
  });

  it('CONVICTS the four shapes that actually broke', () => {
    expect(tsHops(`const r = join(here, '..', '..');`)).toEqual([2]);
    expect(
      tsHops(`const r = join(canonRoot, '..', '..', 'agents.config.ts');`),
    ).toEqual([2]);
    expect(tsHops(`const w = join(here, '..', '..', '..', 'x.sh');`)).toEqual([
      3,
    ]);
    expect(
      shellHops(`root=$(cd "$(dirname "$0")/../../../.." && pwd)`),
    ).toHaveLength(1);
  });

  it('EXONERATES the correct forms — or the gate bans the repair', () => {
    // A single hop is a sibling reference and survives any move among siblings.
    expect(tsHops(`const t = join(here, '..', 'tooling');`)).toEqual([]);
    // Naming your OWN directory is not a count. This is what the helper is built on, and
    // convicting it would leave no legal way to locate anything.
    expect(
      tsHops('const here = dirname(fileURLToPath(import.meta.url));'),
    ).toEqual([]);
    expect(
      shellHops(`SELF_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"`),
    ).toEqual([]);
    // Prose describing the defect is not the defect.
    expect(
      tsHops(`// this was join(here, '..', '..') before the repair`),
    ).toEqual([]);
    expect(shellHops(`# was cd "$(dirname "$0")/../../../.."`)).toEqual([]);
  });

  it('is non-vacuous — the live predicate convicts a synthetic offender', () => {
    // The control travels the SAME function as the live check, over a corpus it supplies.
    const corpus = new Map([['packages/x/src/a.ts', `join(d, '..', '..')`]]);
    expect(offenders(corpus)).toEqual([
      { file: 'packages/x/src/a.ts', hits: 1 },
    ]);
    expect(
      offenders(new Map([['packages/x/src/b.ts', `join(d, '..')`]])),
    ).toEqual([]);
  });
});
