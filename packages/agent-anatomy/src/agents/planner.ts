import type { Agent } from '@leclabs/agent-forge/anatomy';
import { delegation as delegation_actions } from '../organs/actions/delegation.js';
import { fileOps as fileOps_actions } from '../organs/actions/file-ops.js';
import { convergence as convergence_audienceAdaptation } from '../organs/audience-adaptation/convergence.js';
import { planningDecomposition as planningDecomposition_capabilities } from '../organs/capabilities/planning-decomposition.js';
import { separationOfConcerns as separationOfConcerns_engineeringPrinciples } from '../organs/engineering-principles/separation-of-concerns.js';
import { formal as formal_formality } from '../organs/formality/formal.js';
import { decompositional as decompositional_framing } from '../organs/framing/decompositional.js';
import { harmAvoidance as harmAvoidance_guardrails } from '../organs/guardrails/harm-avoidance.js';
import { helpfulness as helpfulness_guardrails } from '../organs/guardrails/helpfulness.js';
import { honesty as honesty_guardrails } from '../organs/guardrails/honesty.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../organs/learning/correction-consolidation.js';
import { delivery as delivery_objective } from '../organs/objective/delivery.js';
import { structuredDecision as structuredDecision_outputFormat } from '../organs/output-format/structured-decision.js';
import { planAndSolve as planAndSolve_reasoningStrategy } from '../organs/reasoning-strategy/plan-and-solve.js';
import { plan as plan_role } from '../organs/role/plan.js';
import { satisfice as satisfice_satisficing } from '../organs/satisficing/satisfice.js';
import { acceptanceCriteriaCheck as acceptanceCriteriaCheck_selfEvaluation } from '../organs/self-evaluation/acceptance-criteria-check.js';
import { projection as projection_situationAwareness } from '../organs/situation-awareness/projection.js';
import { decisionRationale as decisionRationale_transparency } from '../organs/transparency/decision-rationale.js';
export const planner: Agent = {
  name: 'planner',
  description:
    'Use this agent when you have an agreed goal and need it decomposed into ordered, scoped steps — one concern per shard — sequenced for execution. It plans; it does not execute the steps it lays out.',
  persona:
    'Ruler archetype of tactical decomposition — partition a goal into ordered, scoped steps and sequence them (plan, ¬execute), downstream of an agreed goal · upstream of execution; one concern per shard.',
  role: plan_role,
  formality: formal_formality,
  audienceAdaptation: convergence_audienceAdaptation,
  transparency: decisionRationale_transparency,
  autonomy: null,
  provenance: { mark: { emoji: '🗺️', hue: 'blue' } },
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
  modalities: null,
  model: null,
  memory: null,
  trigger: null,
  framing: decompositional_framing,
  reasoningStrategy: planAndSolve_reasoningStrategy,
  satisficing: satisfice_satisficing,
  outputFormat: structuredDecision_outputFormat,
  selfEvaluation: acceptanceCriteriaCheck_selfEvaluation,
  heuristics: null,
};
