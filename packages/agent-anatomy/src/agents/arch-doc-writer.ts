import type { ResolvedAgent } from '@leclabs/agent-forge/adapters/claude';
import type { Agent } from '@leclabs/agent-forge/anatomy';
import { delegation as delegation_actions } from '../organs/actions/delegation.js';
import { fileOps as fileOps_actions } from '../organs/actions/file-ops.js';
import { toolCall as toolCall_actions } from '../organs/actions/tool-call.js';
import { convergence as convergence_audienceAdaptation } from '../organs/audience-adaptation/convergence.js';
import { humanOnTheLoop as humanOnTheLoop_autonomy } from '../organs/autonomy/human-on-the-loop.js';
import { systemDesign as systemDesign_capabilities } from '../organs/capabilities/system-design.js';
import { technicalWriting as technicalWriting_capabilities } from '../organs/capabilities/technical-writing.js';
import { neutral as neutral_formality } from '../organs/formality/neutral.js';
import { systems as systems_framing } from '../organs/framing/systems.js';
import { harmAvoidance as harmAvoidance_guardrails } from '../organs/guardrails/harm-avoidance.js';
import { helpfulness as helpfulness_guardrails } from '../organs/guardrails/helpfulness.js';
import { honesty as honesty_guardrails } from '../organs/guardrails/honesty.js';
import { takeTheBest as takeTheBest_heuristics } from '../organs/heuristics/take-the-best.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../organs/learning/correction-consolidation.js';
import { longTermMemory as longTermMemory_memory } from '../organs/memory/long-term-memory.js';
import { text as text_modalities } from '../organs/modalities/text.js';
import { claude as claude_model } from '../organs/model/claude.js';
import { faithfulRecord as faithfulRecord_objective } from '../organs/objective/faithful-record.js';
import { document as document_outputFormat } from '../organs/output-format/document.js';
import { sage as sage_persona } from '../organs/persona/sage.js';
import { archDocWriterArchetypePink as archDocWriterArchetypePink_provenance } from '../organs/provenance/arch-doc-writer-archetype-pink.js';
import { react as react_reasoningStrategy } from '../organs/reasoning-strategy/react.js';
import { document as document_role } from '../organs/role/document.js';
import { satisfice as satisfice_satisficing } from '../organs/satisficing/satisfice.js';
import { acceptanceCriteriaCheck as acceptanceCriteriaCheck_selfEvaluation } from '../organs/self-evaluation/acceptance-criteria-check.js';
import { comprehension as comprehension_situationAwareness } from '../organs/situation-awareness/comprehension.js';
import { provenanceAttribution as provenanceAttribution_transparency } from '../organs/transparency/provenance-attribution.js';
import { userMessage as userMessage_trigger } from '../organs/trigger/user-message.js';
import { base } from './base.js';
export const archDocWriter: Agent = {
  ...base,
  name: 'arch-doc-writer',
  persona: sage_persona,
  role: document_role,
  formality: neutral_formality,
  audienceAdaptation: convergence_audienceAdaptation,
  transparency: provenanceAttribution_transparency,
  autonomy: humanOnTheLoop_autonomy,
  provenance: archDocWriterArchetypePink_provenance,
  objective: faithfulRecord_objective,
  guardrails: [
    harmAvoidance_guardrails,
    honesty_guardrails,
    helpfulness_guardrails,
  ],
  heuristics: [takeTheBest_heuristics],
  capabilities: [technicalWriting_capabilities, systemDesign_capabilities],
  learning: correctionConsolidation_learning,
  situationAwareness: comprehension_situationAwareness,
  actions: [fileOps_actions, toolCall_actions, delegation_actions],
  modalities: text_modalities,
  model: claude_model,
  memory: longTermMemory_memory,
  trigger: userMessage_trigger,
  framing: systems_framing,
  reasoningStrategy: react_reasoningStrategy,
  satisficing: satisfice_satisficing,
  outputFormat: document_outputFormat,
  selfEvaluation: acceptanceCriteriaCheck_selfEvaluation,
};
export const archDocWriterResolved: ResolvedAgent = {
  name: 'arch-doc-writer',
  description: sage_persona.definiens,
  mark: archDocWriterArchetypePink_provenance.mark,
  sourcePath: 'packages/agent-anatomy/agent/arch-doc-writer.md',
  memoryProtocol: base.memoryProtocol,
  organs: [
    ['Persona', [sage_persona]],
    ['Role', [document_role]],
    ['Formality', [neutral_formality]],
    ['Audience-Adaptation', [convergence_audienceAdaptation]],
    ['Transparency', [provenanceAttribution_transparency]],
    ['Autonomy', [humanOnTheLoop_autonomy]],
    ['Provenance', [archDocWriterArchetypePink_provenance]],
    ['Objective', [faithfulRecord_objective]],
    [
      'Guardrails',
      [harmAvoidance_guardrails, honesty_guardrails, helpfulness_guardrails],
    ],
    ['Heuristics', [takeTheBest_heuristics]],
    [
      'Capabilities',
      [technicalWriting_capabilities, systemDesign_capabilities],
    ],
    ['Learning', [correctionConsolidation_learning]],
    ['Situation-Awareness', [comprehension_situationAwareness]],
    ['Actions', [fileOps_actions, toolCall_actions, delegation_actions]],
    ['Modalities', [text_modalities]],
    ['Model', [claude_model]],
    ['Memory', [longTermMemory_memory]],
    ['Trigger', [userMessage_trigger]],
    ['Framing', [systems_framing]],
    ['Reasoning-Strategy', [react_reasoningStrategy]],
    ['Satisficing', [satisfice_satisficing]],
    ['Output-Format', [document_outputFormat]],
    ['Self-Evaluation', [acceptanceCriteriaCheck_selfEvaluation]],
  ],
};
