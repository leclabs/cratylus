import { readdirSync } from 'node:fs';
import { defineConfig } from 'tsup';

// ONE BUILD PASS. There were two: a library pass, and a CLI pass that emitted no
// types and prepended a `#!/usr/bin/env node` shebang so `forge` could be executed.
//
// It is not executed any more. `forge` is a library and its command surface is an
// ordinary export — `runCli(argv, opts)` — which the package that owns the `bin`
// imports and calls. A module that is imported needs types and must NOT carry a
// shebang, so the CLI entry simply joins the library entry set.
//
// There is no `core/index` entry any more. The core
// barrel was deleted with the IR-intake lineage it `export *`ed — it had no
// remaining source consumer, and a barrel over a lineage turns even a type-only
// import into a full-lineage edge (invisible to grep). Every entry below names
// a defining module or a real surface index, never a residue barrel.
const adapters = readdirSync('./src/adapters', { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const libEntry: Record<string, string> = {
  // `./module-scan` is a package subpath so a consumer can take module scanning
  // on its own. An `exports` map and this list are two enumerations of one fact
  // — add here and there together or the subpath resolves to nothing.
  'core/module-scan': 'src/core/module-scan.ts',
  'deploy/index': 'src/deploy/index.ts',
  'project/index': 'src/project/index.ts',
  'catalog/index': 'src/catalog/index.ts',
  'validate/index': 'src/validate/index.ts',
  'resolve/index': 'src/resolve/index.ts',
  'config/index': 'src/config/index.ts',
};
for (const a of adapters) {
  libEntry[`adapters/${a}/index`] = `src/adapters/${a}/index.ts`;
}

export default defineConfig([
  {
    entry: { ...libEntry, 'cli/index': 'src/cli/index.ts' },
    format: ['esm'],
    dts: true,
    clean: true,
    splitting: true,
    sourcemap: true,
  },
]);
