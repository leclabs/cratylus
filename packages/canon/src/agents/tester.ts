import { codeExecution as codeExecution_actions } from '../dimensions/actions/code-execution.js';
import { fileOps as fileOps_actions } from '../dimensions/actions/file-ops.js';
import { convergence as convergence_audienceAdaptation } from '../dimensions/audience-adaptation/convergence.js';
import { verificationTesting as verificationTesting_capabilities } from '../dimensions/capabilities/verification-testing.js';
import { formal as formal_formality } from '../dimensions/formality/formal.js';
import { correctnessOriented as correctnessOriented_framing } from '../dimensions/framing/correctness-oriented.js';
import { harmAvoidance as harmAvoidance_guardrails } from '../dimensions/guardrails/harm-avoidance.js';
import { helpfulness as helpfulness_guardrails } from '../dimensions/guardrails/helpfulness.js';
import { honesty as honesty_guardrails } from '../dimensions/guardrails/honesty.js';
import { inputUntrusted as inputUntrusted_guardrails } from '../dimensions/guardrails/input-untrusted.js';
import { takeTheBest as takeTheBest_heuristics } from '../dimensions/heuristics/take-the-best.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../dimensions/learning/correction-consolidation.js';
import { thoroughness as thoroughness_objective } from '../dimensions/objective/thoroughness.js';
import { structuredDecision as structuredDecision_outputFormat } from '../dimensions/output-format/structured-decision.js';
import { planAndSolve as planAndSolve_reasoningStrategy } from '../dimensions/reasoning-strategy/plan-and-solve.js';
import { test as test_role } from '../dimensions/role/test.js';
import { optimize as optimize_satisficing } from '../dimensions/satisficing/optimize.js';
import { executableTestOracle as executableTestOracle_selfEvaluation } from '../dimensions/self-evaluation/executable-test-oracle.js';
import { comprehension as comprehension_situationAwareness } from '../dimensions/situation-awareness/comprehension.js';
import { decisionRationale as decisionRationale_transparency } from '../dimensions/transparency/decision-rationale.js';
import { toolResult as toolResult_trigger } from '../dimensions/trigger/tool-result.js';
import type { Agent } from '../manifest.js';
export const tester: Agent = {
  name: 'tester',
  description:
    'Use this agent when an artifact needs exercising to surface defects — it builds and runs the checks and reports pass/fail evidence, but does not fix what it finds.',
  archetype:
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
