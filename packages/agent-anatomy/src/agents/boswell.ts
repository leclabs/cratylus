import type { ResolvedAgent } from '@leclabs/agent-forge/adapters/claude';
import type { Agent } from '@leclabs/agent-forge/anatomy';
import { delegation as delegation_actions } from '../organs/actions/delegation.js';
import { fileOps as fileOps_actions } from '../organs/actions/file-ops.js';
import { maintenance as maintenance_audienceAdaptation } from '../organs/audience-adaptation/maintenance.js';
import { humanOnTheLoop as humanOnTheLoop_autonomy } from '../organs/autonomy/human-on-the-loop.js';
import { researchInvestigation as researchInvestigation_capabilities } from '../organs/capabilities/research-investigation.js';
import { technicalWriting as technicalWriting_capabilities } from '../organs/capabilities/technical-writing.js';
import { formal as formal_formality } from '../organs/formality/formal.js';
import { analytical as analytical_framing } from '../organs/framing/analytical.js';
import { harmAvoidance as harmAvoidance_guardrails } from '../organs/guardrails/harm-avoidance.js';
import { helpfulness as helpfulness_guardrails } from '../organs/guardrails/helpfulness.js';
import { honesty as honesty_guardrails } from '../organs/guardrails/honesty.js';
import { inputUntrusted as inputUntrusted_guardrails } from '../organs/guardrails/input-untrusted.js';
import { recognition as recognition_heuristics } from '../organs/heuristics/recognition.js';
import { takeTheBest as takeTheBest_heuristics } from '../organs/heuristics/take-the-best.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../organs/learning/correction-consolidation.js';
import { longTermMemory as longTermMemory_memory } from '../organs/memory/long-term-memory.js';
import { text as text_modalities } from '../organs/modalities/text.js';
import { claude as claude_model } from '../organs/model/claude.js';
import { faithfulRecord as faithfulRecord_objective } from '../organs/objective/faithful-record.js';
import { naturalLanguage as naturalLanguage_outputFormat } from '../organs/output-format/natural-language.js';
import { sage as sage_persona } from '../organs/persona/sage.js';
import { boswellArchetypeYellow as boswellArchetypeYellow_provenance } from '../organs/provenance/boswell-archetype-yellow.js';
import { reflexion as reflexion_reasoningStrategy } from '../organs/reasoning-strategy/reflexion.js';
import { document as document_role } from '../organs/role/document.js';
import { satisfice as satisfice_satisficing } from '../organs/satisficing/satisfice.js';
import { selfCritique as selfCritique_selfEvaluation } from '../organs/self-evaluation/self-critique.js';
import { perception as perception_situationAwareness } from '../organs/situation-awareness/perception.js';
import { uncertaintyDisclosure as uncertaintyDisclosure_transparency } from '../organs/transparency/uncertainty-disclosure.js';
import { userMessage as userMessage_trigger } from '../organs/trigger/user-message.js';
import { base } from './base.js';
export const boswell: Agent = {
  ...base,
  name: 'boswell',
  persona: sage_persona,
  role: document_role,
  formality: formal_formality,
  audienceAdaptation: maintenance_audienceAdaptation,
  transparency: uncertaintyDisclosure_transparency,
  autonomy: humanOnTheLoop_autonomy,
  provenance: boswellArchetypeYellow_provenance,
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
  modalities: text_modalities,
  model: claude_model,
  memory: longTermMemory_memory,
  trigger: userMessage_trigger,
  framing: analytical_framing,
  reasoningStrategy: reflexion_reasoningStrategy,
  satisficing: satisfice_satisficing,
  outputFormat: naturalLanguage_outputFormat,
  selfEvaluation: selfCritique_selfEvaluation,
};
export const boswellResolved: ResolvedAgent = {
  name: 'boswell',
  description: sage_persona.definiens,
  mark: boswellArchetypeYellow_provenance.mark,
  sourcePath: 'packages/agent-anatomy/agent/boswell.md',
  memoryProtocol: base.memoryProtocol,
  personaProtocol: base.personaProtocol,
  organs: [
    ['Persona', [sage_persona]],
    ['Role', [document_role]],
    ['Formality', [formal_formality]],
    ['Audience-Adaptation', [maintenance_audienceAdaptation]],
    ['Transparency', [uncertaintyDisclosure_transparency]],
    ['Autonomy', [humanOnTheLoop_autonomy]],
    ['Provenance', [boswellArchetypeYellow_provenance]],
    ['Objective', [faithfulRecord_objective]],
    [
      'Guardrails',
      [
        harmAvoidance_guardrails,
        honesty_guardrails,
        helpfulness_guardrails,
        inputUntrusted_guardrails,
      ],
    ],
    ['Heuristics', [recognition_heuristics, takeTheBest_heuristics]],
    [
      'Capabilities',
      [technicalWriting_capabilities, researchInvestigation_capabilities],
    ],
    ['Learning', [correctionConsolidation_learning]],
    ['Situation-Awareness', [perception_situationAwareness]],
    ['Actions', [fileOps_actions, delegation_actions]],
    ['Modalities', [text_modalities]],
    ['Model', [claude_model]],
    ['Memory', [longTermMemory_memory]],
    ['Trigger', [userMessage_trigger]],
    ['Framing', [analytical_framing]],
    ['Reasoning-Strategy', [reflexion_reasoningStrategy]],
    ['Satisficing', [satisfice_satisficing]],
    ['Output-Format', [naturalLanguage_outputFormat]],
    ['Self-Evaluation', [selfCritique_selfEvaluation]],
  ],
};
