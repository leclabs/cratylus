import type { Agent } from '../anatomy.js';
import { delegation as delegation_actions } from '../dimensions/actions/delegation.js';
import { fileOps as fileOps_actions } from '../dimensions/actions/file-ops.js';
import { convergence as convergence_audienceAdaptation } from '../dimensions/audience-adaptation/convergence.js';
import { softwareEngineering as softwareEngineering_capabilities } from '../dimensions/capabilities/software-engineering.js';
import { systemDesign as systemDesign_capabilities } from '../dimensions/capabilities/system-design.js';
import { coldDecodeOracle as coldDecodeOracle_engineeringPrinciples } from '../dimensions/engineering-principles/cold-decode-oracle.js';
import { dry as dry_engineeringPrinciples } from '../dimensions/engineering-principles/dry.js';
import { firstPrinciples as firstPrinciples_engineeringPrinciples } from '../dimensions/engineering-principles/first-principles.js';
import { invokeTheCanonical as invokeTheCanonical_engineeringPrinciples } from '../dimensions/engineering-principles/invoke-the-canonical.js';
import { llmNative as llmNative_engineeringPrinciples } from '../dimensions/engineering-principles/llm-native.js';
import { mece as mece_engineeringPrinciples } from '../dimensions/engineering-principles/mece.js';
import { trustButVerify as trustButVerify_engineeringPrinciples } from '../dimensions/engineering-principles/trust-but-verify.js';
import { zeroTrust as zeroTrust_engineeringPrinciples } from '../dimensions/engineering-principles/zero-trust.js';
import { neutral as neutral_formality } from '../dimensions/formality/neutral.js';
import { firstPrinciples as firstPrinciples_framing } from '../dimensions/framing/first-principles.js';
import { harmAvoidance as harmAvoidance_guardrails } from '../dimensions/guardrails/harm-avoidance.js';
import { helpfulness as helpfulness_guardrails } from '../dimensions/guardrails/helpfulness.js';
import { honesty as honesty_guardrails } from '../dimensions/guardrails/honesty.js';
import { scopeOfAuthority as scopeOfAuthority_guardrails } from '../dimensions/guardrails/scope-of-authority.js';
import { takeTheBest as takeTheBest_heuristics } from '../dimensions/heuristics/take-the-best.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../dimensions/learning/correction-consolidation.js';
import { delivery as delivery_objective } from '../dimensions/objective/delivery.js';
import { structuredDecision as structuredDecision_outputFormat } from '../dimensions/output-format/structured-decision.js';
import { planAndSolve as planAndSolve_reasoningStrategy } from '../dimensions/reasoning-strategy/plan-and-solve.js';
import { orchestrate as orchestrate_role } from '../dimensions/role/orchestrate.js';
import { optimize as optimize_satisficing } from '../dimensions/satisficing/optimize.js';
import { selfCritique as selfCritique_selfEvaluation } from '../dimensions/self-evaluation/self-critique.js';
import { projection as projection_situationAwareness } from '../dimensions/situation-awareness/projection.js';
import { reasoningTrace as reasoningTrace_transparency } from '../dimensions/transparency/reasoning-trace.js';
export const principalIc: Agent = {
  name: 'principal-ic',
  description:
    'Use this agent when a goal needs orchestration across multiple agents — dispatch, sequence, and integrate their work to a delivered result. It coordinates the delegated work; it does not do that work itself.',
  archetype:
    "Ruler archetype of the IC root — dispatch · sequence · integrate other agents' work to a delivered goal (orchestrate, ¬do the delegated work itself), the principal-tier root standing that mav · nico · reviewer · tester specialize.",
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
  heuristics: [takeTheBest_heuristics],
  capabilities: [systemDesign_capabilities, softwareEngineering_capabilities],
  learning: correctionConsolidation_learning,
  situationAwareness: projection_situationAwareness,
  actions: [fileOps_actions, delegation_actions],
  modalities: null,
  model: null,
  memory: null,
  trigger: null,
  framing: firstPrinciples_framing,
  reasoningStrategy: planAndSolve_reasoningStrategy,
  satisficing: optimize_satisficing,
  outputFormat: structuredDecision_outputFormat,
  selfEvaluation: selfCritique_selfEvaluation,
};
