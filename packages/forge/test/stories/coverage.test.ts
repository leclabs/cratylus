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

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
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
  it('the scan reached the live story suites — an empty scan is DARK, not clean', () => {
    // Every check below is a filter over `scan`; a scanner that found no file
    // reports zero violations and zero unknown ids forever.
    expect(scan.files.length).toBeGreaterThan(0);
    expect(scan.refs.length).toBeGreaterThan(0);
  });

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

  // ── The meta-gates BITE — a scanner that stopped matching reports the same
  //    empty violations list as a clean suite ───────────────────────────────────
  it('is non-vacuous — a synthetic epic dir with a bare test, a silencer and an unknown id is CONVICTED', () => {
    const root = mkdtempSync(join(tmpdir(), 'story-scan-convicts-'));
    try {
      const epic = join(root, 'E99');
      mkdirSync(epic, { recursive: true });
      writeFileSync(
        join(epic, 'S1.bad.test.ts'),
        [
          // a legitimate story call, but bound to an id no registry knows
          "story('E99.S1', 'an unregistered story', () => {});",
          // a bare test call — the story binding bypassed entirely
          "it('a bare test that traces to no story', () => {});",
          // a silenced test — green by not running
          "it.skip('a silenced test', () => {});",
          "describe.only('a narrowed suite', () => {});",
          '',
        ].join('\n'),
        'utf8',
      );
      const bad = scanStoryTests(root);

      // The scanner SEES the file, and FLAGS each violation class by name.
      expect(bad.files).toEqual([join('E99', 'S1.bad.test.ts')]);
      const reported = bad.violations.join('\n');
      expect(reported).toMatch(/bare test call/);
      expect(reported).toMatch(/modified test call/);
      expect(reported).toMatch(/silences tests/);

      // …and the unknown-id leg convicts the story bound to no registry entry.
      const unknown = bad.refs.filter((r) => !STORY_IDS.includes(r.id));
      expect(unknown.map((r) => r.id)).toEqual(['E99.S1']);

      // EXONERATES: a dir that is not an `E<n>` epic is not scanned at all, and
      // a well-formed story file yields refs with no violations.
      writeFileSync(
        join(epic, 'S2.good.test.ts'),
        "story('E99.S2', 'a well-formed story', () => {});\n",
        'utf8',
      );
      mkdirSync(join(root, 'helpers'), { recursive: true });
      writeFileSync(
        join(root, 'helpers', 'x.test.ts'),
        "it('outside an epic dir', () => {});\n",
        'utf8',
      );
      const again = scanStoryTests(root);
      expect(again.files).not.toContain(join('helpers', 'x.test.ts'));
      expect(again.refs.map((r) => r.id).sort()).toEqual(['E99.S1', 'E99.S2']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
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
