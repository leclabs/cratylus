// The ONE reader for a cell module's export — shared by every corpus gate.
//
// This was copy-pasted, byte-identical, into seven gate files. That went unnoticed
// while a dimension value was always a plain string, because every copy could
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
import { bodyOf, isDimensionValue } from '@leclabs/agent-forge/anatomy';
import type { Dimension, Value } from '../../src/anatomy.js';

/**
 * The first non-`default` export of a cell module.
 *
 * A dimension value is returned as its BODY — bare values unchanged, enforcing
 * values reduced to their declaration. Any other export (a skill cell, a hook
 * cell) is handed back untouched, because those are not dimension values and have
 * their own shapes.
 */
export async function firstExport<T>(modPath: string): Promise<T> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const key = Object.keys(mod).find((k) => k !== 'default');
  const exported = mod[key as string];
  return (
    isDimensionValue(exported) ? bodyOf(exported as Value<Dimension>) : exported
  ) as T;
}
