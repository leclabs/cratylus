// Example 8: the one-time migration belongs to this repository, not the concepts capability.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type SeedSource,
  type TemporaryRepository,
  assertSeeded,
  extractSeedSource,
  git,
  repositoryRoot,
  seed,
  snapshot,
  successful,
  temporaryRepository,
} from './fixture.js';

let fixture: TemporaryRepository;
let source: SeedSource;
beforeEach(() => {
  fixture = temporaryRepository();
  source = extractSeedSource(fixture.sandbox);
});
afterEach(() => {
  fixture.dispose();
});

describe('concept journal one-time seeding', () => {
  it('8a — seeds the pinned design concept for concept, once each, with accepted decisions and decision-id reasons', () => {
    successful(
      seed(fixture.root, source),
      'seed-concept-journal.mjs --from pinned design',
    );
    assertSeeded(fixture.root, source);
  }, 120_000);

  it('8b — refuses a second seed and preserves every journal path and byte', () => {
    successful(
      seed(fixture.root, source),
      'initial seed-concept-journal.mjs --from pinned design',
    );
    const before = snapshot(fixture.root);
    expect(Object.keys(before).length).toBeGreaterThan(0);
    const repeated = seed(fixture.root, source);
    expect(repeated.code).toBe(1);
    expect(snapshot(fixture.root)).toEqual(before);
    assertSeeded(fixture.root, source);
  }, 120_000);

  it('8c — preserves the original seed bytes and reproduces its ordered contents, with the old files absent and untracked', () => {
    // Later appends may grow this repository's design; its original seed is immutable.
    const seedCommit = 'b4f4bc7c';
    const seedPaths = git(
      repositoryRoot,
      'diff-tree',
      '--no-commit-id',
      '--name-only',
      '--diff-filter=A',
      '-r',
      seedCommit,
      '--',
      'design/journal',
    )
      .trim()
      .split('\n')
      .sort();
    expect(seedPaths.length).toBeGreaterThan(0);
    const original = seedPaths.map((path) => {
      const bytes = Buffer.from(
        git(repositoryRoot, 'show', `${seedCommit}:${path}`),
      );
      expect(readFileSync(join(repositoryRoot, path)), path).toEqual(bytes);
      return bytes;
    });
    successful(
      seed(fixture.root, source),
      'reproduce original seed from pinned design',
    );
    const reproduced = Object.entries(snapshot(fixture.root))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, bytes]) => Buffer.from(bytes, 'base64'));
    const contents = (bytes: Buffer) => {
      const entry = JSON.parse(bytes.toString('utf8')) as Record<
        string,
        unknown
      >;
      // The seed has no links between generated ids. Keep decisionId and all payload
      // fields; who appended an entry is stamped by the journal, as its id and time are.
      const { id: _id, at: _at, by: _by, ...content } = entry;
      return content;
    };
    expect(reproduced.map(contents)).toEqual(original.map(contents));
    for (const path of [
      'design/workflow.md',
      'design/delivery.md',
      'design/decisions',
    ]) {
      expect(
        existsSync(join(repositoryRoot, path)),
        `${path} must be absent after cutover`,
      ).toBe(false);
    }
    expect(
      git(
        repositoryRoot,
        'ls-files',
        '--',
        'design/workflow.md',
        'design/delivery.md',
        'design/decisions',
      ),
    ).toBe('');
  }, 120_000);
});
