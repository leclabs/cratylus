/**
 * Static scanner over the story-test sources. Shared by coverage.test.ts (the
 * meta gates) and tools/render-map.ts (MAP.md generation) so both read the one
 * truth: the `story(...)` / `story.tracked(...)` call sites.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export interface StoryRef {
  id: string;
  name: string;
  tracked: boolean;
  /** Path relative to test/stories/. */
  file: string;
}

export interface ScanResult {
  refs: StoryRef[];
  /** Files scanned (relative to test/stories/). */
  files: string[];
  /** Rule violations: bare it/test, skip/todo/only markers. */
  violations: string[];
}

const CALL_RE =
  /story(\.tracked)?\(\s*['"]([^'"]+)['"]\s*,\s*(['"`])((?:\\.|(?!\3)[^\\])*)\3/gs;
/** A real bare test declaration: `it(`/`test(` with a string/template first arg. */
const BARE_TEST_RE = /(?<![\w.$])(?:it|test|xit|xtest|fit)[^\S\n]*\(\s*[`'"]/g;
/**
 * Any modifier off it/test (skip/todo/only/fails/each/…) — all banned in E*
 * dirs. Same-line only (biome keeps the chain joined); prose like a comment
 * ending in "… it." followed by `expect(` on the next line must not match.
 */
const MODIFIER_RE =
  /(?<![\w.$])(?:it|test|xit|xtest|fit)[^\S\n]*\.[^\S\n]*\w+[^\S\n]*[(`]/g;
const SKIP_MARK_RE = /\bdescribe\s*\.\s*(?:skip|todo|only)\s*\(/g;

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir).sort()) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

/** Scan every `*.test.ts` under the `E<n>` dirs of storiesDir. */
export function scanStoryTests(storiesDir: string): ScanResult {
  const refs: StoryRef[] = [];
  const files: string[] = [];
  const violations: string[] = [];

  for (const entry of readdirSync(storiesDir).sort()) {
    if (!/^E\d+$/.test(entry)) continue;
    const epicDir = join(storiesDir, entry);
    if (!statSync(epicDir).isDirectory()) continue;
    for (const path of walk(epicDir)) {
      if (!path.endsWith('.test.ts')) continue;
      const rel = relative(storiesDir, path);
      files.push(rel);
      const text = readFileSync(path, 'utf8');

      for (const m of text.matchAll(CALL_RE)) {
        refs.push({
          id: m[2] as string,
          name: (m[4] as string).trim(),
          tracked: m[1] === '.tracked',
          file: rel,
        });
      }
      for (const m of text.matchAll(BARE_TEST_RE)) {
        violations.push(`${rel}: bare test call '${m[0].trim()}'`);
      }
      for (const m of text.matchAll(MODIFIER_RE)) {
        violations.push(`${rel}: modified test call '${m[0].trim()}'`);
      }
      for (const m of text.matchAll(SKIP_MARK_RE)) {
        violations.push(`${rel}: '${m[0]}' silences tests`);
      }
    }
  }
  return { refs, files, violations };
}
