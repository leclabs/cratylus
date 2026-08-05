// shard-scope — a shard's DECLARED outputs must cover what landing it actually changed.
//
// `spec.mjs` says what each shard writes. Until now that was an authored CLAIM, and the plan gate
// could only check that each glob RESOLVES — which catches a wrong entry and is blind to a missing
// one, because a shorter array is still an array of resolving globs. A scripted edit truncated
// five `outputs` arrays and every gate stayed green; `outputs` IS the contention set, so the wave
// disjointness proofs ran for a while on data that understated what shards write.
//
// This closes it from the other side. For every commit that moved shards into `completed/`, the
// files that commit touched must lie inside the UNION of those shards' declared outputs (plus
// bookkeeping). It convicts in both directions that matter:
//
//   - an UNDER-DECLARED array — the shard wrote a file its spec does not claim
//   - an OUT-OF-SCOPE edit — the executor strayed outside the shard's territory
//
// The manual version of this check caught a real border crossing during `t-manifest-file-basename`
// (a sweep rewrote specifiers belonging to another shard's files). It worked. It should not depend
// on someone remembering to run it.
//
// WHAT THIS GATE CANNOT SEE, AND WHY IT IS WRITTEN DOWN HERE. Across `decomplect` this
// convicted six under-declared arrays, and all six had ONE cause: the author read a shard's
// footprint off where a sign is DEFINED when the work was bounded by where it is USED. A
// rename touches its reference set. `t-kind-is-triple-booked` declared one glob and wrote
// fifteen files; `t-tool-class-vocabulary` declared one and wrote twelve; the last shard
// declared eight and wrote twenty, because giving a name its first home means every existing
// spelling interpolates it. Resolve references BEFORE declaring outputs for any rename.
//
// The sharpest instance is invisible to this check and cannot be gated from the data that
// exists. `namespaced-pairs-are-a-hand-rolled-map` was CUT OUT of another shard, and the
// split copied the parent's topical globs while dropping its consumer entries — so the
// child's array understated BY CONSTRUCTION, not by oversight. SPLITTING A SHARD DOES NOT
// SPLIT ITS BLAST RADIUS: a child's outputs are not the subset of the parent's that look
// topical, they are re-derived from the child's own call graph. `spec.mjs` records no
// derived-from edge, so no predicate here can know a shard was split. It is stated in the
// gate nearest the defect rather than left to be re-learned, which is the only seam
// available when the data a check would need was never captured.
//
// SCOPE, stated so the silence is not read as coverage: this checks COMPLETION commits only.
// A shard that never landed is unchecked here, and a commit that lands no shard is ignored.
//
// And it is RETROSPECTIVE. The scan reads `git log`, so the commit being authored right now
// is invisible to it — a violation is convicted on the NEXT run, never the one that would
// block it. That is not a fixable oversight at this seam: nothing that reads history can see
// a commit that does not exist yet. It is stated because the gate has already been read as a
// pre-commit guard and is not one — `a619f8c9` landed with three under-declared arrays while
// this file was green, and the red only appeared afterwards.

import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SHARDS } from '../../../plans/decomplect/spec.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const S = SHARDS as Record<string, { outputs: readonly string[] }>;

/** Paths any completion commit may touch: the plan's own bookkeeping and generated records. */
const BOOKKEEPING = [
  'plans/',
  'graphify-out/',
  'packages/canon/.render-oracle',
  '.gitignore',
  // A lockfile is DERIVED from the manifests a shard declares, never authored. Requiring
  // it to be declared would put a generated record in every outputs array that touches a
  // dependency, which teaches the arrays to list artifacts instead of territory.
  'pnpm-lock.yaml',
];

/**
 * INSTRUMENT MAINTENANCE, ratcheted. A completion commit should carry shard work and nothing
 * else; these files are the plan's own tooling, which got maintained inside shard commits while
 * the instrument was being built. SHRINK-ONLY — a new entry means a commit mixed concerns.
 */
