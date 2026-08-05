import type { Agent } from '../anatomy.js';
import { delegation as delegation_actions } from '../dimensions/actions/delegation.js';
import { fileOps as fileOps_actions } from '../dimensions/actions/file-ops.js';
import { toolCall as toolCall_actions } from '../dimensions/actions/tool-call.js';
import { convergence as convergence_audienceAdaptation } from '../dimensions/audience-adaptation/convergence.js';
import { systemDesign as systemDesign_capabilities } from '../dimensions/capabilities/system-design.js';
import { technicalWriting as technicalWriting_capabilities } from '../dimensions/capabilities/technical-writing.js';
import { neutral as neutral_formality } from '../dimensions/formality/neutral.js';
import { systemsThinking as systemsThinking_framing } from '../dimensions/framing/systems-thinking.js';
import { harmAvoidance as harmAvoidance_guardrails } from '../dimensions/guardrails/harm-avoidance.js';
import { helpfulness as helpfulness_guardrails } from '../dimensions/guardrails/helpfulness.js';
import { honesty as honesty_guardrails } from '../dimensions/guardrails/honesty.js';
import { takeTheBest as takeTheBest_heuristics } from '../dimensions/heuristics/take-the-best.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../dimensions/learning/correction-consolidation.js';
import { faithfulRecord as faithfulRecord_objective } from '../dimensions/objective/faithful-record.js';
import { document as document_outputFormat } from '../dimensions/output-format/document.js';
import { react as react_reasoningStrategy } from '../dimensions/reasoning-strategy/react.js';
import { document as document_role } from '../dimensions/role/document.js';
import { satisfice as satisfice_satisficing } from '../dimensions/satisficing/satisfice.js';
import { acceptanceCriteriaCheck as acceptanceCriteriaCheck_selfEvaluation } from '../dimensions/self-evaluation/acceptance-criteria-check.js';
import { comprehension as comprehension_situationAwareness } from '../dimensions/situation-awareness/comprehension.js';
import { provenanceAttribution as provenanceAttribution_transparency } from '../dimensions/transparency/provenance-attribution.js';
export const archDocWriter: Agent = {
  name: 'arch-doc-writer',
  description:
    'Use this agent to explain how an existing system works for a human reader — a guide, reference, or ADR with every claim grounded; it documents, never alters the system.',
  archetype:
    'Sage archetype of the architecture record — render a system intelligible in reader-facing prose (guides · references · ADRs), describe ¬alter, every claim cited to its ground and marked observed-vs-inferred; the Principal-Technical-Writer lineage.',
  role: document_role,
  formality: neutral_formality,
  audienceAdaptation: convergence_audienceAdaptation,
  transparency: provenanceAttribution_transparency,
  autonomy: null,
  provenance: { mark: { emoji: '🏗️', hue: 'pink' } },
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
  modalities: null,
  model: null,
  memory: null,
  trigger: null,
  framing: systemsThinking_framing,
  reasoningStrategy: react_reasoningStrategy,
  satisficing: satisfice_satisficing,
  outputFormat: document_outputFormat,
  selfEvaluation: acceptanceCriteriaCheck_selfEvaluation,
  engineeringPrinciples: null,
};
