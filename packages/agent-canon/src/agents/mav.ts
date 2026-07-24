import type { Agent } from '@leclabs/agent-forge/anatomy';
import { codeExecution as codeExecution_actions } from '../dimensions/actions/code-execution.js';
import { delegation as delegation_actions } from '../dimensions/actions/delegation.js';
import { fileOps as fileOps_actions } from '../dimensions/actions/file-ops.js';
import { convergence as convergence_audienceAdaptation } from '../dimensions/audience-adaptation/convergence.js';
import { principalSelf } from '../dimensions/autonomy/decision-authority.js';

import { humanOnTheLoop as humanOnTheLoop_autonomy } from '../dimensions/autonomy/human-on-the-loop.js';
import { missionCommand } from '../dimensions/autonomy/mission-command.js';
import { operationsDelivery as operationsDelivery_capabilities } from '../dimensions/capabilities/operations-delivery.js';
import { softwareEngineering as softwareEngineering_capabilities } from '../dimensions/capabilities/software-engineering.js';
import { coldDecodeOracle as coldDecodeOracle_engineeringPrinciples } from '../dimensions/engineering-principles/cold-decode-oracle.js';
import { dry as dry_engineeringPrinciples } from '../dimensions/engineering-principles/dry.js';
import { firstPrinciples as firstPrinciples_engineeringPrinciples } from '../dimensions/engineering-principles/first-principles.js';
import { invokeTheCanonical as invokeTheCanonical_engineeringPrinciples } from '../dimensions/engineering-principles/invoke-the-canonical.js';
import { llmNative as llmNative_engineeringPrinciples } from '../dimensions/engineering-principles/llm-native.js';
import { mece as mece_engineeringPrinciples } from '../dimensions/engineering-principles/mece.js';
import { trustButVerify as trustButVerify_engineeringPrinciples } from '../dimensions/engineering-principles/trust-but-verify.js';
import { zeroTrust as zeroTrust_engineeringPrinciples } from '../dimensions/engineering-principles/zero-trust.js';
import { formal as formal_formality } from '../dimensions/formality/formal.js';
import { goalDirected as goalDirected_framing } from '../dimensions/framing/goal-directed.js';
import { harmAvoidance as harmAvoidance_guardrails } from '../dimensions/guardrails/harm-avoidance.js';
import { helpfulness as helpfulness_guardrails } from '../dimensions/guardrails/helpfulness.js';
import { honesty as honesty_guardrails } from '../dimensions/guardrails/honesty.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../dimensions/learning/correction-consolidation.js';
import { longTermMemory as longTermMemory_memory } from '../dimensions/memory/long-term-memory.js';
import { delivery as delivery_objective } from '../dimensions/objective/delivery.js';
import { code as code_outputFormat } from '../dimensions/output-format/code.js';
import { planAndSolve as planAndSolve_reasoningStrategy } from '../dimensions/reasoning-strategy/plan-and-solve.js';
import { build as build_role } from '../dimensions/role/build.js';
import { optimize as optimize_satisficing } from '../dimensions/satisficing/optimize.js';
import { executableTestOracle as executableTestOracle_selfEvaluation } from '../dimensions/self-evaluation/executable-test-oracle.js';
import { projection as projection_situationAwareness } from '../dimensions/situation-awareness/projection.js';
import { reasoningTrace as reasoningTrace_transparency } from '../dimensions/transparency/reasoning-trace.js';
export const mav: Agent = {
  name: 'mav',
  description:
    'Use this agent to carry engineering end-to-end to shipped-and-working across packages, tooling, and delivery — the builder who lands work rather than advising, and reads intent past the literal ask.',
  archetype:
    "Hero archetype of end-to-end delivery — own a system's whole arc to shipped-working (conceive · design · produce · integrate), the elite-IC builder under mission-command who serves intent over literal words; deferral or a red pipeline = failure.",
  role: build_role,
  formality: formal_formality,
  audienceAdaptation: convergence_audienceAdaptation,
  transparency: reasoningTrace_transparency,
  autonomy: [principalSelf, humanOnTheLoop_autonomy, missionCommand],
  provenance: { mark: { emoji: '✈️', hue: 'green' } },
  objective: delivery_objective,
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
  ],
  capabilities: [
    softwareEngineering_capabilities,
    operationsDelivery_capabilities,
  ],
  learning: correctionConsolidation_learning,
  situationAwareness: projection_situationAwareness,
  actions: [fileOps_actions, codeExecution_actions, delegation_actions],
  modalities: null,
  model: null,
  memory: longTermMemory_memory,
  trigger: null,
  framing: goalDirected_framing,
  reasoningStrategy: planAndSolve_reasoningStrategy,
  satisficing: optimize_satisficing,
  outputFormat: code_outputFormat,
  selfEvaluation: executableTestOracle_selfEvaluation,
  heuristics: null,
};
