import type { ResolvedAgent } from '@leclabs/agent-forge/adapters/claude';
import type { Agent } from '@leclabs/agent-forge/anatomy';
import { codeExecution as codeExecution_actions } from '../organs/actions/code-execution.js';
import { fileOps as fileOps_actions } from '../organs/actions/file-ops.js';
import { convergence as convergence_audienceAdaptation } from '../organs/audience-adaptation/convergence.js';
import { verificationTesting as verificationTesting_capabilities } from '../organs/capabilities/verification-testing.js';
import { formal as formal_formality } from '../organs/formality/formal.js';
import { correctnessOriented as correctnessOriented_framing } from '../organs/framing/correctness-oriented.js';
import { harmAvoidance as harmAvoidance_guardrails } from '../organs/guardrails/harm-avoidance.js';
import { helpfulness as helpfulness_guardrails } from '../organs/guardrails/helpfulness.js';
import { honesty as honesty_guardrails } from '../organs/guardrails/honesty.js';
import { inputUntrusted as inputUntrusted_guardrails } from '../organs/guardrails/input-untrusted.js';
import { takeTheBest as takeTheBest_heuristics } from '../organs/heuristics/take-the-best.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../organs/learning/correction-consolidation.js';
import { longTermMemory as longTermMemory_memory } from '../organs/memory/long-term-memory.js';
import { thoroughness as thoroughness_objective } from '../organs/objective/thoroughness.js';
import { structuredDecision as structuredDecision_outputFormat } from '../organs/output-format/structured-decision.js';
import { ruler as ruler_persona } from '../organs/persona/ruler.js';
import { testerArchetypePurple as testerArchetypePurple_provenance } from '../organs/provenance/tester-archetype-purple.js';
import { planAndSolve as planAndSolve_reasoningStrategy } from '../organs/reasoning-strategy/plan-and-solve.js';
import { test as test_role } from '../organs/role/test.js';
import { optimize as optimize_satisficing } from '../organs/satisficing/optimize.js';
import { executableTestOracle as executableTestOracle_selfEvaluation } from '../organs/self-evaluation/executable-test-oracle.js';
import { comprehension as comprehension_situationAwareness } from '../organs/situation-awareness/comprehension.js';
import { decisionRationale as decisionRationale_transparency } from '../organs/transparency/decision-rationale.js';
import { toolResult as toolResult_trigger } from '../organs/trigger/tool-result.js';
import { base } from './base.js';
export const tester: Agent = {
  ...base,
  name: 'tester',
  persona: ruler_persona,
  role: test_role,
  formality: formal_formality,
  audienceAdaptation: convergence_audienceAdaptation,
  transparency: decisionRationale_transparency,
  autonomy: null,
  provenance: testerArchetypePurple_provenance,
  objective: thoroughness_objective,
  guardrails: [
    harmAvoidance_guardrails,
    honesty_guardrails,
    helpfulness_guardrails,
    inputUntrusted_guardrails,
  ],
  capabilities: [verificationTesting_capabilities],
  heuristics: [takeTheBest_heuristics],
  learning: correctionConsolidation_learning,
  situationAwareness: comprehension_situationAwareness,
  actions: [codeExecution_actions, fileOps_actions],
  modalities: null,
  model: null,
  memory: longTermMemory_memory,
  trigger: toolResult_trigger,
  framing: correctnessOriented_framing,
  reasoningStrategy: planAndSolve_reasoningStrategy,
  satisficing: optimize_satisficing,
  outputFormat: structuredDecision_outputFormat,
  selfEvaluation: executableTestOracle_selfEvaluation,
  engineeringPrinciples: null,
};
export const testerResolved: ResolvedAgent = {
  name: 'tester',
  description: ruler_persona.definiens,
  mark: testerArchetypePurple_provenance.mark,
  sourcePath: 'packages/agent-anatomy/agent/tester.md',
  memoryProtocol: base.memoryProtocol,
  personaProtocol: base.personaProtocol,
  organs: [
    ['Persona', [ruler_persona]],
    ['Role', [test_role]],
    ['Formality', [formal_formality]],
    ['Audience-Adaptation', [convergence_audienceAdaptation]],
    ['Transparency', [decisionRationale_transparency]],
    ['Provenance', [testerArchetypePurple_provenance]],
    ['Objective', [thoroughness_objective]],
    [
      'Guardrails',
      [
        harmAvoidance_guardrails,
        honesty_guardrails,
        helpfulness_guardrails,
        inputUntrusted_guardrails,
      ],
    ],
    ['Capabilities', [verificationTesting_capabilities]],
    ['Heuristics', [takeTheBest_heuristics]],
    ['Learning', [correctionConsolidation_learning]],
    ['Situation-Awareness', [comprehension_situationAwareness]],
    ['Actions', [codeExecution_actions, fileOps_actions]],
    ['Memory', [longTermMemory_memory]],
    ['Trigger', [toolResult_trigger]],
    ['Framing', [correctnessOriented_framing]],
    ['Reasoning-Strategy', [planAndSolve_reasoningStrategy]],
    ['Satisficing', [optimize_satisficing]],
    ['Output-Format', [structuredDecision_outputFormat]],
    ['Self-Evaluation', [executableTestOracle_selfEvaluation]],
  ],
};
