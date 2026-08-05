// A minimal agent vector for the projection fixture plugin. Every dimension is
// `null` (explicit omit-to-inherit) EXCEPT the two σ* fields the SOUL always
// carries and `guardrails` — the fixture exercises the PROJECTION SEAM, not the
// manifest.
//
// `guardrails` is the one dimension that cannot be omitted: it is the catch-all
// against attachment failing open, so the manifest declares it without `| null`
// and a guardrail-less vector does not compile. A fixture is exactly the agent
// such a hole would escape through, so it carries a real value rather than an
// exemption — a cast or an `@ts-expect-error` here would re-open the hole under
// a different name.

import type { FixtureAgent } from '../../../fixture-manifest.js';

export const probe: FixtureAgent = {
  name: 'probe',
  description: 'a fixture agent',
  autonomy: null,
  archetype: 'A fixture agent used to exercise the projection seam.',
  role: null,
  formality: null,
  audienceAdaptation: null,
  transparency: null,
  provenance: null,
  objective: null,
  guardrails: ['fixture-guardrail'],
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
