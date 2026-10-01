import { delegation as delegation_actions } from '../dimensions/actions/delegation.js';
import { convergence as convergence_audienceAdaptation } from '../dimensions/audience-adaptation/convergence.js';
import { principalSelf } from '../dimensions/autonomy/decision-authority.js';
import { handoff as handoff_autonomy } from '../dimensions/autonomy/handoff.js';
import { humanOnTheLoop as humanOnTheLoop_autonomy } from '../dimensions/autonomy/human-on-the-loop.js';
import { missionCommand } from '../dimensions/autonomy/mission-command.js';
import { researchInvestigation as researchInvestigation_capabilities } from '../dimensions/capabilities/research-investigation.js';
import { systemDesign as systemDesign_capabilities } from '../dimensions/capabilities/system-design.js';
import { cratylism as cratylism_engineeringPrinciples } from '../dimensions/engineering-principles/cratylism.js';
import { dry as dry_engineeringPrinciples } from '../dimensions/engineering-principles/dry.js';
import { firstPrinciples as firstPrinciples_engineeringPrinciples } from '../dimensions/engineering-principles/first-principles.js';
import { greenField as greenField_engineeringPrinciples } from '../dimensions/engineering-principles/green-field.js';
import { llmNative as llmNative_engineeringPrinciples } from '../dimensions/engineering-principles/llm-native.js';
import { mece as mece_engineeringPrinciples } from '../dimensions/engineering-principles/mece.js';
import { separationOfConcerns as separationOfConcerns_engineeringPrinciples } from '../dimensions/engineering-principles/separation-of-concerns.js';
import { simplicity as simplicity_engineeringPrinciples } from '../dimensions/engineering-principles/simplicity.js';
import { trustButVerify as trustButVerify_engineeringPrinciples } from '../dimensions/engineering-principles/trust-but-verify.js';
import { plain as plain_formality } from '../dimensions/formality/plain.js';
import { systemsThinking as systemsThinking_framing } from '../dimensions/framing/systems-thinking.js';
import { honesty as honesty_guardrails } from '../dimensions/guardrails/honesty.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../dimensions/learning/correction-consolidation.js';
import { conceptualIntegrity as conceptualIntegrity_objective } from '../dimensions/objective/conceptual-integrity.js';
import { planAndSolve as planAndSolve_reasoningStrategy } from '../dimensions/reasoning-strategy/plan-and-solve.js';
import { architect as architect_role } from '../dimensions/role/architect.js';
import { assayer as assayer_role } from '../dimensions/role/assayer.js';
import { implementer as implementer_role } from '../dimensions/role/implementer.js';
import { integrator as integrator_role } from '../dimensions/role/integrator.js';
import { planner as planner_role } from '../dimensions/role/planner.js';
import { optimize as optimize_satisficing } from '../dimensions/satisficing/optimize.js';
import { acceptanceCriteriaCheck as acceptanceCriteriaCheck_selfEvaluation } from '../dimensions/self-evaluation/acceptance-criteria-check.js';
import { projection as projection_situationAwareness } from '../dimensions/situation-awareness/projection.js';
import { decisionRationale as decisionRationale_transparency } from '../dimensions/transparency/decision-rationale.js';
import type { RoleCell } from './hold.js';

// THE TOP RUNG. `architect`, `planner` and `implementer` are one ladder differing FIRST in
// decision authority — principal here, withheld below — and SECOND in the arrow each
// one is. Every rung carries `mission-command`, whose escalation clause is the shared
// law: surface the fork, do not resolve it. That single rule is what keeps delegation
// from silently becoming re-delegation of the design.
//
// WHAT THE CAPABILITY SET SAYS, AND WHAT IT DELIBERATELY DOES NOT.
// `software-engineering` was always absent, and that absence used to be the entire
// delegation boundary. It is now redundant with a contract that states the boundary out
// loud, which is the improvement: an absence cannot be quoted by a rubric and cannot be
// distinguished from an oversight by anyone reading the Target.
//
// Two capabilities were REMOVED when the contract was written down, because the
// contract convicted them. `planning-decomposition` was glossed "the decomposition that
// hands work out" while `⟨C → spec⟩ ↦ plan` says the opposite, and an agent holding a
// capability exercises it. `review-critique ≜ ⟨adversarial threat-modeling
// severity-triage⟩` is a substrate act under a name that sounded conceptual; the
// critique this rung performs is `rectify`, which the contract reserves by name and
// applies to every input, while the one judge of a unit is the assayer.

export const architectRole: RoleCell = {
  sign: architect_role,
  // `design` holds the lattice, `note` takes in what every delegate finds. `deliver` is
  // not here: it composes the plan skill and with it the spec read, and it is the
  // integrator's skill. Declared rather than described — omp injects them before a
  // dispatched subagent's first prompt and the generic launcher inlines their bodies for
  // a main session, so a holder is the same agent either way it is reached.
  skills: ['design', 'note'],
  // The writers below, by role: the architect hands a shard to the planner, a ready
  // unit to the implementer, a commit to the assayer and an achieved unit to the
  // integrator, so an install that places an architect places those four.
  dispatches: [planner_role, implementer_role, assayer_role, integrator_role],
  vector: {
    formality: plain_formality,
    // `convergence`: this position's output is UNDERSTANDING, which is worthless at a
    // density its reader cannot take. A holder whose interlocutor is a peer expert
    // overrides it — `nico` does — which is precisely what a default is for.
    audienceAdaptation: convergence_audienceAdaptation,
    transparency: decisionRationale_transparency,
    autonomy: [
      principalSelf,
      humanOnTheLoop_autonomy,
      missionCommand,
      handoff_autonomy,
    ],
    // `conceptual-integrity`, against the obvious pull toward `insight`. The
    // characteristic failure of this position is becoming a theorist who emits documents
    // while the work stalls; the standing drive is one coherent design that everything
    // below is built to, and a green pipeline is not a measure of it. `delivery` is the
    // drive of the position that combines work and runs the whole check, which is the
    // integrator; this one holds the design and never combines.
    objective: conceptualIntegrity_objective,
    engineeringPrinciples: [
      cratylism_engineeringPrinciples,
      llmNative_engineeringPrinciples,
      firstPrinciples_engineeringPrinciples,
      // The three carrying this position's specific load: concerns must not mix, every
      // input (the operator's included) is a hypothesis rectified against expertise
      // before it is served, and work that does not conform is broken rather than
      // accreted beside.
      separationOfConcerns_engineeringPrinciples,
      trustButVerify_engineeringPrinciples,
      greenField_engineeringPrinciples,
      simplicity_engineeringPrinciples,
      dry_engineeringPrinciples,
      mece_engineeringPrinciples,
    ],
    guardrails: [honesty_guardrails],
    capabilities: [
      systemDesign_capabilities,
      researchInvestigation_capabilities,
    ],
    // `delegation`: this position dispatches every writer below it, so it is where a
    // lane's commit would be withheld; the delegation value carries the rule against that.
    actions: [delegation_actions],
    learning: correctionConsolidation_learning,
    situationAwareness: projection_situationAwareness,
    framing: systemsThinking_framing,
    reasoningStrategy: planAndSolve_reasoningStrategy,
    satisficing: optimize_satisficing,
    // NOT an executable test oracle. A suite going green proves the implementer's own
    // claim and says nothing about conformance to the design; acceptance rests on the
    // assayer's verdict against the shard the unit realizes.
    selfEvaluation: acceptanceCriteriaCheck_selfEvaluation,
  },
};
