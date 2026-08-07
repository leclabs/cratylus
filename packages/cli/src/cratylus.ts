// ─────────────────────────────────────────────────────────────────────────────
// `cratylus` — the build-time command, and the composition root that gives it a
// corpus.
//
// THIS PACKAGE IS THE ONLY ONE THAT MAY KNOW BOTH HALVES. `forge` projects and
// deploys but deliberately depends on no corpus — it receives one as DATA, which
// is what keeps meaning out of projection. `canon` is a corpus and knows no
// projector. Something has to hold both for a consumer to type one command, and
// this is that package: the role `ARCHITECTURE.md` already assigns the run-time
// entry, now carrying the build-time entry beside it.
//
// WHY THE DEFAULT CORPUS IS A DEPENDENCY HERE AND NOWHERE ELSE. Depending on a
// corpus is not assuming one. The dependency makes `@cratylus/canon` RESOLVABLE
// wherever the CLI is installed — including a global install, where a config
// outside every `node_modules` cannot resolve it at all (`ERR_MODULE_NOT_FOUND`,
// measured). The CONFIG still names it, so a consumer who replaces the corpus
// installs theirs and names that instead, and `forge` learns neither name.
//
// THE BIN NAME IS HANDED DOWN, not looked up. This manifest holds the only `bin`
// key npm reads for the build command, and the package NAME is that command — the
// bare mark, as `vite` and `eslint` are theirs. forge has no bin of its own to
// derive from, so it takes this one as a parameter rather than inventing a second
// spelling.
// ─────────────────────────────────────────────────────────────────────────────

import { createRequire } from 'node:module';

const manifest = createRequire(import.meta.url)('../package.json') as {
  name: string;
  dependencies?: Record<string, string>;
};
process.env.CRATYLUS_BUILD_BIN ??= manifest.name;

// THE DEFAULT CORPUS IS NAMED HERE AND NOWHERE ELSE. `cratylus install` needs a
// corpus to install and `forge` may not know one — so the hub, which declares
// `@cratylus/canon` as a dependency precisely so it RESOLVES wherever this CLI is
// installed, hands the specifier down. Read off the manifest rather than spelled,
// so the dependency and the default cannot drift apart.
const CORPUS = '@cratylus/canon';
if (manifest.dependencies?.[CORPUS] === undefined) {
  throw new Error(
    `cratylus: ${CORPUS} is the default corpus but is not a dependency of this package — a default that does not resolve is worse than none.`,
  );
}
process.env.CRATYLUS_DEFAULT_CORPUS ??= CORPUS;

await import('@cratylus/forge/cli');
