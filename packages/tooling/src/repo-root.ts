// ─────────────────────────────────────────────────────────────────────────────
// WHERE IS THE REPO ROOT — asked once, so nobody counts.
//
// THE DEFECT THIS REPLACES. A path built as a COUNT of parent hops —
// `join(here, '..', '..')` — encodes the asking file's OWN location in its body. The
// coupling is invisible at the definition site: nothing about `'..', '..'` says which
// directory it was calibrated for, so moving the file silently changes what it points
// at. Measured across one refactor, five sites broke this way, and every one presented
// as "found nothing" rather than "looked in the wrong place":
//
//   render-oracle.sh      five hops → `no baseline at …/.render-oracle`  (reads: missing FILE)
//   project-targets.ts    two hops  → `cellTargets()` returned []
//   plan-set.ts           two hops  → the designator oracle collapsed 200+ ids → 0
//
// TWO OF THOSE WERE SILENT, and that is the harm rather than the breakage. An empty list
// is not an error, so the gates consuming them went green. A dark gate reads exactly like
// a healthy corpus.
//
// THE ANSWER DOES NOT DEPEND ON THE ASKER. Every one of those sites wanted the same
// directory, so it is computed here and derived everywhere.
//
// TWO STRATEGIES, IN THIS ORDER, and the order is the design:
//   1. ASK GIT. `git rev-parse --show-toplevel` is authoritative and cannot be miscounted.
//   2. WALK UP FOR A MARKER. Required, not decorative: a published tarball and a
//      `mkdtemp` fixture both have no `.git`, and this corpus's suites build synthetic
//      repos in temp dirs constantly. The marker is `pnpm-workspace.yaml` — the one file
//      that means "workspace root" and appears exactly once.
//
// THERE IS NO THIRD STRATEGY, and in particular no positional fallback. If both fail the
// answer is `null` and the caller decides, because a wrong root that looks like a right
// one is what produced the silent failures above.
//
// `from` IS A PARAMETER WITH NO DEFAULT ON PURPOSE. A helper that defaults to its own
// location would reintroduce exactly the coupling it exists to remove — it would answer
// for the helper rather than for the asker, and a fixture running in a temp dir would
// get this checkout's root instead of its own.
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';

/** The file whose presence means "this is the workspace root". */
export const ROOT_MARKER = 'pnpm-workspace.yaml';

/** Ask git. `null` when `from` is not inside a work tree, or git is unavailable. */
export function gitRoot(from: string): string | null {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: from,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

/** Walk up from `from` for {@link ROOT_MARKER}. `null` if the filesystem root is reached
 *  without finding one. Terminates on the parse root rather than on a hop budget, so it
 *  cannot be wrong by being short. */
export function markerRoot(from: string): string | null {
  const stop = parse(from).root;
  let dir = from;
  for (;;) {
    if (existsSync(join(dir, ROOT_MARKER))) return dir;
    if (dir === stop) return null;
    const up = dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

/**
 * The repo root containing `from` — git first, marker second, `null` if neither answers.
 *
 * Pass a directory. Callers holding a module URL should pass
 * `dirname(fileURLToPath(import.meta.url))`, which is the one positional expression this
 * corpus still needs and the only one that cannot go stale: it names the file's own
 * directory rather than a count of steps away from it.
 */
export function repoRoot(from: string): string | null {
  return gitRoot(from) ?? markerRoot(from);
}

/** {@link repoRoot}, refusing rather than returning a wrong answer. The message names
 *  `from`, because "repo root not found" without it is unactionable. */
export function requireRepoRoot(from: string): string {
  const root = repoRoot(from);
  if (root === null)
    throw new Error(
      `no repo root above ${from}: not a git work tree, and no ${ROOT_MARKER} found walking up`,
    );
  return root;
}
