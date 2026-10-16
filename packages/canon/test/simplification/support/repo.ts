// The repository as the simplification checks read it: its tracked files, which of
// them a scan for "the delivered project and this repository" covers, and their text.
//
// OUT OF EVERY SCAN: the design record (the journal and the examples),
// which is the architect's history; release history (`CHANGELOG.md`, `.changeset/`),
// which says what changed and so names what was removed; and these checks themselves,
// whose patterns name what they look for. IN: everything else, the recorded-run code,
// recordings and notes under `design/evidence/` included.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireRepoRoot } from '@cratylus/tooling/repo-root';

export const ROOT = requireRepoRoot(dirname(fileURLToPath(import.meta.url)));

/** This folder, from the top of the repository. */
export const CHECKS_DIR = 'packages/canon/test/simplification/';

let trackedCache: string[] | undefined;
/** Every file git tracks, from the top of the repository, that is on disk. */
export function tracked(): string[] {
  trackedCache ??= execFileSync('git', ['ls-files', '-z'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  })
    .split('\0')
    .filter((p) => p !== '' && textOf(p) !== undefined);
  return trackedCache;
}

/** Whether a scan of the delivered project and this repository covers `path`. */
export function inScope(path: string): boolean {
  if (path.startsWith(CHECKS_DIR)) return false;
  if (/^design\/(journal|examples)\//.test(path)) return false;
  if (/(^|\/)CHANGELOG\.md$/.test(path)) return false;
  if (path.startsWith('.changeset/')) return false;
  return true;
}

const texts = new Map<string, string | undefined>();
/** A tracked file's text, or `undefined` when it is binary or gone. */
export function textOf(path: string): string | undefined {
  if (!texts.has(path)) {
    let text: string | undefined;
    try {
      const bytes = readFileSync(join(ROOT, path));
      text = bytes.includes(0) ? undefined : bytes.toString('utf8');
    } catch {
      text = undefined;
    }
    texts.set(path, text);
  }
  return texts.get(path);
}

/** One place a pattern was found: the file, its line and what matched. */
export interface Hit {
  readonly path: string;
  readonly line: number;
  readonly match: string;
}

/** Every line of `text` that `pattern` matches, as hits in `path`. */
export function hitsIn(path: string, text: string, pattern: RegExp): Hit[] {
  const flags = pattern.flags.includes('g')
    ? pattern.flags
    : `${pattern.flags}g`;
  const global = new RegExp(pattern.source, flags);
  const hits: Hit[] = [];
  text.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(global))
      hits.push({ path, line: i + 1, match: m[0] });
  });
  return hits;
}

/** The hits, one line each, for a failure message. */
export const listed = (hits: readonly Hit[]): string =>
  hits.map((h) => `${h.path}:${h.line}: ${h.match}`).join('\n');
