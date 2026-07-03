/**
 * E4.S8 — post-optimization round-trip: the 24-organ vector is the source,
 * projected per-target (E6.S3's pinned projection, replacement semantics).
 *
 * The vector pipeline does not exist in agent-forge yet, so the story is
 * tracked via a dynamic capability probe: the engine must expose a
 * vector-projection entry point before any of the deeper assertions
 * (single-source replacement, reimport reconciliation, relay discipline)
 * become expressible. The day the pipeline lands this fails loudly and the
 * full assertion set must be written in its place.
 */

import { describe, expect } from 'vitest';

import { story } from '../helpers.js';

describe('E4.S8 · organ-vector as the one source', () => {
  story.tracked(
    'E4.S8',
    'engine exposes the pinned organ-vector → per-target projection (E6.S3); absent today',
    async () => {
      const core: Record<string, unknown> = await import(
        '../../../src/core/index.js'
      );
      // Candidate spellings for the pinned projection entry point; any one
      // satisfies the probe. None exists today — the vector pipeline is the
      // E6.S3 deliverable this story compiles against.
      const candidates = [
        'projectVector',
        'projectOrganVector',
        'organVectorToIR',
        'compileVector',
        'vectorProjection',
      ];
      const found = candidates.filter(
        (name) => typeof core[name] === 'function',
      );
      expect(found.length).toBeGreaterThan(0);
    },
  );
});
