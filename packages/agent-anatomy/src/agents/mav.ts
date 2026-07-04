import type { ResolvedAgent } from '@leclabs/agent-forge/adapters/claude';
import type { Agent } from '@leclabs/agent-forge/anatomy';
import { codeExecution as codeExecution_actions } from '../organs/actions/code-execution.js';
import { delegation as delegation_actions } from '../organs/actions/delegation.js';
import { fileOps as fileOps_actions } from '../organs/actions/file-ops.js';
import { convergence as convergence_audienceAdaptation } from '../organs/audience-adaptation/convergence.js';
import { humanOnTheLoop as humanOnTheLoop_autonomy } from '../organs/autonomy/human-on-the-loop.js';
import { operationsDelivery as operationsDelivery_capabilities } from '../organs/capabilities/operations-delivery.js';
import { softwareEngineering as softwareEngineering_capabilities } from '../organs/capabilities/software-engineering.js';
import { coldDecodeOracle as coldDecodeOracle_engineeringPrinciples } from '../organs/engineering-principles/cold-decode-oracle.js';
import { dry as dry_engineeringPrinciples } from '../organs/engineering-principles/dry.js';
import { firstPrinciples as firstPrinciples_engineeringPrinciples } from '../organs/engineering-principles/first-principles.js';
import { invokeTheCanonical as invokeTheCanonical_engineeringPrinciples } from '../organs/engineering-principles/invoke-the-canonical.js';
import { llmNative as llmNative_engineeringPrinciples } from '../organs/engineering-principles/llm-native.js';
import { mece as mece_engineeringPrinciples } from '../organs/engineering-principles/mece.js';
import { trustButVerify as trustButVerify_engineeringPrinciples } from '../organs/engineering-principles/trust-but-verify.js';
import { zeroTrust as zeroTrust_engineeringPrinciples } from '../organs/engineering-principles/zero-trust.js';
import { formal as formal_formality } from '../organs/formality/formal.js';
import { goalDirected as goalDirected_framing } from '../organs/framing/goal-directed.js';
import { harmAvoidance as harmAvoidance_guardrails } from '../organs/guardrails/harm-avoidance.js';
import { helpfulness as helpfulness_guardrails } from '../organs/guardrails/helpfulness.js';
import { honesty as honesty_guardrails } from '../organs/guardrails/honesty.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../organs/learning/correction-consolidation.js';
import { longTermMemory as longTermMemory_memory } from '../organs/memory/long-term-memory.js';
import { delivery as delivery_objective } from '../organs/objective/delivery.js';
import { code as code_outputFormat } from '../organs/output-format/code.js';
import { hero as hero_persona } from '../organs/persona/hero.js';
import { mavArchetypeGreen as mavArchetypeGreen_provenance } from '../organs/provenance/mav-archetype-green.js';
import { planAndSolve as planAndSolve_reasoningStrategy } from '../organs/reasoning-strategy/plan-and-solve.js';
import { build as build_role } from '../organs/role/build.js';
import { optimize as optimize_satisficing } from '../organs/satisficing/optimize.js';
import { executableTestOracle as executableTestOracle_selfEvaluation } from '../organs/self-evaluation/executable-test-oracle.js';
import { projection as projection_situationAwareness } from '../organs/situation-awareness/projection.js';
import { reasoningTrace as reasoningTrace_transparency } from '../organs/transparency/reasoning-trace.js';
import { base } from './base.js';
export const mav: Agent = {
  ...base,
  name: 'mav',
  persona: hero_persona,
  role: build_role,
  formality: formal_formality,
  audienceAdaptation: convergence_audienceAdaptation,
  transparency: reasoningTrace_transparency,
  autonomy: humanOnTheLoop_autonomy,
  provenance: mavArchetypeGreen_provenance,
  objective: delivery_objective,
  engineeringPrinciples: [
    firstPrinciples_engineeringPrinciples,
    zeroTrust_engineeringPrinciples,
    dry_engineeringPrinciples,
    mece_engineeringPrinciples,
    llmNative_engineeringPrinciples,
    coldDecodeOracle_engineeringPrinciples,
    trustButVerify_engineeringPrinciples,
    invokeTheCanonical_engineeringPrinciples,
  ],
  guardrails: [
    harmAvoidance_guardrails,
    honesty_guardrails,
    helpfulness_guardrails,
  ],
  capabilities: [
    softwareEngineering_capabilities,
    operationsDelivery_capabilities,
  ],
  learning: correctionConsolidation_learning,
  situationAwareness: projection_situationAwareness,
  actions: [fileOps_actions, codeExecution_actions, delegation_actions],
  modalities: null,
  model: null,
  memory: longTermMemory_memory,
  trigger: null,
  framing: goalDirected_framing,
  reasoningStrategy: planAndSolve_reasoningStrategy,
  satisficing: optimize_satisficing,
  outputFormat: code_outputFormat,
  selfEvaluation: executableTestOracle_selfEvaluation,
  heuristics: null,
};
export const mavResolved: ResolvedAgent = {
  name: 'mav',
  description: hero_persona.definiens,
  mark: mavArchetypeGreen_provenance.mark,
  sourcePath: 'packages/agent-anatomy/agent/mav.md',
  memoryProtocol: base.memoryProtocol,
  personaProtocol: base.personaProtocol,
  organs: [
    ['Persona', [hero_persona]],
    ['Role', [build_role]],
    ['Formality', [formal_formality]],
    ['Audience-Adaptation', [convergence_audienceAdaptation]],
    ['Transparency', [reasoningTrace_transparency]],
    ['Autonomy', [humanOnTheLoop_autonomy]],
    ['Provenance', [mavArchetypeGreen_provenance]],
    ['Objective', [delivery_objective]],
    [
      'Engineering-Principles',
      [
        firstPrinciples_engineeringPrinciples,
        zeroTrust_engineeringPrinciples,
        dry_engineeringPrinciples,
        mece_engineeringPrinciples,
        llmNative_engineeringPrinciples,
        coldDecodeOracle_engineeringPrinciples,
        trustButVerify_engineeringPrinciples,
        invokeTheCanonical_engineeringPrinciples,
      ],
    ],
    [
      'Guardrails',
      [harmAvoidance_guardrails, honesty_guardrails, helpfulness_guardrails],
    ],
    [
      'Capabilities',
      [softwareEngineering_capabilities, operationsDelivery_capabilities],
    ],
    ['Learning', [correctionConsolidation_learning]],
    ['Situation-Awareness', [projection_situationAwareness]],
    ['Actions', [fileOps_actions, codeExecution_actions, delegation_actions]],
    ['Memory', [longTermMemory_memory]],
    ['Framing', [goalDirected_framing]],
    ['Reasoning-Strategy', [planAndSolve_reasoningStrategy]],
    ['Satisficing', [optimize_satisficing]],
    ['Output-Format', [code_outputFormat]],
    ['Self-Evaluation', [executableTestOracle_selfEvaluation]],
  ],
};
