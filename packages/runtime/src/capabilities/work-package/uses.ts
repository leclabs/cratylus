// ─────────────────────────────────────────────────────────────────────────────
// What a cut's FROZEN CHECKS reach: the files they use and the examples they bind,
// read from the working copy of the repository.
//
// A FILE A FROZEN CHECK USES is one its relative imports reach, transitively,
// that is not an output of a work package of the cut (decision 0129). Imports are
// read from every JavaScript or TypeScript file a frozen check is (a file, or each
// file under a folder): a statement opening a line, `import … from`, `export …
// from` or a bare `import`, and anywhere a dynamic `import()` or `require()`, each
// with a specifier opening `./` or `../`; an import written inside a string, as a
// fixture writes a file, opens no line, so it is not read as one.
// A specifier names the file it resolves to: itself when it exists, else the
// TypeScript file a `.js` (`.jsx`, `.mjs`, `.cjs`) specifier stands for, else the
// file with a script extension or the folder's index; one that resolves to no
// file still names the path written, so a file deleted from the working copy is
// still one a check uses. A work package's output is never followed nor listed.
//
// A frozen check BINDS an example when a file under it names the example as
// `<context>/<number>`.
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';

/** Whether `path`, from the top, is `entry` or lies within the folder `entry`. */
export const covers = (entry: string, path: string): boolean =>
  entry === path || (entry.endsWith('/') && path.startsWith(entry));

const SCRIPT = /\.(?:[cm]?[jt]sx?)$/;
const IMPORTS = [
  /^\s*(?:import|export)\s[^'"`;]*?\bfrom\s*(['"])([^'"\n]+)\1/gm,
  /^\s*import\s*(['"])([^'"\n]+)\1/gm,
  /(?:^|[^\w$.])(?:import|require)\s*\(\s*(['"])([^'"\n]+)\1\s*\)/g,
];
const TS_FOR: Readonly<Record<string, string>> = {
  '.js': '.ts',
  '.jsx': '.tsx',
  '.mjs': '.mts',
  '.cjs': '.cts',
};

const isFile = (top: string, path: string): boolean =>
  statSync(join(top, path), { throwIfNoEntry: false })?.isFile() ?? false;

/** Every file under `entry` (a file, or a folder ending in `/`) as it stands in
 *  the working copy at `top`, as paths from the top. */
export function filesUnder(top: string, entry: string): string[] {
  if (!entry.endsWith('/')) return isFile(top, entry) ? [entry] : [];
  if (!existsSync(join(top, entry))) return [];
  return readdirSync(join(top, entry), { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) =>
      join(d.parentPath, d.name)
        .slice(join(top).length + 1)
        .replaceAll('\\', '/'),
    )
    .sort();
}

/** The paths, from the top, the relative import `specifier` of `from` names. */
function resolved(top: string, from: string, specifier: string): string[] {
  const path = normalize(join(dirname(from), specifier)).replaceAll('\\', '/');
  if (path.startsWith('../') || path === '..') return [];
  const ext = /\.[cm]?jsx?$/.exec(path)?.[0];
  const ts =
    ext === undefined ? undefined : path.slice(0, -ext.length) + TS_FOR[ext];
  const candidates = [
    path,
    ...(ts === undefined ? [] : [ts]),
    ...['.ts', '.tsx', '.js', '.mjs', '.cjs'].map((e) => path + e),
    ...['index.ts', 'index.js'].map((i) => `${path}/${i}`),
  ];
  const found = candidates.find((c) => isFile(top, c));
  if (found !== undefined) return [found];
  return ts === undefined ? [path] : [path, ts];
}

/** The relative import specifiers in `text`. */
function specifiers(text: string): string[] {
  return IMPORTS.flatMap((pattern) =>
    [...text.matchAll(pattern)].map((m) => m[2] as string),
  ).filter((s) => s.startsWith('./') || s.startsWith('../'));
}

/** The files the frozen `checks` use in the working copy at `top`: every one
 *  their relative imports reach, transitively, that is neither covered by a
 *  check nor by one of the work packages' `outputs`, in sorted order. */
export function usedBy(
  top: string,
  checks: readonly string[],
  outputs: readonly string[],
): string[] {
  const seen = new Set<string>();
  const used = new Set<string>();
  const queue = checks.flatMap((check) => filesUnder(top, check));
  for (let path = queue.shift(); path !== undefined; path = queue.shift()) {
    if (seen.has(path)) continue;
    seen.add(path);
    if (!SCRIPT.test(path) || !isFile(top, path)) continue;
    for (const specifier of specifiers(readFileSync(join(top, path), 'utf8')))
      for (const target of resolved(top, path, specifier)) {
        if (outputs.some((o) => covers(o, target))) continue;
        if (!checks.some((c) => covers(c, target))) used.add(target);
        queue.push(target);
      }
  }
  return [...used].sort();
}

/** Of `examples` (`<context>/<number>`), those no file under the frozen
 *  `checks` names, in the order given. */
export function unbound(
  top: string,
  checks: readonly string[],
  examples: readonly string[],
): string[] {
  const texts = checks
    .flatMap((check) => filesUnder(top, check))
    .map((path) => readFileSync(join(top, path), 'utf8'));
  return examples.filter((ref) => {
    const named = new RegExp(
      `(?<![\\w/.-])${ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!\\d)`,
    );
    return !texts.some((text) => named.test(text));
  });
}
