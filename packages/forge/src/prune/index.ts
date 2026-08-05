// PRUNE-TO-MANIFEST — the half of a write that SUBTRACTS, bounded by a RECORD.
//
// A placer or a projector only ever UNIONS: it writes what it has and touches
// nothing else, so a retired artifact outlives its source cell forever and the
// target accumulates instead of converging. Convergence needs deletion, and
// deletion inside a directory a caller named is a data-loss hazard — that root
// may also hold files this tool has no claim on whatsoever.
//
// So the prune is bounded by a RECORD, not by a rule. Every run writes a
// manifest of exactly the paths it laid down, relative to the root it wrote
// them under; the next run's prune candidates are that manifest's paths and
// NOTHING else. Attribution by naming convention ("looks like one of ours") is
// explicitly refused — a convention cannot distinguish an artifact the operator
// put there from one we shipped.
//
// The bound that makes an unexpected root SAFE is the bootstrap case: with no
// prior manifest nothing is attributable, so the first run only ESTABLISHES the
// record and removes nothing. A caller pointed at a directory full of files it
// never wrote deletes none of them, because it can account for none of them.
//
// WHY THIS MODULE EXISTS SEPARATELY. `deploy` discovered all of this for the
// harder root (`~/.claude`, shared with the operator, plugins, and the harness).
// `project` needs the identical mechanism one stage upstream, for its `--out`
// render tree. What is generic — the set difference, the carry-forward, the
// containment guard, and the removal — lives here and has ONE home. What is
// deploy's own — its kind/name partition of the corpus, `KIND_ROOT`, and the
// settings.json hook registrations — stays in `deploy/manifest.ts`, because a
// projector has no kinds and registers nothing.

import { existsSync, readdirSync, rmdirSync, unlinkSync } from 'node:fs';
import {
  dirname,
  isAbsolute,
  relative,
  resolve as resolvePath,
  sep,
} from 'node:path';

/** Root-relative POSIX paths written for one group, keyed by the group's name.
 *
 *  What a GROUP is belongs to the caller: for `deploy` it is a cell name within
 *  one kind, so a narrowed (`--only`) run can bound its prune to the named
 *  subset; for `project` the whole render tree is one indivisible group, since a
 *  projection has no partial intent to express. */
export type KindRecord = Record<string, string[]>;

/**
 * Normalize a written path to the record's POSIX form. Paths reach a record
 * from `join()`, whose separator is the HOST's; a record written with one
 * separator and read on another names paths that cannot be found, and a path
 * that cannot be found is a real file that has become permanently
 * unattributable — it will never be pruned again.
 */
export function recordPath(p: string): string {
  return sep === '/' ? p : p.split(sep).join('/');
}

/** The paths a prior run recorded that this run did NOT re-write — the orphans.
 *  `skipped` groups (their source was missing this run, so their absence is a
 *  warned skip and not a convergence statement) and, under `narrowed`, every
 *  group outside the written subset are excluded from candidacy. */
export function staleFiles(
  prior: KindRecord,
  written: KindRecord,
  skipped: string[],
  narrowed: boolean,
): string[] {
  const keep = new Set(Object.values(written).flat());
  const skip = new Set(skipped);
  const candidateNames = narrowed
    ? Object.keys(written)
    : Object.keys(prior).filter((n) => !skip.has(n));
  const stale = new Set<string>();
  for (const name of candidateNames) {
    for (const p of prior[name] ?? []) {
      if (!keep.has(p)) {
        stale.add(p);
      }
    }
  }
  return [...stale].sort();
}

/** The record to persist after the writer ran. Narrowed runs and warned skips
 *  carry their prior entries forward untouched — dropping them would forget
 *  paths that still exist, which is how a real file becomes unattributable. */
export function nextKindRecord(
  prior: KindRecord,
  written: KindRecord,
  skipped: string[],
  narrowed: boolean,
): KindRecord {
  if (narrowed) {
    return { ...prior, ...written };
  }
  const next: KindRecord = { ...written };
  for (const name of skipped) {
    if (prior[name] && !next[name]) {
      next[name] = prior[name];
    }
  }
  return next;
}

/** Is `rel` strictly inside `root` once resolved? A tampered or hand-edited
 *  manifest must not be able to steer a delete out of the root it names. */
export function contained(root: string, rel: string): boolean {
  const abs = resolvePath(root, rel);
  const r = relative(resolvePath(root), abs);
  return r !== '' && !r.startsWith('..') && !isAbsolute(r);
}

/** Remove each stale path, then any directory the removal emptied (up to, but
 *  never including, `root`). Returns what was actually removed; a dry run
 *  returns the same set having touched nothing. */
export function applyPrune(
  root: string,
  stale: string[],
  dry: boolean,
): string[] {
  const removed: string[] = [];
  for (const rel of stale) {
    if (!contained(root, rel)) {
      continue;
    }
    const abs = resolvePath(root, rel);
    if (!existsSync(abs)) {
      // already gone (a hand-removed orphan) — still drop it from the record
      removed.push(rel);
      continue;
    }
    if (!dry) {
      unlinkSync(abs);
      pruneEmptyDirs(root, dirname(abs));
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
