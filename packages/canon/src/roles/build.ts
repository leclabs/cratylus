import { maintenance as maintenance_audienceAdaptation } from '../dimensions/audience-adaptation/maintenance.js';
import { principalSelf } from '../dimensions/autonomy/decision-authority.js';
import { handoff as handoff_autonomy } from '../dimensions/autonomy/handoff.js';
import { humanOnTheLoop as humanOnTheLoop_autonomy } from '../dimensions/autonomy/human-on-the-loop.js';
import { missionCommand } from '../dimensions/autonomy/mission-command.js';
import { operationsDelivery as operationsDelivery_capabilities } from '../dimensions/capabilities/operations-delivery.js';
import { softwareEngineering as softwareEngineering_capabilities } from '../dimensions/capabilities/software-engineering.js';
import { cratylism as cratylism_engineeringPrinciples } from '../dimensions/engineering-principles/cratylism.js';
import { dry as dry_engineeringPrinciples } from '../dimensions/engineering-principles/dry.js';
import { firstPrinciples as firstPrinciples_engineeringPrinciples } from '../dimensions/engineering-principles/first-principles.js';
import { greenField as greenField_engineeringPrinciples } from '../dimensions/engineering-principles/green-field.js';
import { llmNative as llmNative_engineeringPrinciples } from '../dimensions/engineering-principles/llm-native.js';
import { mece as mece_engineeringPrinciples } from '../dimensions/engineering-principles/mece.js';
import { simplicity as simplicity_engineeringPrinciples } from '../dimensions/engineering-principles/simplicity.js';
import { plain as plain_formality } from '../dimensions/formality/plain.js';
import { goalDirected as goalDirected_framing } from '../dimensions/framing/goal-directed.js';
import { honesty as honesty_guardrails } from '../dimensions/guardrails/honesty.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../dimensions/learning/correction-consolidation.js';
import { delivery as delivery_objective } from '../dimensions/objective/delivery.js';
import { planAndSolve as planAndSolve_reasoningStrategy } from '../dimensions/reasoning-strategy/plan-and-solve.js';
import { build as build_role } from '../dimensions/role/build.js';
import { optimize as optimize_satisficing } from '../dimensions/satisficing/optimize.js';
import { executableTestOracle as executableTestOracle_selfEvaluation } from '../dimensions/self-evaluation/executable-test-oracle.js';
import { projection as projection_situationAwareness } from '../dimensions/situation-awareness/projection.js';
import { decisionRationale as decisionRationale_transparency } from '../dimensions/transparency/decision-rationale.js';
import type { RoleCell } from './hold.js';

// THE PRINCIPAL IC — the rung that stands ON the substrate, and the only position in
// the corpus bounded from above rather than from below. It carries `principal-self`
// like the architect and `software-engineering` like the implementer, which is exactly
// what the two-role collapse used to hide: this is neither of them.
//
// `executable-test-oracle` is right here and wrong one rung up. This position's claim
// is that the thing WORKS, and a run is what settles that; the architect's claim is
// conformance to a design, which no suite can witness.
//
// No workflow skill. The position's own contract is its method: it conceives, designs
// in the small, produces, integrates and ships, and the one thing it may not do is
// amend the durative design it is building against.

export const buildRole: RoleCell = {
  sign: build_role,
  vector: {
    formality: plain_formality,
    audienceAdaptation: maintenance_audienceAdaptation,
    transparency: decisionRationale_transparency,
    autonomy: [
      principalSelf,
      humanOnTheLoop_autonomy,
      missionCommand,
      handoff_autonomy,
    ],
    objective: delivery_objective,
    engineeringPrinciples: [
      cratylism_engineeringPrinciples,
      llmNative_engineeringPrinciples,
      firstPrinciples_engineeringPrinciples,
      greenField_engineeringPrinciples,
      simplicity_engineeringPrinciples,
      dry_engineeringPrinciples,
      mece_engineeringPrinciples,
    ],
    guardrails: [honesty_guardrails],
    capabilities: [
      softwareEngineering_capabilities,
      operationsDelivery_capabilities,
    ],
    learning: correctionConsolidation_learning,
    situationAwareness: projection_situationAwareness,
    framing: goalDirected_framing,
    reasoningStrategy: planAndSolve_reasoningStrategy,
    satisficing: optimize_satisficing,
    selfEvaluation: executableTestOracle_selfEvaluation,
  },
};
