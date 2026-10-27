import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'tsup';

// ONE bin, ONE program: the projector's commands and the capabilities are built into
// one Commander program, so its help lists them all.
// The capability plugins are STATIC imports of declared
// dependencies, so they are resolved by the package manager at install time —
// never by an ambient sibling lookup that only a flat co-install satisfies.
//
// THE BUILD'S COMMIT. Each build built in a git work tree records the commit it was
// built from, and whether the work tree had changes then, in `dist/build.json`. A
// command run from its source tree, never installed as a package, says it beside its
// version, so a development build is never mistaken for the release.
export default defineConfig({
  entry: {
    cratylus: 'src/cratylus.ts',
  },
  format: ['esm'],
  clean: true,
  sourcemap: true,
  banner: { js: '#!/usr/bin/env node' },
  async onSuccess() {
    writeFileSync(join('dist', 'build.json'), `${JSON.stringify(built())}\n`);
  },
});

/** The commit the work tree is at and whether it has changes; nothing outside
 *  a git work tree. */
function built(): { commit?: string; modified?: boolean } {
  const git = (...args: string[]) =>
    execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  try {
    return {
      commit: git('rev-parse', '--short', 'HEAD'),
      modified: git('status', '--porcelain') !== '',
    };
  } catch {
    return {};
  }
}
