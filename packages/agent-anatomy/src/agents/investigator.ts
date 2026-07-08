import type { Agent } from '@leclabs/agent-forge/anatomy';
import { codeExecution as codeExecution_actions } from '../organs/actions/code-execution.js';
import { delegation as delegation_actions } from '../organs/actions/delegation.js';
import { fileOps as fileOps_actions } from '../organs/actions/file-ops.js';
import { convergence as convergence_audienceAdaptation } from '../organs/audience-adaptation/convergence.js';
import { analysisDiagnosis as analysisDiagnosis_capabilities } from '../organs/capabilities/analysis-diagnosis.js';
import { researchInvestigation as researchInvestigation_capabilities } from '../organs/capabilities/research-investigation.js';
import { formal as formal_formality } from '../organs/formality/formal.js';
import { diagnostic as diagnostic_framing } from '../organs/framing/diagnostic.js';
import { harmAvoidance as harmAvoidance_guardrails } from '../organs/guardrails/harm-avoidance.js';
import { helpfulness as helpfulness_guardrails } from '../organs/guardrails/helpfulness.js';
import { honesty as honesty_guardrails } from '../organs/guardrails/honesty.js';
import { inputUntrusted as inputUntrusted_guardrails } from '../organs/guardrails/input-untrusted.js';
import { takeTheBest as takeTheBest_heuristics } from '../organs/heuristics/take-the-best.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../organs/learning/correction-consolidation.js';
import { insight as insight_objective } from '../organs/objective/insight.js';
import { naturalLanguage as naturalLanguage_outputFormat } from '../organs/output-format/natural-language.js';
import { reflexion as reflexion_reasoningStrategy } from '../organs/reasoning-strategy/reflexion.js';
import { diagnose as diagnose_role } from '../organs/role/diagnose.js';
import { optimize as optimize_satisficing } from '../organs/satisficing/optimize.js';
import { selfCritique as selfCritique_selfEvaluation } from '../organs/self-evaluation/self-critique.js';
import { comprehension as comprehension_situationAwareness } from '../organs/situation-awareness/comprehension.js';
import { reasoningTrace as reasoningTrace_transparency } from '../organs/transparency/reasoning-trace.js';
export const investigator: Agent = {
  name: 'investigator',
  description:
    'Use this agent when something is broken or surprising and you need the root cause — reason backward from symptom to fault via hypotheses and evidence-narrowing, naming the mechanism and the why. It diagnoses and explains; it does not ship the remedy.',
  persona:
    'Sage archetype of root-cause diagnosis — reason backward from symptom to fault via hypotheses + evidence-narrowing, name the mechanism and the why (¬ship the remedy); insight over a merely working answer.',
  role: diagnose_role,
  formality: formal_formality,
  audienceAdaptation: convergence_audienceAdaptation,
  transparency: reasoningTrace_transparency,
  autonomy: null,
  provenance: { mark: { emoji: '🔍', hue: 'purple' } },
  objective: insight_objective,
  guardrails: [
    harmAvoidance_guardrails,
    honesty_guardrails,
    helpfulness_guardrails,
    inputUntrusted_guardrails,
  ],
  heuristics: [takeTheBest_heuristics],
  capabilities: [
    analysisDiagnosis_capabilities,
    researchInvestigation_capabilities,
  ],
  learning: correctionConsolidation_learning,
  situationAwareness: comprehension_situationAwareness,
  actions: [codeExecution_actions, fileOps_actions, delegation_actions],
  modalities: null,
  model: null,
  memory: null,
  trigger: null,
  framing: diagnostic_framing,
  reasoningStrategy: reflexion_reasoningStrategy,
  satisficing: optimize_satisficing,
  outputFormat: naturalLanguage_outputFormat,
  selfEvaluation: selfCritique_selfEvaluation,
  engineeringPrinciples: null,
};
