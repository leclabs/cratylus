import { delegation as delegation_actions } from '../dimensions/actions/delegation.js';
import { fileOps as fileOps_actions } from '../dimensions/actions/file-ops.js';
import { convergence as convergence_audienceAdaptation } from '../dimensions/audience-adaptation/convergence.js';
import { reviewCritique as reviewCritique_capabilities } from '../dimensions/capabilities/review-critique.js';
import { formal as formal_formality } from '../dimensions/formality/formal.js';
import { riskOriented as riskOriented_framing } from '../dimensions/framing/risk-oriented.js';
import { harmAvoidance as harmAvoidance_guardrails } from '../dimensions/guardrails/harm-avoidance.js';
import { helpfulness as helpfulness_guardrails } from '../dimensions/guardrails/helpfulness.js';
import { honesty as honesty_guardrails } from '../dimensions/guardrails/honesty.js';
import { inputUntrusted as inputUntrusted_guardrails } from '../dimensions/guardrails/input-untrusted.js';
import { scopeOfAuthority as scopeOfAuthority_guardrails } from '../dimensions/guardrails/scope-of-authority.js';
import { takeTheBest as takeTheBest_heuristics } from '../dimensions/heuristics/take-the-best.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../dimensions/learning/correction-consolidation.js';
import { correctness as correctness_objective } from '../dimensions/objective/correctness.js';
import { structuredDecision as structuredDecision_outputFormat } from '../dimensions/output-format/structured-decision.js';
import { react as react_reasoningStrategy } from '../dimensions/reasoning-strategy/react.js';
import { review as review_role } from '../dimensions/role/review.js';
import { optimize as optimize_satisficing } from '../dimensions/satisficing/optimize.js';
import { selfCritique as selfCritique_selfEvaluation } from '../dimensions/self-evaluation/self-critique.js';
import { comprehension as comprehension_situationAwareness } from '../dimensions/situation-awareness/comprehension.js';
import { reasoningTrace as reasoningTrace_transparency } from '../dimensions/transparency/reasoning-trace.js';
import type { Agent } from '../manifest.js';
export const principalEngineerReviewer: Agent = {
  name: 'principal-engineer-reviewer',
  description:
    "Use this agent when a change needs a verdict before it ships — a pass/fail with findings on what's wrong; it judges and flags, never authoring the fix itself.",
  archetype:
    'Ruler archetype of the review gate — judge an existing artifact against correctness · security · style · fit → verdict + findings (¬author the fix), the principal-IC standing specialized to guard what ships; risk-weighted, scope-bounded.',
  role: review_role,
  formality: formal_formality,
  audienceAdaptation: convergence_audienceAdaptation,
  transparency: reasoningTrace_transparency,
  autonomy: null,
  provenance: { mark: { emoji: '🛡️', hue: 'red' } },
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
