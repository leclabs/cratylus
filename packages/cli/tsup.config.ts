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
// THE DELIVERED WORKFLOW. Each build projects the repository's own `workflow` context,
// as its concept journal records it now, into `dist/delivered/cratylus/workflow.json`,
// with this package's version: the release carries that projection, and `install`
// places it read-only in the owned root. It is never authored apart from the journal.
export default defineConfig({
  entry: {
    cratylus: 'src/cratylus.ts',
    index: 'src/index.ts',
  },
  format: ['esm'],
  dts: { entry: { index: 'src/index.ts' } },
  clean: true,
  sourcemap: true,
  banner: { js: '#!/usr/bin/env node' },
  async onSuccess() {
    const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
    const delivered = deliverContext({
      from: process.cwd(),
      context: 'workflow',
      origin: 'cratylus',
      version,
    });
    const dir = join('dist', DELIVERED_DIR, delivered.origin);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, `${delivered.context}.json`),
      `${JSON.stringify(delivered, null, 2)}\n`,
    );
  },
});
