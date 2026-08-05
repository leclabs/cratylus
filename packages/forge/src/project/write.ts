// THE ONE WRITER — the only place a projected artifact tree touches the disk.
//
// Projection used to render and write in adjacent statements: `adapter.agentDef()`
// on one line, `writeFileSync()` on the next, no intermediate value surviving the
// loop body. That fused two concerns that have nothing to do with each other —
// WHAT bytes a plugin set projects to, and WHERE those bytes land — and it made
// the first unobservable without the second: you could not ask "what does this
// plugin set project?" without handing the projector a directory to scrub.
//
// So the projector now returns the tree and this writes it. The split is not
// cosmetic: it is what lets projection be tested, diffed, and inspected as a pure
// function of the plugin set, and it is why `writeFileSync` must stay OUT of
// `project/index.ts`.
//
// AND THE ONE WRITER OWNS CLEANING. Writing alone only ever UNIONS, so a deleted
// or renamed cell's artifact outlived it: `--out` accumulated and never converged,
// `deploy` then shipped the ghost, and a retired agent kept reaching the host. The
// failure was invisible on a fresh tree — exactly the case the render oracle runs
// in — and live on every incremental one, which is exactly the case a developer
// works in. The oracle was carrying the workaround as an `rm -rf` in its own
// `compute()`, making the command's convergence a CALLER's property stated only in
// prose: the very defect the oracle exists to catch, reappearing inside it.
//
// Convergence is union AND subtract at ONE seam, so the subtract is here and not
// in `runProject` — the same cut `deploy` makes by pruning in `deployLocal` rather
// than in `runDeploy`. A `--clean` flag was refused: default-off makes
// non-convergence the default and the stale artifact the silent case, and
// `MODEL.md:68` (`REGENERABLE`) says a Target is deploy-owned and ¬hand-edit — a
// file the projector will not remove and does not know about is neither.
//
// WHAT THIS MAY DELETE, exactly: a path THIS WRITER RECORDED HAVING WRITTEN under
// this same `out` on a previous run, and did not write again. Nothing else, ever.
// A file the projection never emitted is never a candidate, so a consumer who
// points `--out` at a directory holding their own work loses none of it — and on
// the first run, with no record present, nothing is attributable and nothing is
// removed at all. See `../prune` for why attribution is by record and not by
// naming convention.

import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { applyPrune, recordPath, staleFiles } from '../prune/index.js';
import type { ProjectedFile } from './index.js';

/** Where the writer's record lives, relative to the render root. Shares the
 *  `.forge/` bookkeeping dir with deploy's manifest — one directory a consumer
 *  can recognize as this tool's, whichever stage wrote it. */
export const RENDER_MANIFEST_REL = '.forge/render-manifest.json';
export const RENDER_MANIFEST_VERSION = 1;

/**
 * The single group every projected path is recorded under.
 *
 * `deploy` partitions its record by cell name so a `--only` run can bound its
 * prune to the named subset. A projection has no such partial intent to express:
 * it renders the whole plugin set or it throws, so the render tree is ONE
 * indivisible convergence unit and a partition here would be decorative.
 */
const RENDER_GROUP = 'render';

interface RenderManifest {
  version: number;
  files: string[];
}

/** What one write did to the render root. */
export interface WriteResult {
  /** Artifacts written this run. */
  readonly written: number;
  /** Root-relative paths a prior run wrote and this one did not — now gone. */
  readonly removed: readonly string[];
  /** No prior record existed, so nothing was attributable and nothing pruned. */
  readonly bootstrap: boolean;
}

/** Read this root's record. A missing, unreadable, or malformed manifest reads
 *  as ABSENT — an unattributable root prunes nothing, the safe direction. */
function readRenderManifest(out: string): RenderManifest | null {
  const f = join(out, RENDER_MANIFEST_REL);
  try {
    const parsed = JSON.parse(
      readFileSync(f, 'utf-8'),
    ) as Partial<RenderManifest>;
    if (parsed.version !== RENDER_MANIFEST_VERSION) {
      return null;
    }
    return { version: RENDER_MANIFEST_VERSION, files: parsed.files ?? [] };
  } catch {
    return null;
  }
}

function writeRenderManifest(out: string, files: string[]): void {
  const f = join(out, RENDER_MANIFEST_REL);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(
    f,
    `${JSON.stringify({ version: RENDER_MANIFEST_VERSION, files }, null, 2)}\n`,
    'utf-8',
  );
}

/**
 * CONVERGE `out` to the projected tree: write every artifact, then remove the
 * artifacts a prior run of this writer left under `out` and this run did not
 * re-emit. Parent directories are created as needed and the ones a removal
 * empties are taken back out. `executable` files land 0755 so the exec bit
 * survives deploy's mode-preserving copy; everything else takes the ambient
 * umask, exactly as the fused writer did.
 *
 * The record is written LAST, and only after the writes and the prune both
 * succeeded: a run that throws part-way leaves the PRIOR record standing, so the
 * next run still knows about every path it may need to sweep. A record advanced
 * before the work would forget the paths the failed run never rewrote.
 */
export function writeRenderTree(
  out: string,
  files: readonly ProjectedFile[],
): WriteResult {
  const prior = readRenderManifest(out);
  const written: string[] = [];
  for (const f of files) {
    const dest = join(out, f.path);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, f.content);
    if (f.executable) chmodSync(dest, 0o755);
    written.push(recordPath(f.path));
  }

  // BOOTSTRAP BOUND. With no prior record nothing under `out` is attributable to
  // this writer, so this run only ESTABLISHES the record. This is what makes a
  // consumer's `--out .` safe: the first projection into a populated directory
  // deletes nothing, because it can account for nothing.
  const removed = prior
    ? applyPrune(
        out,
        staleFiles(
          { [RENDER_GROUP]: prior.files },
          { [RENDER_GROUP]: written },
          [],
          false,
        ),
        false,
      )
    : [];

  writeRenderManifest(out, [...written].sort());
  return { written: written.length, removed, bootstrap: prior === null };
}
