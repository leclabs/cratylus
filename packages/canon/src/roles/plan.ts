import { maintenance as maintenance_audienceAdaptation } from '../dimensions/audience-adaptation/maintenance.js';
import { handoff as handoff_autonomy } from '../dimensions/autonomy/handoff.js';
import { missionCommand } from '../dimensions/autonomy/mission-command.js';
import { planningDecomposition as planningDecomposition_capabilities } from '../dimensions/capabilities/planning-decomposition.js';
import { researchInvestigation as researchInvestigation_capabilities } from '../dimensions/capabilities/research-investigation.js';
import { cratylism as cratylism_engineeringPrinciples } from '../dimensions/engineering-principles/cratylism.js';
import { dry as dry_engineeringPrinciples } from '../dimensions/engineering-principles/dry.js';
import { firstPrinciples as firstPrinciples_engineeringPrinciples } from '../dimensions/engineering-principles/first-principles.js';
import { llmNative as llmNative_engineeringPrinciples } from '../dimensions/engineering-principles/llm-native.js';
import { mece as mece_engineeringPrinciples } from '../dimensions/engineering-principles/mece.js';
import { simplicity as simplicity_engineeringPrinciples } from '../dimensions/engineering-principles/simplicity.js';
import { plain as plain_formality } from '../dimensions/formality/plain.js';
import { decompositional as decompositional_framing } from '../dimensions/framing/decompositional.js';
import { honesty as honesty_guardrails } from '../dimensions/guardrails/honesty.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../dimensions/learning/correction-consolidation.js';
import { thoroughness as thoroughness_objective } from '../dimensions/objective/thoroughness.js';
import { planAndSolve as planAndSolve_reasoningStrategy } from '../dimensions/reasoning-strategy/plan-and-solve.js';
import { plan as plan_role } from '../dimensions/role/plan.js';
import { optimize as optimize_satisficing } from '../dimensions/satisficing/optimize.js';
import { acceptanceCriteriaCheck as acceptanceCriteriaCheck_selfEvaluation } from '../dimensions/self-evaluation/acceptance-criteria-check.js';
import { comprehension as comprehension_situationAwareness } from '../dimensions/situation-awareness/comprehension.js';
import { provenanceAttribution as provenanceAttribution_transparency } from '../dimensions/transparency/provenance-attribution.js';
import type { RoleCell } from './hold.js';

// THE MIDDLE RUNG. Holds `mission-command` and `handoff` but NOT `principal-self`: the
// boundary was drawn above it, and the contract's `⊄ writes C` is what makes that
// refusal structural rather than a matter of discipline.
//
// `system-design` is absent alongside `software-engineering` — this position neither
// designs nor builds. What it owns is the census and the cut-into-units.

export const planRole: RoleCell = {
  sign: plan_role,
  // One skill, and only one. `design` and `deliver` belong to the rung ABOVE, which
  // draws the boundary this rung plans inside; the rung BELOW declares none at all,
  // because an implementer's decisions are made for it by its spec.
  skills: ['plan'],
  vector: {
    formality: plain_formality,
    audienceAdaptation: maintenance_audienceAdaptation,
    // `provenance-attribution`: a census is only worth what its sourcing is worth, and
    // a count quoted without its denominator is indistinguishable from not having
    // looked. Every finding carries where it came from and whether it was observed or
    // inferred.
    transparency: provenanceAttribution_transparency,
    autonomy: [missionCommand, handoff_autonomy],
    // `thoroughness`, not `delivery`: this position ships no artifact a user sees, and
    // its failure mode is an incomplete census rather than a slow one.
    objective: thoroughness_objective,
    engineeringPrinciples: [
      cratylism_engineeringPrinciples,
      llmNative_engineeringPrinciples,
      firstPrinciples_engineeringPrinciples,
      simplicity_engineeringPrinciples,
      dry_engineeringPrinciples,
      mece_engineeringPrinciples,
    ],
    guardrails: [honesty_guardrails],
    capabilities: [
      planningDecomposition_capabilities,
      researchInvestigation_capabilities,
    ],
    learning: correctionConsolidation_learning,
    // `comprehension`, where the architect holds `projection`: this position's job is
    // to establish what IS, exhaustively, not to anticipate what follows.
    situationAwareness: comprehension_situationAwareness,
    framing: decompositional_framing,
    reasoningStrategy: planAndSolve_reasoningStrategy,
    satisficing: optimize_satisficing,
    selfEvaluation: acceptanceCriteriaCheck_selfEvaluation,
  },
};
