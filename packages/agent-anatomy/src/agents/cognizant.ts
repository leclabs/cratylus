import type { ResolvedAgent } from '@leclabs/agent-forge/adapters/claude';
import type { Agent } from '@leclabs/agent-forge/anatomy';
import { communication as communication_actions } from '../organs/actions/communication.js';
import { retrieval as retrieval_actions } from '../organs/actions/retrieval.js';
import { convergence as convergence_audienceAdaptation } from '../organs/audience-adaptation/convergence.js';
import { analysisDiagnosis as analysisDiagnosis_capabilities } from '../organs/capabilities/analysis-diagnosis.js';
import { formal as formal_formality } from '../organs/formality/formal.js';
import { diagnostic as diagnostic_framing } from '../organs/framing/diagnostic.js';
import { harmAvoidance as harmAvoidance_guardrails } from '../organs/guardrails/harm-avoidance.js';
import { helpfulness as helpfulness_guardrails } from '../organs/guardrails/helpfulness.js';
import { honesty as honesty_guardrails } from '../organs/guardrails/honesty.js';
import { scopeOfAuthority as scopeOfAuthority_guardrails } from '../organs/guardrails/scope-of-authority.js';
import { takeTheBest as takeTheBest_heuristics } from '../organs/heuristics/take-the-best.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../organs/learning/correction-consolidation.js';
import { longTermMemory as longTermMemory_memory } from '../organs/memory/long-term-memory.js';
import { insight as insight_objective } from '../organs/objective/insight.js';
import { structuredData as structuredData_outputFormat } from '../organs/output-format/structured-data.js';
import { magician as magician_persona } from '../organs/persona/magician.js';
import { diagnosticDelegateOfPolisCyan as diagnosticDelegateOfPolisCyan_provenance } from '../organs/provenance/diagnostic-delegate-of-polis-cyan.js';
import { react as react_reasoningStrategy } from '../organs/reasoning-strategy/react.js';
import { diagnose as diagnose_role } from '../organs/role/diagnose.js';
import { satisfice as satisfice_satisficing } from '../organs/satisficing/satisfice.js';
import { selfCritique as selfCritique_selfEvaluation } from '../organs/self-evaluation/self-critique.js';
import { comprehension as comprehension_situationAwareness } from '../organs/situation-awareness/comprehension.js';
import { provenanceAttribution as provenanceAttribution_transparency } from '../organs/transparency/provenance-attribution.js';
import { introspectionRequest as introspectionRequest_trigger } from '../organs/trigger/introspection-request.js';
import { base } from './base.js';
export const cognizant: Agent = {
  ...base,
  name: 'cognizant',
  persona: magician_persona,
  role: diagnose_role,
  formality: formal_formality,
  audienceAdaptation: convergence_audienceAdaptation,
  transparency: provenanceAttribution_transparency,
  autonomy: null,
  provenance: diagnosticDelegateOfPolisCyan_provenance,
  objective: insight_objective,
  guardrails: [
    harmAvoidance_guardrails,
    honesty_guardrails,
    helpfulness_guardrails,
    scopeOfAuthority_guardrails,
  ],
  heuristics: [takeTheBest_heuristics],
  capabilities: [analysisDiagnosis_capabilities],
  learning: correctionConsolidation_learning,
  situationAwareness: comprehension_situationAwareness,
  actions: [retrieval_actions, communication_actions],
  modalities: null,
  model: null,
  memory: longTermMemory_memory,
  trigger: introspectionRequest_trigger,
  framing: diagnostic_framing,
  reasoningStrategy: react_reasoningStrategy,
  satisficing: satisfice_satisficing,
  outputFormat: structuredData_outputFormat,
  selfEvaluation: selfCritique_selfEvaluation,
  engineeringPrinciples: null,
};
export const cognizantResolved: ResolvedAgent = {
  name: 'cognizant',
  description: magician_persona.definiens,
  mark: diagnosticDelegateOfPolisCyan_provenance.mark,
  sourcePath: 'packages/agent-anatomy/agent/cognizant.md',
  memoryProtocol: base.memoryProtocol,
  personaProtocol: base.personaProtocol,
  organs: [
    ['Persona', [magician_persona]],
    ['Role', [diagnose_role]],
    ['Formality', [formal_formality]],
    ['Audience-Adaptation', [convergence_audienceAdaptation]],
    ['Transparency', [provenanceAttribution_transparency]],
    ['Provenance', [diagnosticDelegateOfPolisCyan_provenance]],
    ['Objective', [insight_objective]],
    [
      'Guardrails',
      [
        harmAvoidance_guardrails,
        honesty_guardrails,
        helpfulness_guardrails,
        scopeOfAuthority_guardrails,
      ],
    ],
    ['Heuristics', [takeTheBest_heuristics]],
    ['Capabilities', [analysisDiagnosis_capabilities]],
    ['Learning', [correctionConsolidation_learning]],
    ['Situation-Awareness', [comprehension_situationAwareness]],
    ['Actions', [retrieval_actions, communication_actions]],
    ['Memory', [longTermMemory_memory]],
    ['Trigger', [introspectionRequest_trigger]],
    ['Framing', [diagnostic_framing]],
    ['Reasoning-Strategy', [react_reasoningStrategy]],
    ['Satisficing', [satisfice_satisficing]],
    ['Output-Format', [structuredData_outputFormat]],
    ['Self-Evaluation', [selfCritique_selfEvaluation]],
  ],
};
