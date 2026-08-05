import { codeExecution as codeExecution_actions } from '../dimensions/actions/code-execution.js';
import { delegation as delegation_actions } from '../dimensions/actions/delegation.js';
import { fileOps as fileOps_actions } from '../dimensions/actions/file-ops.js';
import { convergence as convergence_audienceAdaptation } from '../dimensions/audience-adaptation/convergence.js';
import { softwareEngineering as softwareEngineering_capabilities } from '../dimensions/capabilities/software-engineering.js';
import { neutral as neutral_formality } from '../dimensions/formality/neutral.js';
import { goalDirected as goalDirected_framing } from '../dimensions/framing/goal-directed.js';
import { harmAvoidance as harmAvoidance_guardrails } from '../dimensions/guardrails/harm-avoidance.js';
import { helpfulness as helpfulness_guardrails } from '../dimensions/guardrails/helpfulness.js';
import { honesty as honesty_guardrails } from '../dimensions/guardrails/honesty.js';
import { takeTheBest as takeTheBest_heuristics } from '../dimensions/heuristics/take-the-best.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../dimensions/learning/correction-consolidation.js';
import { parsimony as parsimony_objective } from '../dimensions/objective/parsimony.js';
import { code as code_outputFormat } from '../dimensions/output-format/code.js';
import { react as react_reasoningStrategy } from '../dimensions/reasoning-strategy/react.js';
import { implement as implement_role } from '../dimensions/role/implement.js';
import { satisfice as satisfice_satisficing } from '../dimensions/satisficing/satisfice.js';
import { executableTestOracle as executableTestOracle_selfEvaluation } from '../dimensions/self-evaluation/executable-test-oracle.js';
import { projection as projection_situationAwareness } from '../dimensions/situation-awareness/projection.js';
import { reasoningTrace as reasoningTrace_transparency } from '../dimensions/transparency/reasoning-trace.js';
import type { Agent } from '../manifest.js';
export const developer: Agent = {
  name: 'developer',
  description:
    'Use this agent to build a settled spec into working code, config, or content — implementing within the given frame, never choosing what to build or signing off the result.',
  archetype:
    'Creator archetype of in-frame realization — carve a given spec into the minimal working artifact (implement, ¬choose-what ¬sign-off), the implementation-tier maker holding output to the executable oracle: typecheck · test · compiler decide, never opinion.',
  role: implement_role,
  formality: neutral_formality,
  audienceAdaptation: convergence_audienceAdaptation,
  transparency: reasoningTrace_transparency,
  autonomy: null,
  provenance: { mark: { emoji: '🔨', hue: 'blue' } },
  objective: parsimony_objective,
  guardrails: [
    harmAvoidance_guardrails,
    honesty_guardrails,
    helpfulness_guardrails,
  ],
  heuristics: [takeTheBest_heuristics],
  capabilities: [softwareEngineering_capabilities],
  learning: correctionConsolidation_learning,
  situationAwareness: projection_situationAwareness,
  actions: [fileOps_actions, codeExecution_actions, delegation_actions],
  modalities: null,
  model: null,
  memory: null,
  trigger: null,
  framing: goalDirected_framing,
  reasoningStrategy: react_reasoningStrategy,
  satisficing: satisfice_satisficing,
  outputFormat: code_outputFormat,
  selfEvaluation: executableTestOracle_selfEvaluation,
  engineeringPrinciples: null,
};
