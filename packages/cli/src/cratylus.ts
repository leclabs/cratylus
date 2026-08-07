// `cratylus` — the build-time command.
//
// THE ONLY PACKAGE THAT NEEDS AN EXECUTABLE SHAPE IS THIS ONE. Everything it
// proxies is an ordinary ESM module: `@cratylus/forge` owns the build-time command
// surface and EXPORTS it, this file imports and calls it. That is the whole design,
// and it is the same shape `cratylus-run` already had with `runMain`.
//
// What this package adds is composition. `forge` projects and depends on no corpus;
// `canon` is a corpus and knows no projector; a consumer wants one install. The
// default corpus is therefore a FUNCTION ARGUMENT — earlier versions of this file
// passed it through `process.env` and then by splicing `process.argv`, both because
// the module being called self-executed on import and had no parameters to take.

import { createRequire } from 'node:module';
import { runCli } from '@cratylus/forge/cli';

const CORPUS = '@cratylus/canon';

// A DEFAULT THAT DOES NOT RESOLVE IS WORSE THAN NONE, so the claim is checked
// against the manifest npm actually installs from rather than trusted as a literal.
const manifest = createRequire(import.meta.url)('../package.json') as {
  dependencies?: Record<string, string>;
};
if (manifest.dependencies?.[CORPUS] === undefined) {
  throw new Error(
    `cratylus: ${CORPUS} is the default corpus but is not a dependency of this package`,
  );
}

await runCli(process.argv, { defaultCorpus: CORPUS });
