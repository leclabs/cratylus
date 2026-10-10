// An agent declaring worktree isolation and no skills: a harness that cannot start it in
// a worktree of its own warns once, naming it.
import type { FixtureAgent } from '../../../../fixture-manifest.js';

export const walled: FixtureAgent = {
  name: 'walled',
  description: 'a fixture agent declaring worktree isolation',
  mark: null,
  key: null,
  isolation: 'worktree',
  autonomy: [],
  role: [],
  formality: [],
  audienceAdaptation: [],
  transparency: [],
  objective: [],
  guardrails: [],
  engineeringPrinciples: [],
  heuristics: [],
  capabilities: [],
  learning: [],
  situationAwareness: [],
  actions: [],
  modalities: [],
  model: [],
  memory: [],
  trigger: [],
  framing: [],
  reasoningStrategy: [],
  satisficing: [],
  outputFormat: [],
  selfEvaluation: [],
};
