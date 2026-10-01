// The one place a fixture agent's twenty-odd `null` dimensions are spelled, so each
// agent module under `agents/` states only what makes it different: its identity,
// the role it holds and dispatches, the skills it is given, and whether it composes
// an autonomy value (which is what the `guard` hook binds).
//
// It sits BESIDE `agents/`, not in it: projection scans that dir and reads each
// module as an agent.

import type { FixtureAgent } from '../../../fixture-manifest.js';

export function agentVector(
  own: Pick<FixtureAgent, 'name' | 'description'> & Partial<FixtureAgent>,
): FixtureAgent {
  return {
    archetype: 'A fixture agent used to exercise practice selection.',
    autonomy: null,
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
    ...own,
  };
}
