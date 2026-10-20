// PRUNE-TO-MANIFEST — the half of a write that SUBTRACTS, bounded by a RECORD.
//
// Deletion inside a directory a caller named is a data-loss hazard — that root may
// also hold files this tool has no claim on whatsoever. So a removal is bounded by a
// RECORD, not by a rule: the candidates are the paths an earlier run recorded laying
// down, relative to the root it wrote them under, and NOTHING else. Attribution by
// naming convention ("looks like one of ours") is explicitly refused — a convention
// cannot distinguish an artifact the operator put there from one we shipped.
//
// What is generic — the containment guard and the removal — lives here and has ONE
// home; the deploy record's own shape stays in `deploy/manifest.ts`.

import { existsSync, readdirSync, rmdirSync, unlinkSync } from 'node:fs';
import {
  dirname,
  isAbsolute,
  relative,
  resolve as resolvePath,
  sep,
} from 'node:path';

/** Root-relative POSIX paths written for one group, keyed by the group's name: in
 *  an earlier installation's deploy record, a cell name within one kind. */
export type KindRecord = Record<string, string[]>;

/**
 * Which of `roots` strictly contains `abs`, or `null` when none does — the
 * containment guard, widened from one root to a NAMED SET.
 *
 * A tampered or hand-edited manifest must not be able to steer a delete out of
 * the roots it was given; that is why this exists and why the set is passed in by
 * the caller rather than derived from the record. One root was enough while every
 * destination sat under the harness home. It is not anymore: omp's destinations
 * are `../.agents/…`, a SIBLING of `.omp`, so every one of them resolved outside
 * the single root and was silently skipped — retired agents, retired skills and
 * stale launch specs accumulated forever, and the prune reported nothing removed
 * because nothing was a candidate.
 */
export function containingRoot(
  roots: readonly string[],
  abs: string,
): string | null {
  for (const root of roots) {
    const top = resolvePath(root);
    if (abs !== top && abs.startsWith(top + sep)) {
      return top;
    }
  }
  return null;
}

/** Is `rel` strictly inside `root` once resolved? */
export function contained(root: string, rel: string): boolean {
  return containingRoot([root], resolvePath(root, rel)) !== null;
}

/** Remove each stale path, then any directory the removal emptied (up to, but
 *  never including, the root that contained it). Returns what was actually
 *  removed; a dry run returns the same set having touched nothing.
 *
 *  `alsoRoots` are the other roots this removal is entitled to delete inside —
 *  for omp, the neutral `~/.agents` root its destinations live in. Records are
 *  still RELATIVE to `root`, which is what keeps the manifest readable as one
 *  tree's testimony. */
export function applyPrune(
  root: string,
  stale: string[],
  dry: boolean,
  alsoRoots: readonly string[] = [],
): string[] {
  const roots = [root, ...alsoRoots];
  const removed: string[] = [];
  for (const rel of stale) {
    const abs = resolvePath(root, rel);
    const owner = containingRoot(roots, abs);
    if (owner === null) {
      continue;
    }
    if (!existsSync(abs)) {
      // already gone (a hand-removed orphan) — still drop it from the record
      removed.push(rel);
      continue;
    }
    if (!dry) {
      unlinkSync(abs);
      pruneEmptyDirs(owner, dirname(abs));
    }
    removed.push(rel);
  }
  return removed;
}

/** Walk up from `dir`, removing each directory that the prune left empty, and
 *  stopping at `root` (which is never removed). */
function pruneEmptyDirs(root: string, dir: string): void {
  const top = resolvePath(root);
  let cur = resolvePath(dir);
  while (cur !== top && cur.startsWith(top + sep)) {
    if (!existsSync(cur) || readdirSync(cur).length > 0) {
      return;
    }
    rmdirSync(cur);
    cur = dirname(cur);
  }
}
