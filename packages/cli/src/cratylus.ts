// ─────────────────────────────────────────────────────────────────────────────
// `cratylus` — the build-time command.
//
// THE BIN NAME IS NOT PLUMBED. `@cratylus/forge` declares its own `bin` and reads
// its own name off its own manifest, which is how a package has always known what
// it is called. An earlier version of this file passed the name down through
// `process.env` because I had convinced myself two manifests declaring one bin name
// was an install conflict. It is not — measured: a dependency may declare the same
// bin name, the top-level package's link wins, and npm creates exactly one. That
// invented constraint cost an env handoff and two vitest configs to work around it.
//
// WHAT THIS PACKAGE ACTUALLY ADDS is composition: `forge` projects and depends on no
// corpus, `canon` is a corpus and knows no projector, and a consumer wants one
// install. The default corpus is supplied as a COMMAND-LINE FLAG — the CLI's own
// channel, not a side one — so `forge` still names no corpus and a consumer's
// explicit `--plugin` simply wins by appearing first.
// ─────────────────────────────────────────────────────────────────────────────

import { createRequire } from 'node:module';

const CORPUS = '@cratylus/canon';

const manifest = createRequire(import.meta.url)('../package.json') as {
  dependencies?: Record<string, string>;
};
if (manifest.dependencies?.[CORPUS] === undefined) {
  throw new Error(
    `cratylus: ${CORPUS} is the default corpus but is not a dependency of this package — a default that does not resolve is worse than none.`,
  );
}

// `install` is the one verb that needs a corpus when the cwd has no config. Supply
// the default by APPENDING; cac takes the first occurrence, so an explicit
// `--plugin` from the operator still wins.
if (process.argv[2] === 'install' && !process.argv.includes('--plugin')) {
  process.argv.push('--plugin', CORPUS);
}

await import('@cratylus/forge/cli');
