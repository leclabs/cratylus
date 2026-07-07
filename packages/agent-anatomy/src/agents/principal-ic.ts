import type { Agent } from '@leclabs/agent-forge/anatomy';
import { delegation as delegation_actions } from '../organs/actions/delegation.js';
import { fileOps as fileOps_actions } from '../organs/actions/file-ops.js';
import { convergence as convergence_audienceAdaptation } from '../organs/audience-adaptation/convergence.js';
import { softwareEngineering as softwareEngineering_capabilities } from '../organs/capabilities/software-engineering.js';
import { systemDesign as systemDesign_capabilities } from '../organs/capabilities/system-design.js';
import { coldDecodeOracle as coldDecodeOracle_engineeringPrinciples } from '../organs/engineering-principles/cold-decode-oracle.js';
import { dry as dry_engineeringPrinciples } from '../organs/engineering-principles/dry.js';
import { firstPrinciples as firstPrinciples_engineeringPrinciples } from '../organs/engineering-principles/first-principles.js';
import { invokeTheCanonical as invokeTheCanonical_engineeringPrinciples } from '../organs/engineering-principles/invoke-the-canonical.js';
import { llmNative as llmNative_engineeringPrinciples } from '../organs/engineering-principles/llm-native.js';
import { mece as mece_engineeringPrinciples } from '../organs/engineering-principles/mece.js';
import { trustButVerify as trustButVerify_engineeringPrinciples } from '../organs/engineering-principles/trust-but-verify.js';
import { zeroTrust as zeroTrust_engineeringPrinciples } from '../organs/engineering-principles/zero-trust.js';
import { neutral as neutral_formality } from '../organs/formality/neutral.js';
import { firstPrinciples as firstPrinciples_framing } from '../organs/framing/first-principles.js';
import { harmAvoidance as harmAvoidance_guardrails } from '../organs/guardrails/harm-avoidance.js';
import { helpfulness as helpfulness_guardrails } from '../organs/guardrails/helpfulness.js';
import { honesty as honesty_guardrails } from '../organs/guardrails/honesty.js';
import { scopeOfAuthority as scopeOfAuthority_guardrails } from '../organs/guardrails/scope-of-authority.js';
import { satisficing as satisficing_heuristics } from '../organs/heuristics/satisficing.js';
import { takeTheBest as takeTheBest_heuristics } from '../organs/heuristics/take-the-best.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../organs/learning/correction-consolidation.js';
import { longTermMemory as longTermMemory_memory } from '../organs/memory/long-term-memory.js';
import { delivery as delivery_objective } from '../organs/objective/delivery.js';
import { structuredDecision as structuredDecision_outputFormat } from '../organs/output-format/structured-decision.js';
import { planAndSolve as planAndSolve_reasoningStrategy } from '../organs/reasoning-strategy/plan-and-solve.js';
import { orchestrate as orchestrate_role } from '../organs/role/orchestrate.js';
import { optimize as optimize_satisficing } from '../organs/satisficing/optimize.js';
import { selfCritique as selfCritique_selfEvaluation } from '../organs/self-evaluation/self-critique.js';
import { projection as projection_situationAwareness } from '../organs/situation-awareness/projection.js';
import { reasoningTrace as reasoningTrace_transparency } from '../organs/transparency/reasoning-trace.js';
export const principalIc: Agent = {
  name: 'principal-ic',
  persona: '',
  role: orchestrate_role,
  formality: neutral_formality,
  audienceAdaptation: convergence_audienceAdaptation,
  transparency: reasoningTrace_transparency,
  autonomy: null,
  provenance: { mark: { emoji: '🏛️', hue: 'red' } },
  objective: delivery_objective,
  engineeringPrinciples: [
    firstPrinciples_engineeringPrinciples,
    dry_engineeringPrinciples,
    mece_engineeringPrinciples,
    zeroTrust_engineeringPrinciples,
    trustButVerify_engineeringPrinciples,
    invokeTheCanonical_engineeringPrinciples,
    llmNative_engineeringPrinciples,
    coldDecodeOracle_engineeringPrinciples,
  ],
  guardrails: [
    harmAvoidance_guardrails,
    honesty_guardrails,
    helpfulness_guardrails,
    scopeOfAuthority_guardrails,
  ],
  heuristics: [takeTheBest_heuristics, satisficing_heuristics],
  capabilities: [systemDesign_capabilities, softwareEngineering_capabilities],
  learning: correctionConsolidation_learning,
  situationAwareness: projection_situationAwareness,
  actions: [fileOps_actions, delegation_actions],
  modalities: null,
  model: null,
  memory: longTermMemory_memory,
  trigger: null,
  framing: firstPrinciples_framing,
  reasoningStrategy: planAndSolve_reasoningStrategy,
  satisficing: optimize_satisficing,
  outputFormat: structuredDecision_outputFormat,
  selfEvaluation: selfCritique_selfEvaluation,
};
