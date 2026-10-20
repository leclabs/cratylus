import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deliverContext } from '@cratylus/runtime';
import { DELIVERED_DIR } from '@cratylus/runtime/runtime-config';
import { defineConfig } from 'tsup';

// ONE bin, ONE program: the projector's commands and the capabilities are built into
// one Commander program, so its help lists them all.
// The capability plugins are STATIC imports of declared
// dependencies, so they are resolved by the package manager at install time —
// never by an ambient sibling lookup that only a flat co-install satisfies.
//
// THE DELIVERED PRACTICE. Each build projects the repository's own contexts it
// delivers, as its concept journal records them now, upstream first: `cratylic
// context design`, then `workflow`. Each is written to
// `dist/delivered/cratylus/<context>.json`, named as recorded, with this package's
// version and its place in that order: the release carries the projections, and
// `install` places them read-only in the owned root. They are never authored
// apart from the journal.
//
// THE BUILD'S COMMIT. Each build built in a git work tree records the commit it was
// built from, and whether the work tree had changes then, in `dist/build.json`. A
// command run from its source tree, never installed as a package, says it beside its
// version, so a development build is never mistaken for the release.
/** The contexts this repository delivers, upstream first. */
const DELIVERED = ['cratylic context design', 'workflow'];

export default defineConfig({
  entry: {
    cratylus: 'src/cratylus.ts',
  },
  format: ['esm'],
  clean: true,
  sourcemap: true,
  banner: { js: '#!/usr/bin/env node' },
  async onSuccess() {
    const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
    for (const [position, context] of DELIVERED.entries()) {
      const delivered = deliverContext({
        from: process.cwd(),
        context,
        origin: 'cratylus',
        version,
        position,
      });
      const dir = join('dist', DELIVERED_DIR, delivered.origin);
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        join(dir, `${delivered.context}.json`),
        `${JSON.stringify(delivered, null, 2)}\n`,
      );
    }
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
