// The generator for this module's emitted types — it TRAVELS WITH THE TYPE.
// `CanonicalEvent`/`Hook` are compiled from the sibling `hook.schema.json`, so
// the schema, the generator, and the emitted `generated.ts` are one unit that
// moves together. Splitting them (emitting into a tree whose generator lives
// elsewhere) is how a generated artifact outlives its source.
//
// Run:  pnpm --filter @leclabs/agent-forge gen

import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileFromFile } from 'json-schema-to-typescript';

const here = dirname(fileURLToPath(import.meta.url));
const outFile = resolve(here, 'generated.ts');

const banner = `/**
 * AUTO-GENERATED. Do not edit by hand.
 * Source: packages/agent-forge/src/core/hook/hook.schema.json
 * Regenerate: pnpm --filter @leclabs/agent-forge gen
 */
/* eslint-disable */
`;

const ts = await compileFromFile(resolve(here, 'hook.schema.json'), {
  cwd: here,
  bannerComment: banner,
  declareExternallyReferenced: true,
  additionalProperties: false,
  format: true,
  style: { singleQuote: true, semi: true },
});

await writeFile(outFile, ts, 'utf8');
console.log(`Wrote ${outFile} (${ts.length} bytes)`);
