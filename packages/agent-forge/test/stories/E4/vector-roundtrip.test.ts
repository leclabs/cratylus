/**
 * E4.S8 — post-optimization round-trip: the 22-dimension vector is the source,
 * projected per-target (E6.S3's pinned projection, replacement semantics).
 *
 * GRADUATED: the engine exposes `projectVector` (core surface,
 * `src/core/engine/vector-projection.ts`) — the pinned dimension-vector →
 * config-IR projection E6.S3's replacement semantics compile against. The
 * capability probe stays (any candidate spelling satisfies it), and the
 * projection is exercised: a vector with a archetype string + a fragment dimension
 * projects to a config-IR agent whose body/description derive from the
 * vector — archetype is a plain field (not a σ*-fragment dimension, D13), so it
 * drives ONLY `description`, never a `## Archetype`/`archetype ≜` body line.
 */

import { describe, expect } from 'vitest';

import type { Agent as DimensionVector } from '../../../src/anatomy/index.js';
import { projectVector } from '../../../src/core/index.js';
import { story } from '../helpers.js';

/** All 22 fragment-dimension fields explicitly harness-inherited (`null`). */
const NULL_DIMENSIONS: Omit<DimensionVector, 'name' | 'archetype'> = {
  autonomy: null,
  role: null,
  formality: null,
  audienceAdaptation: null,
  transparency: null,
  provenance: null,
  objective: null,
  guardrails: null,
  engineeringPrinciples: null,
  heuristics: null,
  capabilities: null,
  learning: null,
  situationAwareness: null,
  actions: null,
  modalities: null,
  model: null,
  memory: null,
  trigger: null,
  framing: null,
  reasoningStrategy: null,
  satisficing: null,
  outputFormat: null,
  selfEvaluation: null,
};

describe('E4.S8 · dimension-vector as the one source', () => {
  story(
    'E4.S8',
    'engine exposes the pinned dimension-vector → per-target projection (E6.S3); absent today',
    async () => {
      const core: Record<string, unknown> = await import(
        '../../../src/core/index.js'
      );
      // Candidate spellings for the pinned projection entry point; any one
      // satisfies the probe — `projectVector` is the one that shipped.
      const candidates = [
        'projectVector',
        'projectDimensionVector',
        'dimensionVectorToIR',
        'compileVector',
        'vectorProjection',
      ];
      const found = candidates.filter(
        (name) => typeof core[name] === 'function',
      );
      expect(found.length).toBeGreaterThan(0);
      expect(found).toContain('projectVector');
      // Exercise the pinned projection: vector → config-IR agent, with the
      // body a deterministic per-dimension projection and the description
      // derived from the plain `archetype` field (the vector is the ONE source).
      const vector: DimensionVector = {
        ...NULL_DIMENSIONS,
        name: 'probe',
        archetype: 'a probe archetype',
        role: 'probe-role ≜ a probe role definiens',
      };
      const projected = projectVector(vector);
      expect(projected.name).toBe('probe');
      expect(projected.description).toBe('a probe archetype');
      expect(projected.body).toContain(
        'role ≜ probe-role ≜ a probe role definiens',
      );
      // `archetype` is a plain description field, not a fragment dimension — it
      // drives `description` only, never a body line.
      expect(projected.body).not.toContain('archetype ≜');
      // Inherited (null) dimensions project to NOTHING — no phantom sections.
      expect(projected.body).not.toContain('autonomy');
    },
  );
});
