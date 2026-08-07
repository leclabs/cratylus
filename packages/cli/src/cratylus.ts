// `cratylus` — the command. One bin, one entry, ordinary ESM throughout.
//
// THIS IS THE ONLY FILE IN THE REPOSITORY WITH AN EXECUTABLE SHAPE. Everything it
// composes is a library: `@cratylus/forge` exports `runCli` for the build-time
// surface, `@cratylus/runtime` exports `runCli` for capability dispatch, and
// `@cratylus/canon` default-exports the corpus. All three are declared dependencies
// and all three are imported statically — there is nothing to defer, nothing to
// resolve at run time, and no side channel to configure anything through.
//
// `cratylus` IS GONE. A second bin existed because the two surfaces lived in two
// packages and each built its own `cac`. They are one command now: capability verbs
// route to the runtime, everything else to the projector, and a consumer types one
// name for both. The "two DAGs" the split defended are a fact about IMPORTS, and
// imports are what the bundler and the package manager already handle.

import { createRequire } from 'node:module';
import { runCli as runProjector } from '@cratylus/forge/cli';
import { runtimePlugin as memory } from '@cratylus/memory';
import { CAPABILITIES } from '@cratylus/runtime/loader';
import { runCli as runCapability } from '@cratylus/runtime/main';

// The corpus is imported, not resolved. It is a declared dependency of this package
// precisely so it is present wherever the command is installed; a specifier string
// and a dynamic `import()` would only reintroduce a run-time failure mode that a
// static import makes impossible.
import canon from '@cratylus/canon';

/**
 * THIS package's version — the claim `--version` makes about THIS artifact.
 *
 * Read by package self-reference, the form `bin-name.ts` and forge's own `VERSION`
 * already use: tsup inlines this module into `dist/cratylus.js`, so a relative
 * `../package.json` would resolve from the wrong depth once bundled.
 *
 * It is passed DOWN rather than read up there, because `@cratylus/forge/cli`
 * defaults to forge's version and forge no longer owns the bin. While both
 * manifests carried the same number that was invisible; the first release to bump
 * them apart had `cratylus@0.2.1` reporting `0.3.0`.
 */
const VERSION: string = createRequire(import.meta.url)(
  'cratylus/package.json',
).version;

const argv = process.argv;
const verb = argv[2];

// Capability verbs belong to the runtime; every other verb to the projector. The
// keyspace is the runtime's own, so a capability added there is routed here without
// this file learning its name.
if (verb !== undefined && (CAPABILITIES as readonly string[]).includes(verb)) {
  await runCapability(argv.slice(2), { plugins: [memory] });
} else {
  await runProjector(argv, { defaultCorpus: canon, version: VERSION });
}
