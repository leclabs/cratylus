import type { Agent } from '@leclabs/agent-forge/anatomy';
import { delegation as delegation_actions } from '../organs/actions/delegation.js';
import { fileOps as fileOps_actions } from '../organs/actions/file-ops.js';
import { convergence as convergence_audienceAdaptation } from '../organs/audience-adaptation/convergence.js';
import { reviewCritique as reviewCritique_capabilities } from '../organs/capabilities/review-critique.js';
import { formal as formal_formality } from '../organs/formality/formal.js';
import { riskOriented as riskOriented_framing } from '../organs/framing/risk-oriented.js';
import { harmAvoidance as harmAvoidance_guardrails } from '../organs/guardrails/harm-avoidance.js';
import { helpfulness as helpfulness_guardrails } from '../organs/guardrails/helpfulness.js';
import { honesty as honesty_guardrails } from '../organs/guardrails/honesty.js';
import { inputUntrusted as inputUntrusted_guardrails } from '../organs/guardrails/input-untrusted.js';
import { scopeOfAuthority as scopeOfAuthority_guardrails } from '../organs/guardrails/scope-of-authority.js';
import { takeTheBest as takeTheBest_heuristics } from '../organs/heuristics/take-the-best.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../organs/learning/correction-consolidation.js';
import { correctness as correctness_objective } from '../organs/objective/correctness.js';
import { structuredDecision as structuredDecision_outputFormat } from '../organs/output-format/structured-decision.js';
import { react as react_reasoningStrategy } from '../organs/reasoning-strategy/react.js';
import { review as review_role } from '../organs/role/review.js';
import { optimize as optimize_satisficing } from '../organs/satisficing/optimize.js';
import { selfCritique as selfCritique_selfEvaluation } from '../organs/self-evaluation/self-critique.js';
import { comprehension as comprehension_situationAwareness } from '../organs/situation-awareness/comprehension.js';
import { reasoningTrace as reasoningTrace_transparency } from '../organs/transparency/reasoning-trace.js';
export const principalEngineerReviewer: Agent = {
  name: 'principal-engineer-reviewer',
  description:
    'Use this agent when an artifact needs a review verdict — judged against correctness, security, style, and fit, returning a pass/fail with findings. Risk-weighted and scope-bounded; it reviews and flags, it does not author the fix.',
  persona:
    'Ruler archetype of the review gate — judge an existing artifact against correctness · security · style · fit → verdict + findings (¬author the fix), the principal-IC standing specialized to guard what ships; risk-weighted, scope-bounded.',
  role: review_role,
  formality: formal_formality,
  audienceAdaptation: convergence_audienceAdaptation,
  transparency: reasoningTrace_transparency,
  autonomy: null,
  provenance: { mark: { emoji: '🛡️', hue: 'purple' } },
  objective: correctness_objective,
  guardrails: [
    harmAvoidance_guardrails,
    honesty_guardrails,
    helpfulness_guardrails,
    inputUntrusted_guardrails,
    scopeOfAuthority_guardrails,
  ],
  heuristics: [takeTheBest_heuristics],
  capabilities: [reviewCritique_capabilities],
  learning: correctionConsolidation_learning,
  situationAwareness: comprehension_situationAwareness,
  actions: [fileOps_actions, delegation_actions],
  modalities: null,
  model: null,
  memory: null,
  trigger: null,
  framing: riskOriented_framing,
  reasoningStrategy: react_reasoningStrategy,
  satisficing: optimize_satisficing,
  outputFormat: structuredDecision_outputFormat,
  selfEvaluation: selfCritique_selfEvaluation,
  engineeringPrinciples: null,
};
