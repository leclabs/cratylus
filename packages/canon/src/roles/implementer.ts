import { fileOps as fileOps_actions } from '../dimensions/actions/file-ops.js';
import { maintenance as maintenance_audienceAdaptation } from '../dimensions/audience-adaptation/maintenance.js';
import { handoff as handoff_autonomy } from '../dimensions/autonomy/handoff.js';
import { missionCommand } from '../dimensions/autonomy/mission-command.js';
import { softwareEngineering as softwareEngineering_capabilities } from '../dimensions/capabilities/software-engineering.js';
import { verificationTesting as verificationTesting_capabilities } from '../dimensions/capabilities/verification-testing.js';
import { cratylism as cratylism_engineeringPrinciples } from '../dimensions/engineering-principles/cratylism.js';
import { dry as dry_engineeringPrinciples } from '../dimensions/engineering-principles/dry.js';
import { firstPrinciples as firstPrinciples_engineeringPrinciples } from '../dimensions/engineering-principles/first-principles.js';
import { simplicity as simplicity_engineeringPrinciples } from '../dimensions/engineering-principles/simplicity.js';
import { plain as plain_formality } from '../dimensions/formality/plain.js';
import { correctnessOriented as correctnessOriented_framing } from '../dimensions/framing/correctness-oriented.js';
import { honesty as honesty_guardrails } from '../dimensions/guardrails/honesty.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../dimensions/learning/correction-consolidation.js';
import { correctness as correctness_objective } from '../dimensions/objective/correctness.js';
import { react as react_reasoningStrategy } from '../dimensions/reasoning-strategy/react.js';
import { implementer as implementer_role } from '../dimensions/role/implementer.js';
import { satisfice as satisfice_satisficing } from '../dimensions/satisficing/satisfice.js';
import { executableTestOracle as executableTestOracle_selfEvaluation } from '../dimensions/self-evaluation/executable-test-oracle.js';
import { perception as perception_situationAwareness } from '../dimensions/situation-awareness/perception.js';
import { limitationDisclosure as limitationDisclosure_transparency } from '../dimensions/transparency/limitation-disclosure.js';
import type { RoleCell } from './hold.js';

// THE BOTTOM RUNG, and the only one whose write layer is the substrate. It carries no
// workflow skill by design: a skill guides an agent through decisions it must make, and
// this position's decisions were made for it. It needs a unit of work, tools, and the
// discipline to stay inside the boundary.

export const implementerRole: RoleCell = {
  sign: implementer_role,
  vector: {
    formality: plain_formality,
    audienceAdaptation: maintenance_audienceAdaptation,
    // `limitation-disclosure`: this position's entire value to the layer above is an
    // honest account of what it could NOT establish. A clean report that hides an
    // unproven leg is worse than a failure, because it is acted on.
    transparency: limitationDisclosure_transparency,
    autonomy: [missionCommand, handoff_autonomy],
    objective: correctness_objective,
    engineeringPrinciples: [
      cratylism_engineeringPrinciples,
      firstPrinciples_engineeringPrinciples,
      simplicity_engineeringPrinciples,
      dry_engineeringPrinciples,
    ],
    guardrails: [honesty_guardrails],
    capabilities: [
      softwareEngineering_capabilities,
      verificationTesting_capabilities,
    ],
    actions: [fileOps_actions],
    learning: correctionConsolidation_learning,
    situationAwareness: perception_situationAwareness,
    framing: correctnessOriented_framing,
    reasoningStrategy: react_reasoningStrategy,
    // `satisfice`, and it is the one aspect that must not be `optimize` here.
    // Optimising past the spec IS the exceeding failure the contract names: this
    // position builds to the contract and stops.
    satisficing: satisfice_satisficing,
    // The oracle is the spec's own criteria, executed. That is verification, and it is
    // exactly right at this rung — it is only wrong when mistaken for validation.
    selfEvaluation: executableTestOracle_selfEvaluation,
  },
};
