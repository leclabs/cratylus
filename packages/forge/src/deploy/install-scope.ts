// INSTALLATION SCOPES — where `install` places an installation and `uninstall` finds
// it (design/decisions/a-project-installation.md).
//
//   user     the owned root `<home>/.cratylus/<harness>`, referred to from the
//            harness's own directory in the home (omp: `~/.omp/plugins`), every
//            project of the user offered it
//   project  the owned root `<project>/.cratylus/<harness>`, referred to from the
//            project's harness directory (omp: `<project>/.omp/plugins`), by relative
//            references a clone elsewhere still resolves; in that project it takes
//            precedence over the user's
//
// THE PROJECT is the one omp anchors its project plugins at from the working
// directory: the nearest ancestor holding `.omp/` other than the home, else the nearest
// holding `.git`, else the working directory. Project scope is refused where that is
// the home, which is the user scope's own place.

import { existsSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import type { InstallScope } from '@cratylus/runtime/runtime-config';
import type { HarnessAdapter } from '../core/harness-adapter.js';
import { ownedRootIn } from './owned-root.js';
import { harnessDirIn } from './scope.js';

/** The ancestors of `dir`, itself first, up to the filesystem's root. */
function ancestors(dir: string): string[] {
  const out: string[] = [];
  for (let at = resolve(dir); ; at = dirname(at)) {
    out.push(at);
    if (dirname(at) === at) return out;
  }
}

/**
 * The project of `cwd`, as omp anchors project plugins: the nearest ancestor holding
 * `.omp/` other than `home`, else the nearest holding `.git`, else `cwd` itself.
 */
export function projectOf(cwd: string, home: string): string {
  const up = ancestors(cwd);
  const top = resolve(home);
  return (
    up.find(
      (dir) =>
        dir !== top &&
        statSync(join(dir, '.omp'), {
          throwIfNoEntry: false,
        })?.isDirectory() === true,
    ) ??
    up.find((dir) => existsSync(join(dir, '.git'))) ??
    resolve(cwd)
  );
}

/** Where an installation of one harness at one scope lives. */
export interface Placement {
  readonly scope: InstallScope;
  /** The directory holding the harness's own surfaces the references are in, and
   *  (at project scope) its project settings: `~/.omp`, or `<project>/.omp`. */
  readonly harnessDir: string;
  /** The owned root. */
  readonly root: string;
  /** The directory the root's installation directory is in: the home, or the
   *  project. */
  readonly base: string;
}

/**
 * The placement of `adapter`'s installation at `scope`, resolved from `cwd` and
 * `home` (absent: the process's), or the reason project scope is refused here: the
 * project resolved from `cwd` is the home.
 */
export function placementOf(
  adapter: Pick<HarnessAdapter, 'name' | 'home' | 'homeEnv'>,
  scope: InstallScope,
  at: { readonly cwd: string; readonly home?: string | undefined },
): Placement | { readonly refused: string } {
  const home = resolve(at.home ?? homedir());
  if (scope === 'user') {
    return {
      scope,
      harnessDir: harnessDirIn(adapter, at.home),
      root: ownedRootIn(adapter, at.home),
      base: home,
    };
  }
  const project = projectOf(at.cwd, home);
  if (project === home) {
    return {
      refused: `--scope project: the project here is your home directory ${home}, where the user installation is; run it inside a project (a directory holding .omp/ or .git), or use --scope user`,
    };
  }
  return {
    scope,
    harnessDir: join(project, adapter.home),
    root: ownedRootIn(adapter, project),
    base: project,
  };
}
