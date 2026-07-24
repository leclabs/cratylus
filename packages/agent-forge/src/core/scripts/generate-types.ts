import { readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileFromFile } from 'json-schema-to-typescript';

const here = dirname(fileURLToPath(import.meta.url));
const schemaDir = resolve(here, '..', 'schema');
const hookDir = resolve(here, '..', 'hook');
const outFile = resolve(here, '..', 'ir', 'generated.ts');

// `hook.schema.json` was rehomed to `core/hook/`, which owns the harness-agnostic
// event vocabulary together with its own generator. Its `$ref` in `ir.schema.json`
// stays `"hook.schema.json"` because ajv resolves `$ref` in URI space against
// `$id` (`.../v1/hook.schema.json`), where the schema's identity is unchanged —
// only its path on disk moved. json-schema-ref-parser resolves the same string on
// the FILESYSTEM, so the two disagree; this reader reconciles them by redirecting
// that one filename to its real location. Path knowledge lives here, not in the
// schema, so the published `$id` is not perturbed by a file move.
const RELOCATED: Record<string, string> = { 'hook.schema.json': hookDir };

const banner = `/**
 * AUTO-GENERATED. Do not edit by hand.
 * Source: packages/agent-forge/src/core/schema/*.schema.json
 * Regenerate: pnpm --filter @leclabs/agent-forge gen
 */
/* eslint-disable */
`;

const ts = await compileFromFile(resolve(schemaDir, 'ir.schema.json'), {
  cwd: schemaDir,
  $refOptions: {
    resolve: {
      file: {
        order: 1,
        canRead: true,
        async read(file: { url: string }) {
          const name = basename(file.url);
          const dir = RELOCATED[name];
          return await readFile(dir ? resolve(dir, name) : file.url, 'utf8');
        },
      },
    },
  },
  bannerComment: banner,
  declareExternallyReferenced: true,
  additionalProperties: false,
  format: true,
  style: { singleQuote: true, semi: true },
});

await writeFile(outFile, ts, 'utf8');
console.log(`Wrote ${outFile} (${ts.length} bytes)`);
