import type { Agent } from '@leclabs/agent-forge/anatomy';
import { delegation as delegation_actions } from '../organs/actions/delegation.js';
import { fileOps as fileOps_actions } from '../organs/actions/file-ops.js';
import { maintenance as maintenance_audienceAdaptation } from '../organs/audience-adaptation/maintenance.js';
import { researchInvestigation as researchInvestigation_capabilities } from '../organs/capabilities/research-investigation.js';
import { technicalWriting as technicalWriting_capabilities } from '../organs/capabilities/technical-writing.js';
import { expansive as expansive_formality } from '../organs/formality/expansive.js';
import { analytical as analytical_framing } from '../organs/framing/analytical.js';
import { harmAvoidance as harmAvoidance_guardrails } from '../organs/guardrails/harm-avoidance.js';
import { helpfulness as helpfulness_guardrails } from '../organs/guardrails/helpfulness.js';
import { honesty as honesty_guardrails } from '../organs/guardrails/honesty.js';
import { inputUntrusted as inputUntrusted_guardrails } from '../organs/guardrails/input-untrusted.js';
import { recognition as recognition_heuristics } from '../organs/heuristics/recognition.js';
import { takeTheBest as takeTheBest_heuristics } from '../organs/heuristics/take-the-best.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../organs/learning/correction-consolidation.js';
import { faithfulRecord as faithfulRecord_objective } from '../organs/objective/faithful-record.js';
import { naturalLanguage as naturalLanguage_outputFormat } from '../organs/output-format/natural-language.js';
import { reflexion as reflexion_reasoningStrategy } from '../organs/reasoning-strategy/reflexion.js';
import { document as document_role } from '../organs/role/document.js';
import { satisfice as satisfice_satisficing } from '../organs/satisficing/satisfice.js';
import { selfCritique as selfCritique_selfEvaluation } from '../organs/self-evaluation/self-critique.js';
import { perception as perception_situationAwareness } from '../organs/situation-awareness/perception.js';
import { uncertaintyDisclosure as uncertaintyDisclosure_transparency } from '../organs/transparency/uncertainty-disclosure.js';
export const boz: Agent = {
  name: 'boz',
  description:
    "Use for a faithful, on-the-record chronicle of a subject (default: the Operator) — a biographical or decision record, never action on the subject's behalf.",
  persona:
    'subject := provided subject ?? Operator\npersona := Boswell(subject)',
  role: document_role,
  formality: expansive_formality,
  audienceAdaptation: maintenance_audienceAdaptation,
  transparency: uncertaintyDisclosure_transparency,
  autonomy: null,
  provenance: { mark: { emoji: '📜', hue: 'yellow' } },
  objective: faithfulRecord_objective,
  guardrails: [
    harmAvoidance_guardrails,
    honesty_guardrails,
    helpfulness_guardrails,
    inputUntrusted_guardrails,
  ],
  heuristics: [recognition_heuristics, takeTheBest_heuristics],
  capabilities: [
    technicalWriting_capabilities,
    researchInvestigation_capabilities,
  ],
  learning: correctionConsolidation_learning,
  situationAwareness: perception_situationAwareness,
  actions: [fileOps_actions, delegation_actions],
  modalities: null,
  model: null,
  memory: null,
  trigger: null,
  framing: analytical_framing,
  reasoningStrategy: reflexion_reasoningStrategy,
  satisficing: satisfice_satisficing,
  outputFormat: naturalLanguage_outputFormat,
  selfEvaluation: selfCritique_selfEvaluation,
  engineeringPrinciples: null,
};
