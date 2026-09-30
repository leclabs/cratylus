import { fileOps as fileOps_actions } from '../dimensions/actions/file-ops.js';
import { maintenance as maintenance_audienceAdaptation } from '../dimensions/audience-adaptation/maintenance.js';
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
// discipline to stay inside the boundary: its unit is built in its own isolated worktree
// off the plan's line, and while the plan is bound it never commits on main.
//
// `note` and nothing else, because what it could not prove and any finding beside the
// path leave it as a note, and `note` composes nothing, so the implementer still never
// receives `design`. Its one plan read, `cratylus plan show <unit> --plan <plan>`, and its
// one plan write, `cratylus plan land …` recording each commit that holds the unit, are
// stated in the role sign rather than by `plan`, which composes `design`.

export const implementerRole: RoleCell = {
  sign: implementer_role,
  skills: ['note'],
  vector: {
    formality: plain_formality,
    audienceAdaptation: maintenance_audienceAdaptation,
    // `limitation-disclosure`, and its channel is a NOTE. What this position could not
    // establish is owed to the design, and the design takes a delegate's finding as a
    // note; the return is a name with no account, and the unit is judged on the
    // assayer's verdict, never on anything said about the work. An unproven leg left
    // out of every note is the hazard: the unit is accepted on a reader's verdict
    // without anyone having been told the leg was open.
    transparency: limitationDisclosure_transparency,
    // `mission-command` alone. `handoff` shapes a report that leads with its evidence and
    // ends on the operator's action items, and this position hands up a name, not a report.
    autonomy: [missionCommand],
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
