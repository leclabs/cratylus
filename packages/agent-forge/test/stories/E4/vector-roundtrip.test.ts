/**
 * E4.S8 — post-optimization round-trip: the 22-organ vector is the source,
 * projected per-target (E6.S3's pinned projection, replacement semantics).
 *
 * GRADUATED: the engine exposes `projectVector` (core surface,
 * `src/core/engine/vector-projection.ts`) — the pinned organ-vector →
 * config-IR projection E6.S3's replacement semantics compile against. The
 * capability probe stays (any candidate spelling satisfies it), and the
 * projection is exercised: a vector with a persona string + a fragment organ
 * projects to a config-IR agent whose body/description derive from the
 * vector — persona is a plain field (not a σ*-fragment organ, D13), so it
 * drives ONLY `description`, never a `## Persona`/`persona ≜` body line.
 */

import { describe, expect } from 'vitest';

import type { Agent as OrganVector } from '../../../src/anatomy/index.js';
import { projectVector } from '../../../src/core/index.js';
import { story } from '../helpers.js';

/** All 22 fragment-organ fields explicitly harness-inherited (`null`). */
const NULL_ORGANS: Omit<OrganVector, 'name' | 'persona'> = {
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

describe('E4.S8 · organ-vector as the one source', () => {
  story(
    'E4.S8',
    'engine exposes the pinned organ-vector → per-target projection (E6.S3); absent today',
    async () => {
      const core: Record<string, unknown> = await import(
        '../../../src/core/index.js'
      );
      // Candidate spellings for the pinned projection entry point; any one
      // satisfies the probe — `projectVector` is the one that shipped.
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
      expect(found).toContain('projectVector');
      // Exercise the pinned projection: vector → config-IR agent, with the
      // body a deterministic per-organ projection and the description
      // derived from the plain `persona` field (the vector is the ONE source).
      const vector: OrganVector = {
        ...NULL_ORGANS,
        name: 'probe',
        persona: 'a probe persona',
        role: 'probe-role ≜ a probe role definiens',
      };
      const projected = projectVector(vector);
      expect(projected.name).toBe('probe');
      expect(projected.description).toBe('a probe persona');
      expect(projected.body).toContain(
        'role ≜ probe-role ≜ a probe role definiens',
      );
      // `persona` is a plain description field, not a fragment organ — it
      // drives `description` only, never a body line.
      expect(projected.body).not.toContain('persona ≜');
      // Inherited (null) organs project to NOTHING — no phantom sections.
      expect(projected.body).not.toContain('autonomy');
    },
  );
});
