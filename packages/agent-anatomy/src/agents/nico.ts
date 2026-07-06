import type { ResolvedAgent } from '@leclabs/agent-forge/adapters/claude';
import type { Agent } from '@leclabs/agent-forge/anatomy';
import { delegation as delegation_actions } from '../organs/actions/delegation.js';
import { fileOps as fileOps_actions } from '../organs/actions/file-ops.js';
import { convergence as convergence_audienceAdaptation } from '../organs/audience-adaptation/convergence.js';
import { humanOnTheLoop as humanOnTheLoop_autonomy } from '../organs/autonomy/human-on-the-loop.js';
import { researchInvestigation as researchInvestigation_capabilities } from '../organs/capabilities/research-investigation.js';
import { systemDesign as systemDesign_capabilities } from '../organs/capabilities/system-design.js';
import { coldDecodeOracle as coldDecodeOracle_engineeringPrinciples } from '../organs/engineering-principles/cold-decode-oracle.js';
import { dry as dry_engineeringPrinciples } from '../organs/engineering-principles/dry.js';
import { firstPrinciples as firstPrinciples_engineeringPrinciples } from '../organs/engineering-principles/first-principles.js';
import { invokeTheCanonical as invokeTheCanonical_engineeringPrinciples } from '../organs/engineering-principles/invoke-the-canonical.js';
import { llmNative as llmNative_engineeringPrinciples } from '../organs/engineering-principles/llm-native.js';
import { mece as mece_engineeringPrinciples } from '../organs/engineering-principles/mece.js';
import { trustButVerify as trustButVerify_engineeringPrinciples } from '../organs/engineering-principles/trust-but-verify.js';
import { zeroTrust as zeroTrust_engineeringPrinciples } from '../organs/engineering-principles/zero-trust.js';
import { formal as formal_formality } from '../organs/formality/formal.js';
import { analytical as analytical_framing } from '../organs/framing/analytical.js';
import { harmAvoidance as harmAvoidance_guardrails } from '../organs/guardrails/harm-avoidance.js';
import { helpfulness as helpfulness_guardrails } from '../organs/guardrails/helpfulness.js';
import { honesty as honesty_guardrails } from '../organs/guardrails/honesty.js';
import { inputUntrusted as inputUntrusted_guardrails } from '../organs/guardrails/input-untrusted.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../organs/learning/correction-consolidation.js';
import { longTermMemory as longTermMemory_memory } from '../organs/memory/long-term-memory.js';
import { parsimony as parsimony_objective } from '../organs/objective/parsimony.js';
import { visualization as visualization_outputFormat } from '../organs/output-format/visualization.js';
import { sage as sage_persona } from '../organs/persona/sage.js';
import { nicoArchetypeCyan as nicoArchetypeCyan_provenance } from '../organs/provenance/nico-archetype-cyan.js';
import { react as react_reasoningStrategy } from '../organs/reasoning-strategy/react.js';
import { curate as curate_role } from '../organs/role/curate.js';
import { satisfice as satisfice_satisficing } from '../organs/satisficing/satisfice.js';
import { acceptanceCriteriaCheck as acceptanceCriteriaCheck_selfEvaluation } from '../organs/self-evaluation/acceptance-criteria-check.js';
import { projection as projection_situationAwareness } from '../organs/situation-awareness/projection.js';
import { decisionRationale as decisionRationale_transparency } from '../organs/transparency/decision-rationale.js';
import { principalIc } from '../organs/provenance/principal-ic.js';
import { base } from './base.js';
export const nico: Agent = {
  ...base,
  name: 'nico',
  persona: sage_persona,
  role: curate_role,
  formality: formal_formality,
  audienceAdaptation: convergence_audienceAdaptation,
  transparency: decisionRationale_transparency,
  autonomy: humanOnTheLoop_autonomy,
  provenance: [

  ],
  objective: parsimony_objective,
  engineeringPrinciples: [
    firstPrinciples_engineeringPrinciples,
    zeroTrust_engineeringPrinciples,
    dry_engineeringPrinciples,
    mece_engineeringPrinciples,
    llmNative_engineeringPrinciples,
    coldDecodeOracle_engineeringPrinciples,
    trustButVerify_engineeringPrinciples,
    invokeTheCanonical_engineeringPrinciples,
  ],
  guardrails: [
    harmAvoidance_guardrails,
    honesty_guardrails,
    helpfulness_guardrails,
    inputUntrusted_guardrails,
  ],
  capabilities: [researchInvestigation_capabilities, systemDesign_capabilities],
  learning: correctionConsolidation_learning,
  situationAwareness: projection_situationAwareness,
  actions: [fileOps_actions, delegation_actions],
  modalities: null,
  model: null,
  memory: longTermMemory_memory,
  trigger: null,
  framing: analytical_framing,
  reasoningStrategy: react_reasoningStrategy,
  satisficing: satisfice_satisficing,
  outputFormat: visualization_outputFormat,
  selfEvaluation: acceptanceCriteriaCheck_selfEvaluation,
  heuristics: null,
};
export const nicoResolved: ResolvedAgent = {
  name: 'nico',
  description: sage_persona.definiens,
  mark: nicoArchetypeCyan_provenance.mark,
  sourcePath: 'packages/agent-anatomy/agent/nico.md',
  memoryProtocol: base.memoryProtocol,
  personaProtocol: base.personaProtocol,
  organs: [
    ['Persona', [sage_persona]],
    ['Role', [curate_role]],
    ['Formality', [formal_formality]],
    ['Audience-Adaptation', [convergence_audienceAdaptation]],
    ['Transparency', [decisionRationale_transparency]],
    ['Autonomy', [humanOnTheLoop_autonomy]],
    ['Provenance', [nicoArchetypeCyan_provenance]],
    ['Objective', [parsimony_objective]],
    [
      'Engineering-Principles',
      [
        firstPrinciples_engineeringPrinciples,
        zeroTrust_engineeringPrinciples,
        dry_engineeringPrinciples,
        mece_engineeringPrinciples,
        llmNative_engineeringPrinciples,
        coldDecodeOracle_engineeringPrinciples,
        trustButVerify_engineeringPrinciples,
        invokeTheCanonical_engineeringPrinciples,
      ],
    ],
    [
      'Guardrails',
      [
        harmAvoidance_guardrails,
        honesty_guardrails,
        helpfulness_guardrails,
        inputUntrusted_guardrails,
      ],
    ],
    [
      'Capabilities',
      [researchInvestigation_capabilities, systemDesign_capabilities],
    ],
    ['Learning', [correctionConsolidation_learning]],
    ['Situation-Awareness', [projection_situationAwareness]],
    ['Actions', [fileOps_actions, delegation_actions]],
    ['Memory', [longTermMemory_memory]],
    ['Framing', [analytical_framing]],
    ['Reasoning-Strategy', [react_reasoningStrategy]],
    ['Satisficing', [satisfice_satisficing]],
    ['Output-Format', [visualization_outputFormat]],
    ['Self-Evaluation', [acceptanceCriteriaCheck_selfEvaluation]],
  ],
};
