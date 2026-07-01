import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  assertLinesFromSource,
  assertNoLoss,
  extractItems,
  migrateFile,
  migrateMarkdown,
  recordsToItems,
  recordsToJsonl,
} from '../src/migrate.js';
import { parseLines } from '../src/store.js';
import { monotonicFactory } from '../src/ulid.js';

/** A deterministic, strictly-increasing ULID source for reproducible records. */
function fixedMint(): () => string {
  return monotonicFactory(
    () => 0,
    () => 1_700_000_000_000,
  );
}

const SAMPLE = `# mav — episodic

*Scaffolding prose the seed template owns — not memory.*

<!-- Seeded 2026-06-08. Drained by the Dreamer. -->

## Next steps (carried)

- **agent-forge frontier.** Stand ready for the next machinery call.
- **OPEN follow-up** — episodic \`agent-forge-\` rename is Nico's call.
  - sub-detail: reconcile with memory-model-redesign.

## Stream

<!-- drained 2026-06-18 /handoff /dream (hot context). EPISODIC clean. -->
`;

describe('extractItems', () => {
  it('lifts each top-level bullet as one item, with section provenance', () => {
    const items = extractItems(SAMPLE);
    expect(items).toHaveLength(2);
    expect(items[0]?.section).toBe('Next steps (carried)');
    expect(items[0]?.text).toBe(
      '- **agent-forge frontier.** Stand ready for the next machinery call.',
    );
  });

  it('folds nested/continuation lines into their parent item', () => {
    const items = extractItems(SAMPLE);
    expect(items[1]?.text).toContain('OPEN follow-up');
    expect(items[1]?.text).toContain('sub-detail: reconcile');
  });

  it('drops the pre-## preamble and HTML comments as scaffolding', () => {
    const items = extractItems(SAMPLE);
    const all = items.map((i) => i.text).join('\n');
    expect(all).not.toContain('Scaffolding prose');
    expect(all).not.toContain('Seeded 2026-06-08');
    expect(all).not.toContain('drained 2026-06-18');
  });

  it('yields zero items for a fully drained stream (a comment-only section)', () => {
    const items = extractItems(SAMPLE);
    // Only the two Next-steps bullets survive; the Stream section is comment-only.
    expect(items.every((i) => i.section === 'Next steps (carried)')).toBe(true);
  });

  it('returns nothing for markdown with no ## sections', () => {
    expect(extractItems('# title\n\njust preamble, no sections\n')).toEqual([]);
  });

  it('treats a column-0 ## or - inside a code fence as code, not a boundary', () => {
    const md = [
      '## Stream',
      '',
      '- item with a fenced snippet:',
      '  ```sh',
      '## not-a-heading',
      '- not-a-bullet',
      '  ```',
      '- second real item',
    ].join('\n');
    const items = extractItems(md);
    // Two real items; the fenced ## / - did NOT fabricate a section or split.
    expect(items).toHaveLength(2);
    expect(items.every((i) => i.section === 'Stream')).toBe(true);
    expect(items[0]?.text).toContain('## not-a-heading');
    expect(items[0]?.text).toContain('- not-a-bullet');
    expect(items[1]?.text).toBe('- second real item');
  });
});

describe('migrateMarkdown', () => {
  it('produces one valid OPEN record per item, in file order', () => {
    const records = migrateMarkdown(SAMPLE, { ulid: fixedMint() });
    expect(records).toHaveLength(2);
    expect(records[0]?.scope).toBe('user');
    expect(records[0]?.path).toBe('EPISODIC.jsonl');
    expect(records[0]?.body).toMatchObject({
      imported: 'EPISODIC.md',
      section: 'Next steps (carried)',
    });
    // ULIDs are strictly increasing → records sort into original order.
    expect((records[0]?.id ?? '') < (records[1]?.id ?? '')).toBe(true);
  });

  it('round-trips: recordsToItems inverts extractItems exactly', () => {
    const records = migrateMarkdown(SAMPLE, { ulid: fixedMint() });
    expect(recordsToItems(records)).toEqual(extractItems(SAMPLE));
  });

  it('passes its own assertNoLoss gate', () => {
    const records = migrateMarkdown(SAMPLE, { ulid: fixedMint() });
    expect(() => assertNoLoss(SAMPLE, records)).not.toThrow();
  });

  it('emits parseable JSONL (every line is a valid record)', () => {
    const jsonl = recordsToJsonl(
      migrateMarkdown(SAMPLE, { ulid: fixedMint() }),
    );
    expect(() => parseLines(jsonl)).not.toThrow();
    expect(parseLines(jsonl)).toHaveLength(2);
  });
});

describe('assertNoLoss', () => {
  it('throws when a record was dropped', () => {
    const records = migrateMarkdown(SAMPLE, { ulid: fixedMint() });
    expect(() => assertNoLoss(SAMPLE, records.slice(0, 1))).toThrow(
      /lost items/,
    );
  });

  it('throws when an item body diverges from source', () => {
    const records = migrateMarkdown(SAMPLE, { ulid: fixedMint() });
    const tampered = records.map((r) => ({
      ...r,
      body: { ...(r.body as object), text: 'mutated' },
    }));
    expect(() => assertNoLoss(SAMPLE, tampered)).toThrow(/diverged at item/);
  });

  it('independent leg (assertLinesFromSource) flags a line absent from source', () => {
    // Simulates a future parser regression: an item carrying a fabricated line.
    // This leg does not call extractItems, so it catches what the round-trip leg
    // (which shares the parser) cannot.
    const fabricated = [
      { section: 'Stream', text: '- a line that never appeared in the source' },
    ];
    expect(() => assertLinesFromSource(SAMPLE, fabricated)).toThrow(
      /fabricated or duplicated/,
    );
  });

  it('independent leg passes for a faithful migration', () => {
    const items = extractItems(SAMPLE);
    expect(() => assertLinesFromSource(SAMPLE, items)).not.toThrow();
  });
});

describe('migrateFile', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'episodic-migrate-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('writes EPISODIC.jsonl and leaves the source untouched', () => {
    const src = join(dir, 'EPISODIC.md');
    const dest = join(dir, 'EPISODIC.jsonl');
    writeFileSync(src, SAMPLE, 'utf8');
    const result = migrateFile(src, dest, { ulid: fixedMint() });
    expect(result.written).toBe(true);
    expect(result.itemCount).toBe(2);
    expect(parseLines(readFileSync(dest, 'utf8'))).toHaveLength(2);
    // Source preserved — deletion is the caller's deliberate, backed-up act.
    expect(readFileSync(src, 'utf8')).toBe(SAMPLE);
  });

  it('dry run writes nothing but returns the records', () => {
    const src = join(dir, 'EPISODIC.md');
    const dest = join(dir, 'EPISODIC.jsonl');
    writeFileSync(src, SAMPLE, 'utf8');
    const result = migrateFile(src, dest, { dryRun: true, ulid: fixedMint() });
    expect(result.written).toBe(false);
    expect(result.itemCount).toBe(2);
    expect(() => readFileSync(dest, 'utf8')).toThrow();
  });

  it('refuses to clobber an existing destination unless overwrite', () => {
    const src = join(dir, 'EPISODIC.md');
    const dest = join(dir, 'EPISODIC.jsonl');
    writeFileSync(src, SAMPLE, 'utf8');
    writeFileSync(dest, 'existing\n', 'utf8');
    expect(() => migrateFile(src, dest, { ulid: fixedMint() })).toThrow(
      /Destination exists/,
    );
    expect(() =>
      migrateFile(src, dest, { overwrite: true, ulid: fixedMint() }),
    ).not.toThrow();
  });
});
