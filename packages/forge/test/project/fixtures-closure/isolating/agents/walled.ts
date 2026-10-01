// An agent declaring worktree isolation and no skills: a harness that cannot start it in
// a worktree of its own warns once, naming it.
import type { FixtureAgent } from '../../../../fixture-manifest.js';

export const walled: FixtureAgent = {
  name: 'walled',
  description: 'a fixture agent declaring worktree isolation',
  archetype: 'A fixture agent that runs in a worktree of its own.',
  isolation: 'worktree',
  autonomy: null,
  role: null,
  formality: null,
  audienceAdaptation: null,
  transparency: null,
  provenance: null,
  objective: null,
  guardrails: [],
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
