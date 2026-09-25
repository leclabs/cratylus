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
import { contractor as contractor_role } from '../dimensions/role/contractor.js';
import { optimize as optimize_satisficing } from '../dimensions/satisficing/optimize.js';
import { executableTestOracle as executableTestOracle_selfEvaluation } from '../dimensions/self-evaluation/executable-test-oracle.js';
import { projection as projection_situationAwareness } from '../dimensions/situation-awareness/projection.js';
import { decisionRationale as decisionRationale_transparency } from '../dimensions/transparency/decision-rationale.js';
import type { RoleCell } from './hold.js';

// THE PARTY THAT TAKES THE JOB WHOLE — the rung that stands ON the substrate, and the
// only position in the corpus bounded from above rather than from below. It carries
// `principal-self` like the architect and `software-engineering` like the implementer,
// which is exactly what the two-role collapse used to hide: this is neither of them.
//
// `executable-test-oracle` is right here and wrong one rung up. This position's claim
// is that the thing WORKS, and a run is what settles that; the architect's claim is
// conformance to a design, which no suite can witness.
//
// `plan` AND NOT `deliver`, and the split follows from the contract rather than from
// taste. This position reserves `decompose ⟨own-work⟩` and `dispatch(executor)`, and
// `plan` is the corpus's one statement of how a decomposition is done correctly —
// census resolved by USE, footprints declared, waves with disjoint outputs. A principal
// dispatching waves without that discipline is the under-declared-footprint defect with
// nothing to catch it, so the apparatus carries load here.
//
// `deliver` is refused, and refused for the same reason `plan` is granted. Its spine is
// `validate` against C closing on `amend(C) ⇔ yield`, and `amend(C) ∉ remit` is this
// contract's defining clause. Handing the position an apparatus whose closing law it may
// not perform would make `ascent` standing equipment rather than a named defect.

export const contractorRole: RoleCell = {
  sign: contractor_role,
  skills: ['plan'],
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
