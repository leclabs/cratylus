// The ONE reader for a canon source module's export — shared by every canon gate.
//
// This was copy-pasted, byte-identical, into seven gate files. That went unnoticed
// while a factor's value was always a plain string, because every copy could
// pretend the export WAS its body. It stopped being harmless the moment a value
// could carry its own enforcement: each copy would independently have had to learn
// the new shape, and a gate that missed the update would not crash — it would read
// an object where prose belongs and either throw deep inside a string method or,
// worse, quietly measure the wrong thing.
//
// So the duplication is retired rather than patched seven times. `bodyOf` is
// applied HERE, which means every gate goes on measuring the DECLARATION face and
// none of them needs to know that enforcement exists.

import { pathToFileURL } from 'node:url';
import { bodyOf, isFactorValue } from '@cratylus/schema';
import type { Factor, Value } from '../../src/manifest.js';

/**
 * The first non-`default` export of a canon source module.
 *
 * A factor's value is returned as its BODY — bare values unchanged, enforcing
 * values reduced to their declaration. Any other export (a skill, a hook
 * declaration) is handed back untouched, because those are not factor values and
 * have their own shapes.
 */
export async function firstExport<T>(modPath: string): Promise<T> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const key = Object.keys(mod).find((k) => k !== 'default');
  const exported = mod[key as string];
  return (
    isFactorValue(exported) ? bodyOf(exported as Value<Factor>) : exported
  ) as T;
}
