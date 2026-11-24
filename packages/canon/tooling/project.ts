// The claude projection of a factor's value: render a typed value back to its
// canonical markdown body.
//
// Only the value's wrap is rendered (its byte-identity pin is the value string
// itself).

import { bodyOf } from '@cratylus/schema';
import type { Factor, Value } from '../src/manifest.js';

/**
 * Render a factor's value to its canonical body: `\n\n<body>\n`.
 *
 * Takes a VALUE, not a string. A value's content IS the body ⟨term, precising definition⟩
 * when it is bare, but a value may now carry its own enforcement, and then the body
 * is one face of an object. `bodyOf` reaches it either way; interpolating the value
 * directly would render `[object Object]` into the body.
 *
 * Only the DECLARATION is projected here. Substrate, events and the mechanism are
 * where the rule binds, not what it says — they are realized by the adapter into
 * the governed agent's own front-matter, never into the body.
 */
export function valueToMarkdown(value: Value<Factor>): string {
  return `\n\n${bodyOf(value)}\n`;
}
