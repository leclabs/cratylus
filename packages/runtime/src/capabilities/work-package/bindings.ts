// ─────────────────────────────────────────────────────────────────────────────
// Paths and the examples a cut's FROZEN CHECKS bind, read from the files given,
// the record for what is frozen (`recorded.ts`).
//
// A frozen check BINDS an example when a file under it names the example as
// `<context>/<number>`.
// ─────────────────────────────────────────────────────────────────────────────

import type { Files } from './recorded.js';

/** Whether `path`, from the top, is `entry` or lies within the folder `entry`. */
export const covers = (entry: string, path: string): boolean =>
  entry === path || (entry.endsWith('/') && path.startsWith(entry));

/** Of `examples` (`<context>/<number>`), those no file under the frozen
 *  `checks`, as `files` hold them, names, in the order given. */
export function unbound(
  files: Files,
  checks: readonly string[],
  examples: readonly string[],
): string[] {
  const texts = checks
    .flatMap((check) => files.under(check))
    .map((path) => files.read(path) ?? '');
  return examples.filter((ref) => {
    const named = new RegExp(
      `(?<![\\w/.-])${ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!\\d)`,
    );
    return !texts.some((text) => named.test(text));
  });
}
