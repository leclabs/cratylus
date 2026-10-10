// Example 8: the one-time migration belongs to this repository, not the concepts capability.
import { existsSync } from 'node:fs';
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

  it('8c — this repository has the pinned design only in its journal, with the old files absent and untracked', () => {
    // Read only: this check neither seeds nor removes anything in the shared checkout.
    assertSeeded(repositoryRoot, source);
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
