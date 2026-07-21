import type { Agent } from '@leclabs/agent-forge/anatomy';
import { delegation as delegation_actions } from '../dimensions/actions/delegation.js';
import { fileOps as fileOps_actions } from '../dimensions/actions/file-ops.js';
import { maintenance as maintenance_audienceAdaptation } from '../dimensions/audience-adaptation/maintenance.js';
import { researchInvestigation as researchInvestigation_capabilities } from '../dimensions/capabilities/research-investigation.js';
import { technicalWriting as technicalWriting_capabilities } from '../dimensions/capabilities/technical-writing.js';
import { expansive as expansive_formality } from '../dimensions/formality/expansive.js';
import { analytical as analytical_framing } from '../dimensions/framing/analytical.js';
import { harmAvoidance as harmAvoidance_guardrails } from '../dimensions/guardrails/harm-avoidance.js';
import { helpfulness as helpfulness_guardrails } from '../dimensions/guardrails/helpfulness.js';
import { honesty as honesty_guardrails } from '../dimensions/guardrails/honesty.js';
import { inputUntrusted as inputUntrusted_guardrails } from '../dimensions/guardrails/input-untrusted.js';
import { recognition as recognition_heuristics } from '../dimensions/heuristics/recognition.js';
import { takeTheBest as takeTheBest_heuristics } from '../dimensions/heuristics/take-the-best.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../dimensions/learning/correction-consolidation.js';
import { faithfulRecord as faithfulRecord_objective } from '../dimensions/objective/faithful-record.js';
import { naturalLanguage as naturalLanguage_outputFormat } from '../dimensions/output-format/natural-language.js';
import { reflexion as reflexion_reasoningStrategy } from '../dimensions/reasoning-strategy/reflexion.js';
import { document as document_role } from '../dimensions/role/document.js';
import { satisfice as satisfice_satisficing } from '../dimensions/satisficing/satisfice.js';
import { selfCritique as selfCritique_selfEvaluation } from '../dimensions/self-evaluation/self-critique.js';
import { perception as perception_situationAwareness } from '../dimensions/situation-awareness/perception.js';
import { uncertaintyDisclosure as uncertaintyDisclosure_transparency } from '../dimensions/transparency/uncertainty-disclosure.js';
export const boz: Agent = {
  name: 'boz',
  description:
    "Use for a faithful, on-the-record chronicle of a subject (default: the Operator) — a biographical or decision record, never action on the subject's behalf.",
  archetype:
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
