import type { ResolvedAgent } from '@leclabs/agent-forge/adapters/claude';
import type { Agent } from '@leclabs/agent-forge/anatomy';
import { codeExecution as codeExecution_actions } from '../organs/actions/code-execution.js';
import { delegation as delegation_actions } from '../organs/actions/delegation.js';
import { fileOps as fileOps_actions } from '../organs/actions/file-ops.js';
import { convergence as convergence_audienceAdaptation } from '../organs/audience-adaptation/convergence.js';
import { softwareEngineering as softwareEngineering_capabilities } from '../organs/capabilities/software-engineering.js';
import { neutral as neutral_formality } from '../organs/formality/neutral.js';
import { goalDirected as goalDirected_framing } from '../organs/framing/goal-directed.js';
import { harmAvoidance as harmAvoidance_guardrails } from '../organs/guardrails/harm-avoidance.js';
import { helpfulness as helpfulness_guardrails } from '../organs/guardrails/helpfulness.js';
import { honesty as honesty_guardrails } from '../organs/guardrails/honesty.js';
import { satisficing as satisficing_heuristics } from '../organs/heuristics/satisficing.js';
import { takeTheBest as takeTheBest_heuristics } from '../organs/heuristics/take-the-best.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../organs/learning/correction-consolidation.js';
import { longTermMemory as longTermMemory_memory } from '../organs/memory/long-term-memory.js';
import { parsimony as parsimony_objective } from '../organs/objective/parsimony.js';
import { code as code_outputFormat } from '../organs/output-format/code.js';
import { creator as creator_persona } from '../organs/persona/creator.js';
import { developerArchetypeBlue as developerArchetypeBlue_provenance } from '../organs/provenance/developer-archetype-blue.js';
import { react as react_reasoningStrategy } from '../organs/reasoning-strategy/react.js';
import { implement as implement_role } from '../organs/role/implement.js';
import { satisfice as satisfice_satisficing } from '../organs/satisficing/satisfice.js';
import { executableTestOracle as executableTestOracle_selfEvaluation } from '../organs/self-evaluation/executable-test-oracle.js';
import { projection as projection_situationAwareness } from '../organs/situation-awareness/projection.js';
import { reasoningTrace as reasoningTrace_transparency } from '../organs/transparency/reasoning-trace.js';
import { base } from './base.js';
export const developer: Agent = {
  ...base,
  name: 'developer',
  persona: creator_persona,
  role: implement_role,
  formality: neutral_formality,
  audienceAdaptation: convergence_audienceAdaptation,
  transparency: reasoningTrace_transparency,
  autonomy: null,
  provenance: developerArchetypeBlue_provenance,
  objective: parsimony_objective,
  guardrails: [
    harmAvoidance_guardrails,
    honesty_guardrails,
    helpfulness_guardrails,
  ],
  heuristics: [takeTheBest_heuristics, satisficing_heuristics],
  capabilities: [softwareEngineering_capabilities],
  learning: correctionConsolidation_learning,
  situationAwareness: projection_situationAwareness,
  actions: [fileOps_actions, codeExecution_actions, delegation_actions],
  modalities: null,
  model: null,
  memory: longTermMemory_memory,
  trigger: null,
  framing: goalDirected_framing,
  reasoningStrategy: react_reasoningStrategy,
  satisficing: satisfice_satisficing,
  outputFormat: code_outputFormat,
  selfEvaluation: executableTestOracle_selfEvaluation,
  engineeringPrinciples: null,
};
export const developerResolved: ResolvedAgent = {
  name: 'developer',
  description: creator_persona.definiens,
  mark: developerArchetypeBlue_provenance.mark,
  sourcePath: 'packages/agent-anatomy/agent/developer.md',
  memoryProtocol: base.memoryProtocol,
  personaProtocol: base.personaProtocol,
  organs: [
    ['Persona', [creator_persona]],
    ['Role', [implement_role]],
    ['Formality', [neutral_formality]],
    ['Audience-Adaptation', [convergence_audienceAdaptation]],
    ['Transparency', [reasoningTrace_transparency]],
    ['Provenance', [developerArchetypeBlue_provenance]],
    ['Objective', [parsimony_objective]],
    [
      'Guardrails',
      [harmAvoidance_guardrails, honesty_guardrails, helpfulness_guardrails],
    ],
    ['Heuristics', [takeTheBest_heuristics, satisficing_heuristics]],
    ['Capabilities', [softwareEngineering_capabilities]],
    ['Learning', [correctionConsolidation_learning]],
    ['Situation-Awareness', [projection_situationAwareness]],
    ['Actions', [fileOps_actions, codeExecution_actions, delegation_actions]],
    ['Memory', [longTermMemory_memory]],
    ['Framing', [goalDirected_framing]],
    ['Reasoning-Strategy', [react_reasoningStrategy]],
    ['Satisficing', [satisfice_satisficing]],
    ['Output-Format', [code_outputFormat]],
    ['Self-Evaluation', [executableTestOracle_selfEvaluation]],
  ],
};
