import { readdirSync } from 'node:fs';
import { defineConfig } from 'tsup';

// One package, two build passes. The library build emits .d.ts and code-splits
// shared modules into chunks; the CLI build is a separate pass (no dts, shebang
// banner) so `agent-forge` runs as an executable.
//
// depalimpsest-ir-intake S6: there is no `core/index` entry any more. The core
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
    entry: libEntry,
    format: ['esm'],
    dts: true,
    clean: true,
    splitting: true,
    sourcemap: true,
  },
  {
    entry: { 'cli/index': 'src/cli/index.ts' },
    format: ['esm'],
    dts: false,
    clean: false,
    sourcemap: true,
    banner: { js: '#!/usr/bin/env node' },
  },
]);
