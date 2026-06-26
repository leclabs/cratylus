import type { ResolvedAgent } from '@leclabs/koine/adapters/claude';
import type { Agent } from '@leclabs/koine/anatomy';
import { delegation as delegation_actions } from '../organs/actions/delegation.js';
import { fileOps as fileOps_actions } from '../organs/actions/file-ops.js';
import { convergence as convergence_audienceAdaptation } from '../organs/audience-adaptation/convergence.js';
import { humanOnTheLoop as humanOnTheLoop_autonomy } from '../organs/autonomy/human-on-the-loop.js';
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
import { longTermMemory as longTermMemory_memory } from '../organs/memory/long-term-memory.js';
import { text as text_modalities } from '../organs/modalities/text.js';
import { claude as claude_model } from '../organs/model/claude.js';
import { correctness as correctness_objective } from '../organs/objective/correctness.js';
import { structuredDecision as structuredDecision_outputFormat } from '../organs/output-format/structured-decision.js';
import { ruler as ruler_persona } from '../organs/persona/ruler.js';
import { reviewerArchetypePurple as reviewerArchetypePurple_provenance } from '../organs/provenance/reviewer-archetype-purple.js';
import { react as react_reasoningStrategy } from '../organs/reasoning-strategy/react.js';
import { review as review_role } from '../organs/role/review.js';
import { optimize as optimize_satisficing } from '../organs/satisficing/optimize.js';
import { selfCritique as selfCritique_selfEvaluation } from '../organs/self-evaluation/self-critique.js';
import { comprehension as comprehension_situationAwareness } from '../organs/situation-awareness/comprehension.js';
import { reasoningTrace as reasoningTrace_transparency } from '../organs/transparency/reasoning-trace.js';
import { userMessage as userMessage_trigger } from '../organs/trigger/user-message.js';
import { base } from './base.js';
export const principalEngineerReviewer: Agent = {
  ...base,
  name: 'principal-engineer-reviewer',
  persona: ruler_persona,
  role: review_role,
  formality: formal_formality,
  audienceAdaptation: convergence_audienceAdaptation,
  transparency: reasoningTrace_transparency,
  autonomy: humanOnTheLoop_autonomy,
  provenance: reviewerArchetypePurple_provenance,
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
  modalities: text_modalities,
  model: claude_model,
  memory: longTermMemory_memory,
  trigger: userMessage_trigger,
  framing: riskOriented_framing,
  reasoningStrategy: react_reasoningStrategy,
  satisficing: optimize_satisficing,
  outputFormat: structuredDecision_outputFormat,
  selfEvaluation: selfCritique_selfEvaluation,
};
export const principalEngineerReviewerResolved: ResolvedAgent = {
  name: 'principal-engineer-reviewer',
  description: ruler_persona.definiens,
  mark: reviewerArchetypePurple_provenance.mark,
  sourcePath: 'packages/mind/agent/principal-engineer-reviewer.md',
  memoryProtocol: base.memoryProtocol,
  organs: [
    ['Persona', [ruler_persona]],
    ['Role', [review_role]],
    ['Formality', [formal_formality]],
    ['Audience-Adaptation', [convergence_audienceAdaptation]],
    ['Transparency', [reasoningTrace_transparency]],
    ['Autonomy', [humanOnTheLoop_autonomy]],
    ['Provenance', [reviewerArchetypePurple_provenance]],
    ['Objective', [correctness_objective]],
    [
      'Guardrails',
      [
        harmAvoidance_guardrails,
        honesty_guardrails,
        helpfulness_guardrails,
        inputUntrusted_guardrails,
        scopeOfAuthority_guardrails,
      ],
    ],
    ['Heuristics', [takeTheBest_heuristics]],
    ['Capabilities', [reviewCritique_capabilities]],
    ['Learning', [correctionConsolidation_learning]],
    ['Situation-Awareness', [comprehension_situationAwareness]],
    ['Actions', [fileOps_actions, delegation_actions]],
    ['Modalities', [text_modalities]],
    ['Model', [claude_model]],
    ['Memory', [longTermMemory_memory]],
    ['Trigger', [userMessage_trigger]],
    ['Framing', [riskOriented_framing]],
    ['Reasoning-Strategy', [react_reasoningStrategy]],
    ['Satisficing', [optimize_satisficing]],
    ['Output-Format', [structuredDecision_outputFormat]],
    ['Self-Evaluation', [selfCritique_selfEvaluation]],
  ],
};
