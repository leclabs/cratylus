import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  assertNoLoss,
  factsToShards,
  migrateMemoryDir,
  parseShard,
  renderShard,
  shardsToItems,
} from '../src/migrate-memory.js';
import { extractItems } from '../src/migrate.js';
import { monotonicFactory } from '../src/ulid.js';

/** A deterministic, strictly-increasing ULID source for reproducible shard ids. */
function fixedMint(): () => string {
  return monotonicFactory(
    () => 0,
    () => 1_700_000_000_000,
  );
}

// A realistic MEMORY.md: preamble + HTML comment (scaffolding, dropped), then
// fact bullets with continuations and a fenced block (must stay opaque).
const SAMPLE = `# mav — memory

*Living autobiographical dimension — recalled by relevance.*

<!-- Seeded 2026-06-08. -->

## Facts I carry

- Fleet ghostty theme lives at \`~/.config/ghostty/themes/LexDark\`. (observed 2026-06-11)
- Toolkit composes on the markdown-it-py AST grain; discipline is byte-identity.
  Continuation line — same fact, indented. (observed 2026-06-11)
- A fact carrying a fenced block:
  \`\`\`
  ## not a heading
  - not a bullet
  \`\`\`
  trailing line of the same fact.
`;

describe('factsToShards', () => {
  it('emits one shard per fact bullet, verbatim body, no-loss gate passing', () => {
    const shards = factsToShards(SAMPLE, { ulid: fixedMint() });
    const items = extractItems(SAMPLE);
    expect(shards).toHaveLength(items.length);
    expect(shards).toHaveLength(3); // three top-level bullets
    // Body is verbatim — keeps the leading `- ` and all continuation lines.
    expect(shards[0]?.body).toBe(items[0]?.text);
    expect(shards[2]?.body).toContain('## not a heading'); // fence stayed opaque
    // Filenames are the minted ULID stems.
    for (const s of shards) expect(s.filename).toBe(`${s.id}.md`);
  });

  it('round-trips: shardsToItems == extractItems', () => {
    const shards = factsToShards(SAMPLE, { ulid: fixedMint() });
    expect(shardsToItems(shards)).toEqual(extractItems(SAMPLE));
  });

  it('assertNoLoss throws when a shard fabricates a line absent from source', () => {
    const shards = factsToShards(SAMPLE, { ulid: fixedMint() });
    const tampered = shards.map((s, i) =>
      i === 0
        ? {
            ...s,
            body: `${s.body}\n- a fact never in the source`,
            content: renderShard(
              s.id,
              s.section,
              `${s.body}\n- a fact never in the source`,
            ),
          }
        : s,
    );
    expect(() => assertNoLoss(SAMPLE, tampered)).toThrow(
      /fabricated or duplicated|diverged/,
    );
  });
});

describe('parseShard', () => {
  it('round-trips an arbitrary section through JSON-encoding', () => {
    const content = renderShard(
      '01ID',
      'Weird: heading "quoted"',
      '- body line',
    );
    const parsed = parseShard(content);
    expect(parsed.id).toBe('01ID');
    expect(parsed.section).toBe('Weird: heading "quoted"');
    expect(parsed.body).toBe('- body line');
  });
});

describe('migrateMemoryDir', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'mem-shard-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('writes one <ulid>.md shard per fact and never deletes the source', () => {
    const src = join(dir, 'MEMORY.md');
    const dest = join(dir, 'MEMORY');
    writeFileSync(src, SAMPLE, 'utf8');
    const result = migrateMemoryDir(src, dest, { ulid: fixedMint() });
    expect(result.factCount).toBe(3);
    expect(result.written).toBe(true);
    const files = readdirSync(dest).filter((f) => f.endsWith('.md'));
    expect(files).toHaveLength(3);
    expect(readFileSync(src, 'utf8')).toBe(SAMPLE); // source untouched
  });

  it('dryRun returns shards without writing', () => {
    const src = join(dir, 'MEMORY.md');
    const dest = join(dir, 'MEMORY');
    writeFileSync(src, SAMPLE, 'utf8');
    const result = migrateMemoryDir(src, dest, {
      ulid: fixedMint(),
      dryRun: true,
    });
    expect(result.factCount).toBe(3);
    expect(result.written).toBe(false);
    expect(() => readdirSync(dest)).toThrow(); // dest never created
  });

  it('refuses to overwrite an existing shard dir unless overwrite is set', () => {
    const src = join(dir, 'MEMORY.md');
    const dest = join(dir, 'MEMORY');
    writeFileSync(src, SAMPLE, 'utf8');
    migrateMemoryDir(src, dest, { ulid: fixedMint() });
    expect(() => migrateMemoryDir(src, dest, { ulid: fixedMint() })).toThrow(
      /already holds shards/,
    );
    expect(() =>
      migrateMemoryDir(src, dest, { ulid: fixedMint(), overwrite: true }),
    ).not.toThrow();
  });
});
