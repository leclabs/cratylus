import type { ResolvedAgent } from '@leclabs/agent-forge/adapters/claude';
import type { Agent } from '@leclabs/agent-forge/anatomy';
import { codeExecution as codeExecution_actions } from '../organs/actions/code-execution.js';
import { delegation as delegation_actions } from '../organs/actions/delegation.js';
import { fileOps as fileOps_actions } from '../organs/actions/file-ops.js';
import { convergence as convergence_audienceAdaptation } from '../organs/audience-adaptation/convergence.js';
import { humanOnTheLoop as humanOnTheLoop_autonomy } from '../organs/autonomy/human-on-the-loop.js';
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
import { longTermMemory as longTermMemory_memory } from '../organs/memory/long-term-memory.js';
import { text as text_modalities } from '../organs/modalities/text.js';
import { claude as claude_model } from '../organs/model/claude.js';
import { insight as insight_objective } from '../organs/objective/insight.js';
import { naturalLanguage as naturalLanguage_outputFormat } from '../organs/output-format/natural-language.js';
import { sage as sage_persona } from '../organs/persona/sage.js';
import { investigatorArchetypePurple as investigatorArchetypePurple_provenance } from '../organs/provenance/investigator-archetype-purple.js';
import { reflexion as reflexion_reasoningStrategy } from '../organs/reasoning-strategy/reflexion.js';
import { diagnose as diagnose_role } from '../organs/role/diagnose.js';
import { optimize as optimize_satisficing } from '../organs/satisficing/optimize.js';
import { selfCritique as selfCritique_selfEvaluation } from '../organs/self-evaluation/self-critique.js';
import { comprehension as comprehension_situationAwareness } from '../organs/situation-awareness/comprehension.js';
import { reasoningTrace as reasoningTrace_transparency } from '../organs/transparency/reasoning-trace.js';
import { userMessage as userMessage_trigger } from '../organs/trigger/user-message.js';
import { base } from './base.js';
export const investigator: Agent = {
  ...base,
  name: 'investigator',
  persona: sage_persona,
  role: diagnose_role,
  formality: formal_formality,
  audienceAdaptation: convergence_audienceAdaptation,
  transparency: reasoningTrace_transparency,
  autonomy: humanOnTheLoop_autonomy,
  provenance: investigatorArchetypePurple_provenance,
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
  modalities: text_modalities,
  model: claude_model,
  memory: longTermMemory_memory,
  trigger: userMessage_trigger,
  framing: diagnostic_framing,
  reasoningStrategy: reflexion_reasoningStrategy,
  satisficing: optimize_satisficing,
  outputFormat: naturalLanguage_outputFormat,
  selfEvaluation: selfCritique_selfEvaluation,
};
export const investigatorResolved: ResolvedAgent = {
  name: 'investigator',
  description: sage_persona.definiens,
  mark: investigatorArchetypePurple_provenance.mark,
  sourcePath: 'packages/agent-anatomy/agent/investigator.md',
  memoryProtocol: base.memoryProtocol,
  organs: [
    ['Persona', [sage_persona]],
    ['Role', [diagnose_role]],
    ['Formality', [formal_formality]],
    ['Audience-Adaptation', [convergence_audienceAdaptation]],
    ['Transparency', [reasoningTrace_transparency]],
    ['Autonomy', [humanOnTheLoop_autonomy]],
    ['Provenance', [investigatorArchetypePurple_provenance]],
    ['Objective', [insight_objective]],
    [
      'Guardrails',
      [
        harmAvoidance_guardrails,
        honesty_guardrails,
        helpfulness_guardrails,
        inputUntrusted_guardrails,
      ],
    ],
    ['Heuristics', [takeTheBest_heuristics]],
    [
      'Capabilities',
      [analysisDiagnosis_capabilities, researchInvestigation_capabilities],
    ],
    ['Learning', [correctionConsolidation_learning]],
    ['Situation-Awareness', [comprehension_situationAwareness]],
    ['Actions', [codeExecution_actions, fileOps_actions, delegation_actions]],
    ['Modalities', [text_modalities]],
    ['Model', [claude_model]],
    ['Memory', [longTermMemory_memory]],
    ['Trigger', [userMessage_trigger]],
    ['Framing', [diagnostic_framing]],
    ['Reasoning-Strategy', [reflexion_reasoningStrategy]],
    ['Satisficing', [optimize_satisficing]],
    ['Output-Format', [naturalLanguage_outputFormat]],
    ['Self-Evaluation', [selfCritique_selfEvaluation]],
  ],
};