const MIXED: ReadonlySet<string> = new Set([
  'packages/canon/test/praxis-execution-spec.test.ts',
  'packages/canon/test/gate-convicts.test.ts',
  'packages/canon/test/architecture.test.ts',
  '.cratylus.config',
  // Added by the commit this gate then convicted, which is the ratchet working. That commit
  // landed four shards and also edited THIS file — adding `pnpm-lock.yaml` to BOOKKEEPING and
  // the retrospective note above — because repairing the gate was what let the four shards be
  // judged at all. Instrument maintenance inside a shard commit, recorded rather than excused.
  'packages/canon/test/shard-scope.test.ts',
]);

function git(...args: string[]): string {
  return execFileSync('git', args, {
    cwd: REPO,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  }).trim();
}

/** Commits that ADDED a shard file under `completed/`, newest first, with the shards they landed. */
function completionCommits(): { sha: string; shards: string[] }[] {
  const byCommit = new Map<string, string[]>();
  for (const id of Object.keys(S)) {
    const sha = git(
      'log',
      '--diff-filter=A',
      '--format=%H',
      '-1',
      '--',
      `plans/decomplect/completed/${id}.md`,
    );
    if (!sha) continue;
    byCommit.set(sha, [...(byCommit.get(sha) ?? []), id]);
  }
  return [...byCommit].map(([sha, shards]) => ({ sha, shards }));
}

function expand(
  patterns: readonly string[],
  tracked: readonly string[],
): Set<string> {
  const out = new Set<string>();
  for (const p of patterns) {
    if (p.endsWith('/**')) {
      const pre = p.slice(0, -2);
      for (const f of tracked) if (f.startsWith(pre)) out.add(f);
    } else out.add(p);
  }
  return out;
}

describe('shard-scope', () => {
  const commits = completionCommits();

  it('there are completion commits to check — the gate can see', () => {
    // Without this the whole suite below is vacuously green on an empty set, which is the
    // dark-gate shape this corpus keeps paying for.
    expect(
      commits.length,
      'no commit has ever landed a shard — the scan is DARK',
    ).toBeGreaterThan(0);
  });

  it('every completion commit stays inside the outputs it declared', () => {
    const tracked = git('ls-files').split('\n').filter(Boolean);
    const strays: string[] = [];
    for (const { sha, shards } of commits) {
      const declared = expand(
        shards.flatMap((id) => S[id]?.outputs ?? []),
        tracked,
      );
      const touched = git('show', '--name-only', '--format=', sha)
        .split('\n')
        .filter(Boolean);
      for (const f of touched) {
        if (BOOKKEEPING.some((b) => f.startsWith(b))) continue;
        if (MIXED.has(f)) continue;
        // A glob that expands to nothing today (the path was renamed BY this very commit)
        // still counts as declared if any declared prefix covers it.
        const covered =
          declared.has(f) ||
          shards.some((id) =>
            (S[id]?.outputs ?? []).some((p) =>
              p.endsWith('/**') ? f.startsWith(p.slice(0, -2)) : p === f,
            ),
          );
        if (!covered)
          strays.push(`${sha.slice(0, 8)} [${shards.join(',')}] → ${f}`);
      }
    }
    expect(
      strays,
      'a completion commit touched a file no shard it landed declares — either the outputs are under-declared or the edit strayed',
    ).toEqual([]);
  });

  it('the mixed-concern ratchet is shrink-only — every entry still occurs', () => {
    const everTouched = new Set<string>();
    for (const { sha } of commits)
      for (const f of git('show', '--name-only', '--format=', sha)
        .split('\n')
        .filter(Boolean))
        everTouched.add(f);
    const stale = [...MIXED].filter((f) => !everTouched.has(f));
    expect(
      stale,
      'ratchet entries that no longer name a real mixing — remove them, do not leave the list padded',
    ).toEqual([]);
  });

  // ── the convicting fixture ───────────────────────────────────────────
  it('FAILS on an under-declared output and on an out-of-scope edit', () => {
    const tracked = ['a/x.ts', 'a/y.ts', 'b/z.ts'];
    const declared = expand(['a/**'], tracked);
    // out-of-scope: the commit touched a file outside the declared prefix
    expect([...declared].includes('b/z.ts')).toBe(false);
    // under-declared: shrink the array and a previously-covered file falls out
    const shrunk = expand(['a/x.ts'], tracked);
    expect([...shrunk].includes('a/y.ts')).toBe(false);
    // exonerating: the full declaration covers both
    expect([...declared].sort()).toEqual(['a/x.ts', 'a/y.ts']);
  });
});
