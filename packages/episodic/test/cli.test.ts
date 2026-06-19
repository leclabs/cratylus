import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { main } from '../src/cli.js';
import { parseLines } from '../src/store.js';

let home: string;

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'episodic-cli-'));
});
afterEach(() => {
  rmSync(home, { recursive: true, force: true });
});

describe('encode', () => {
  it('mints a ULID, appends one record, and prints the id', () => {
    const r = main(['encode', '--home', home, '--body', 'first event']);
    expect(r.code).toBe(0);
    const id = r.out.trim();
    expect(id).toHaveLength(26);
    const file = join(home, 'EPISODIC.jsonl');
    const records = parseLines(readFileSync(file, 'utf8'));
    expect(records).toHaveLength(1);
    expect(records[0]?.id).toBe(id);
    expect(records[0]?.body).toBe('first event');
    expect(records[0]?.scope).toBe('user');
  });

  it('accepts a JSON body via --body-json', () => {
    const r = main(['encode', '--home', home, '--body-json', '{"k":1}']);
    expect(r.code).toBe(0);
    const records = parseLines(
      readFileSync(join(home, 'EPISODIC.jsonl'), 'utf8'),
    );
    expect(records[0]?.body).toEqual({ k: 1 });
  });

  it('appends in order across calls (records stay ULID-sortable)', () => {
    main(['encode', '--home', home, '--body', 'a']);
    main(['encode', '--home', home, '--body', 'b']);
    const records = parseLines(
      readFileSync(join(home, 'EPISODIC.jsonl'), 'utf8'),
    );
    expect(records.map((r) => r.body)).toEqual(['a', 'b']);
    expect((records[0]?.id ?? '') < (records[1]?.id ?? '')).toBe(true);
  });

  it('errors without a body source', () => {
    const r = main(['encode', '--home', home]);
    expect(r.code).toBe(2);
    expect(r.err).toMatch(/--body/);
  });

  it('errors without --home', () => {
    const r = main(['encode', '--body', 'x']);
    expect(r.code).toBe(1);
    expect(r.err).toMatch(/--home/);
  });
});

describe('read', () => {
  it('prints the record count with --count', () => {
    main(['encode', '--home', home, '--body', 'a']);
    main(['encode', '--home', home, '--body', 'b']);
    const r = main(['read', '--home', home, '--count']);
    expect(r.code).toBe(0);
    expect(r.out.trim()).toBe('2');
  });

  it('returns 0 for an absent store', () => {
    const r = main(['read', '--home', home, '--count']);
    expect(r.out.trim()).toBe('0');
  });
});

describe('migrate', () => {
  it('converts a markdown EPISODIC.md to JSONL and reports the item count', () => {
    const src = join(home, 'EPISODIC.md');
    const dest = join(home, 'EPISODIC.jsonl');
    writeFileSync(src, '## Next steps\n\n- one item\n- two item\n', 'utf8');
    const r = main(['migrate', src, dest]);
    expect(r.code).toBe(0);
    expect(r.out).toMatch(/migrated: 2 items/);
    expect(parseLines(readFileSync(dest, 'utf8'))).toHaveLength(2);
  });

  it('dry-run writes nothing', () => {
    const src = join(home, 'EPISODIC.md');
    const dest = join(home, 'EPISODIC.jsonl');
    writeFileSync(src, '## S\n\n- x\n', 'utf8');
    const r = main(['migrate', src, dest, '--dry-run']);
    expect(r.out).toMatch(/dry-run: 1 items/);
    expect(() => readFileSync(dest, 'utf8')).toThrow();
  });

  it('needs both positionals', () => {
    const r = main(['migrate', join(home, 'only.md')]);
    expect(r.code).toBe(2);
  });
});

describe('dispatch', () => {
  it('help prints usage', () => {
    expect(main(['help']).out).toMatch(/episodic — portable EPISODIC/);
    expect(main([]).out).toMatch(/usage:/);
  });

  it('unknown command errors with usage', () => {
    const r = main(['frobnicate']);
    expect(r.code).toBe(2);
    expect(r.err).toMatch(/unknown command/);
  });
});
