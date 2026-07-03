/**
 * Meta-gates for the story coverage wave (the task's own falsifiers):
 *
 * - totality story→test: a testable story with zero tests FAILS here;
 * - totality test→story: every test in E* / must be a `story()` call bound to a
 *   registry id (bare it/test, unknown ids, excluded ids all FAIL);
 * - no silencers: .skip/.todo/.only in story suites FAIL;
 * - MAP.md is current (byte-equal to the deterministic render);
 * - TRACKED-FAILING.md enumerates EXACTLY the story.tracked call sites;
 * - prints the tracked-failing enumeration so `pnpm test` output is countable.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EXCLUDED, STORY_IDS, TESTABLE_IDS, epicOf } from './registry.js';
import { mdSafe, renderMap } from './render.js';
import { scanStoryTests } from './scan.js';

const storiesDir = dirname(fileURLToPath(import.meta.url));
const scan = scanStoryTests(storiesDir);

/**
 * Collapse intra-line whitespace and drop table separator rows so prettier's
 * re-padding (pre-commit) is immaterial while content drift still fails.
 */
function normalizeMd(text: string): string {
  return text
    .split('\n')
    .map((l) =>
      l
        .replace(/\s+/g, ' ')
        .replace(/ \| /g, '|')
        .replace(/ ?\|$/, '|')
        .replace(/^\| /, '|')
        .trim(),
    )
    .filter((l) => l.length > 0 && !/^[|\s:-]+$/.test(l))
    .join('\n');
}

describe('story coverage meta-gates', () => {
  it('no bare/silenced test calls in story suites', () => {
    expect(scan.violations).toEqual([]);
  });

  it('every test traces to a known, non-excluded story', () => {
    const unknown = scan.refs.filter((r) => !STORY_IDS.includes(r.id));
    expect(unknown).toEqual([]);
    const excluded = scan.refs.filter((r) => r.id in EXCLUDED);
    expect(excluded).toEqual([]);
  });

  it('every testable story has at least one test (totality)', () => {
    const covered = new Set(scan.refs.map((r) => r.id));
    const missing = TESTABLE_IDS.filter((id) => !covered.has(id));
    expect(missing).toEqual([]);
  });

  it('MAP.md is current (regenerate: pnpm exec tsx test/stories/tools/render-map.ts)', () => {
    const path = join(storiesDir, 'MAP.md');
    expect(existsSync(path)).toBe(true);
    // Whitespace-normalized compare: prettier (pre-commit) re-pads table
    // cells; content drift must still fail.
    expect(normalizeMd(readFileSync(path, 'utf8'))).toBe(
      normalizeMd(renderMap(scan.refs)),
    );
  });

  it('TRACKED-FAILING.md enumerates exactly the story.tracked set', () => {
    const path = join(storiesDir, 'TRACKED-FAILING.md');
    expect(existsSync(path)).toBe(true);
    const text = readFileSync(path, 'utf8');
    const enumerated = new Set<string>();
    for (const line of text.split('\n')) {
      // Names live in code spans (prettier-proof; see render.ts mdCell).
      const m = line.match(/^\|\s*(E\d+\.S\d+)\s*\|\s*`(.+?)`\s*\|/);
      if (m) enumerated.add(`${m[1]} · ${m[2]}`);
    }
    const actual = new Set(
      scan.refs
        .filter((r) => r.tracked)
        .map((r) => `${r.id} · ${mdSafe(r.name)}`),
    );
    expect([...enumerated].sort()).toEqual([...actual].sort());
  });

  it('prints the countable tracked-failing enumeration', () => {
    const tracked = scan.refs.filter((r) => r.tracked);
    const byEpic = new Map<string, number>();
    for (const r of tracked) {
      byEpic.set(epicOf(r.id), (byEpic.get(epicOf(r.id)) ?? 0) + 1);
    }
    const lines = [
      `TRACKED-FAILING: ${tracked.length} test(s) across ${
        new Set(tracked.map((r) => r.id)).size
      } story(ies)`,
      ...[...byEpic.entries()]
        .sort(([a], [b]) => Number(a.slice(1)) - Number(b.slice(1)))
        .map(([e, n]) => `  ${e}: ${n}`),
      ...tracked.map((r) => `  - ${r.id} · ${r.name}`),
    ];
    console.log(lines.join('\n'));
    expect(tracked.length).toBeGreaterThanOrEqual(0);
  });
});
