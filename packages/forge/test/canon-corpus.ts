// The REAL canon dimension corpus, for the few legs that run forge's machinery over
// it. Those legs need only A catalog naming the dirs canon carries; reading canon's
// own manifest would make this suite a function of canon's design, which forge
// refuses (see `fixture-manifest.ts`). So the catalog is derived from the dir
// listing alone, every dimension a `set` of text values in one group.

import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { DimensionManifest } from '@cratylus/schema';

/** canon's `dimensions/` dir — the fragments root its plugin self-locates to. */
export const CANON_DIMENSIONS = fileURLToPath(
  new URL('../../canon/src/dimensions', import.meta.url),
);

/** A catalog over exactly the dimension dirs canon carries. */
export function canonDirManifest(): DimensionManifest {
  return Object.fromEntries(
    readdirSync(CANON_DIMENSIONS, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => [
        d.name,
        {
          group: 'Canon',
          repertoire: 'curated',
          arity: 'set',
          level: null,
          projection: 'text',
        },
      ]),
  );
}
