// A fixture agent composing an ENFORCING guardrail — the vector that exercises
// the degradation seam.
//
// Its constraint fires on `turn.end`, which BOTH harnesses realize and only
// claude can narrow to an agent. That asymmetry is the whole point: the same
// vector projects as a BOUND on claude and degrades to a STEER on codex, so one
// fixture drives both sides of the decision without a mock.

import type { FixtureAgent } from '../../../fixture-manifest.js';

export const warden: FixtureAgent = {
  name: 'warden',
  description: 'a fixture agent composing an enforcing guardrail',
  archetype: 'A fixture agent used to exercise the enforcement-mode seam.',
  guardrails: [
    {
      // The DECLARATION face. This string must survive on EVERY harness,
      // degraded or not — it is what makes a steer a steer rather than silence.
      body: 'fixture-warden ≜ the rule the agent can read',
      substrate: 'harness',
      events: ['turn.end'],
      realizedBy: 'fixture-warden',
    },
  ],
  autonomy: null,
  role: null,
  formality: null,
  audienceAdaptation: null,
  transparency: null,
  provenance: null,
  objective: null,
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
