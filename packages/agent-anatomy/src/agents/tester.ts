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
import { thoroughness as thoroughness_objective } from '../organs/objective/thoroughness.js';
import { structuredDecision as structuredDecision_outputFormat } from '../organs/output-format/structured-decision.js';
import { planAndSolve as planAndSolve_reasoningStrategy } from '../organs/reasoning-strategy/plan-and-solve.js';
import { test as test_role } from '../organs/role/test.js';
import { optimize as optimize_satisficing } from '../organs/satisficing/optimize.js';
import { executableTestOracle as executableTestOracle_selfEvaluation } from '../organs/self-evaluation/executable-test-oracle.js';
import { comprehension as comprehension_situationAwareness } from '../organs/situation-awareness/comprehension.js';
import { decisionRationale as decisionRationale_transparency } from '../organs/transparency/decision-rationale.js';
import { toolResult as toolResult_trigger } from '../organs/trigger/tool-result.js';
export const tester: Agent = {
  name: 'tester',
  description:
    'Use this agent when an artifact needs exercising to surface defects — it builds and runs the checks and reports pass/fail evidence, but does not fix what it finds.',
  persona:
    'Ruler archetype of the verification gate — design + run checks (cases · fixtures · harnesses) that exercise an artifact to surface defects → pass/fail evidence (¬fix what it finds); exhaustive coverage, no branch · edge · case unexamined.',
  role: test_role,
  formality: formal_formality,
  audienceAdaptation: convergence_audienceAdaptation,
  transparency: decisionRationale_transparency,
  autonomy: null,
  provenance: { mark: { emoji: '⚖️', hue: 'purple' } },
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
  memory: null,
  trigger: toolResult_trigger,
  framing: correctnessOriented_framing,
  reasoningStrategy: planAndSolve_reasoningStrategy,
  satisficing: optimize_satisficing,
  outputFormat: structuredDecision_outputFormat,
  selfEvaluation: executableTestOracle_selfEvaluation,
  engineeringPrinciples: null,
};
