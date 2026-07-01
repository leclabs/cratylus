import type { ResolvedAgent } from '@leclabs/agent-forge/adapters/claude';
import type { Agent } from '@leclabs/agent-forge/anatomy';
import { delegation as delegation_actions } from '../organs/actions/delegation.js';
import { fileOps as fileOps_actions } from '../organs/actions/file-ops.js';
import { convergence as convergence_audienceAdaptation } from '../organs/audience-adaptation/convergence.js';
import { humanOnTheLoop as humanOnTheLoop_autonomy } from '../organs/autonomy/human-on-the-loop.js';
import { planningDecomposition as planningDecomposition_capabilities } from '../organs/capabilities/planning-decomposition.js';
import { separationOfConcerns as separationOfConcerns_engineeringPrinciples } from '../organs/engineering-principles/separation-of-concerns.js';
import { formal as formal_formality } from '../organs/formality/formal.js';
import { decompositional as decompositional_framing } from '../organs/framing/decompositional.js';
import { harmAvoidance as harmAvoidance_guardrails } from '../organs/guardrails/harm-avoidance.js';
import { helpfulness as helpfulness_guardrails } from '../organs/guardrails/helpfulness.js';
import { honesty as honesty_guardrails } from '../organs/guardrails/honesty.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../organs/learning/correction-consolidation.js';
import { longTermMemory as longTermMemory_memory } from '../organs/memory/long-term-memory.js';
import { text as text_modalities } from '../organs/modalities/text.js';
import { claude as claude_model } from '../organs/model/claude.js';
import { delivery as delivery_objective } from '../organs/objective/delivery.js';
import { structuredDecision as structuredDecision_outputFormat } from '../organs/output-format/structured-decision.js';
import { ruler as ruler_persona } from '../organs/persona/ruler.js';
import { plannerArchetypeBlue as plannerArchetypeBlue_provenance } from '../organs/provenance/planner-archetype-blue.js';
import { planAndSolve as planAndSolve_reasoningStrategy } from '../organs/reasoning-strategy/plan-and-solve.js';
import { plan as plan_role } from '../organs/role/plan.js';
import { satisfice as satisfice_satisficing } from '../organs/satisficing/satisfice.js';
import { acceptanceCriteriaCheck as acceptanceCriteriaCheck_selfEvaluation } from '../organs/self-evaluation/acceptance-criteria-check.js';
import { projection as projection_situationAwareness } from '../organs/situation-awareness/projection.js';
import { decisionRationale as decisionRationale_transparency } from '../organs/transparency/decision-rationale.js';
import { userMessage as userMessage_trigger } from '../organs/trigger/user-message.js';
import { base } from './base.js';
export const planner: Agent = {
  ...base,
  name: 'planner',
  persona: ruler_persona,
  role: plan_role,
  formality: formal_formality,
  audienceAdaptation: convergence_audienceAdaptation,
  transparency: decisionRationale_transparency,
  autonomy: humanOnTheLoop_autonomy,
  provenance: plannerArchetypeBlue_provenance,
  objective: delivery_objective,
  engineeringPrinciples: [separationOfConcerns_engineeringPrinciples],
  guardrails: [
    harmAvoidance_guardrails,
    honesty_guardrails,
    helpfulness_guardrails,
  ],
  capabilities: [planningDecomposition_capabilities],
  learning: correctionConsolidation_learning,
  situationAwareness: projection_situationAwareness,
  actions: [fileOps_actions, delegation_actions],
  modalities: text_modalities,
  model: claude_model,
  memory: longTermMemory_memory,
  trigger: userMessage_trigger,
  framing: decompositional_framing,
  reasoningStrategy: planAndSolve_reasoningStrategy,
  satisficing: satisfice_satisficing,
  outputFormat: structuredDecision_outputFormat,
  selfEvaluation: acceptanceCriteriaCheck_selfEvaluation,
};
export const plannerResolved: ResolvedAgent = {
  name: 'planner',
  description: ruler_persona.definiens,
  mark: plannerArchetypeBlue_provenance.mark,
  sourcePath: 'packages/agent-anatomy/agent/planner.md',
  memoryProtocol: base.memoryProtocol,
  organs: [
    ['Persona', [ruler_persona]],
    ['Role', [plan_role]],
    ['Formality', [formal_formality]],
    ['Audience-Adaptation', [convergence_audienceAdaptation]],
    ['Transparency', [decisionRationale_transparency]],
    ['Autonomy', [humanOnTheLoop_autonomy]],
    ['Provenance', [plannerArchetypeBlue_provenance]],
    ['Objective', [delivery_objective]],
    ['Engineering-Principles', [separationOfConcerns_engineeringPrinciples]],
    [
      'Guardrails',
      [harmAvoidance_guardrails, honesty_guardrails, helpfulness_guardrails],
    ],
    ['Capabilities', [planningDecomposition_capabilities]],
    ['Learning', [correctionConsolidation_learning]],
    ['Situation-Awareness', [projection_situationAwareness]],
    ['Actions', [fileOps_actions, delegation_actions]],
    ['Modalities', [text_modalities]],
    ['Model', [claude_model]],
    ['Memory', [longTermMemory_memory]],
    ['Trigger', [userMessage_trigger]],
    ['Framing', [decompositional_framing]],
    ['Reasoning-Strategy', [planAndSolve_reasoningStrategy]],
    ['Satisficing', [satisfice_satisficing]],
    ['Output-Format', [structuredDecision_outputFormat]],
    ['Self-Evaluation', [acceptanceCriteriaCheck_selfEvaluation]],
  ],
};
