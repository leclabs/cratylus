import { maintenance as maintenance_audienceAdaptation } from '../dimensions/audience-adaptation/maintenance.js';
import { handoff as handoff_autonomy } from '../dimensions/autonomy/handoff.js';
import { missionCommand } from '../dimensions/autonomy/mission-command.js';
import { researchInvestigation as researchInvestigation_capabilities } from '../dimensions/capabilities/research-investigation.js';
import { softwareEngineering as softwareEngineering_capabilities } from '../dimensions/capabilities/software-engineering.js';
import { cratylism as cratylism_engineeringPrinciples } from '../dimensions/engineering-principles/cratylism.js';
import { firstPrinciples as firstPrinciples_engineeringPrinciples } from '../dimensions/engineering-principles/first-principles.js';
import { mece as mece_engineeringPrinciples } from '../dimensions/engineering-principles/mece.js';
import { plain as plain_formality } from '../dimensions/formality/plain.js';
import { analytical as analytical_framing } from '../dimensions/framing/analytical.js';
import { honesty as honesty_guardrails } from '../dimensions/guardrails/honesty.js';
import { correctionConsolidation as correctionConsolidation_learning } from '../dimensions/learning/correction-consolidation.js';
import { thoroughness as thoroughness_objective } from '../dimensions/objective/thoroughness.js';
import { structuredData as structuredData_outputFormat } from '../dimensions/output-format/structured-data.js';
import { react as react_reasoningStrategy } from '../dimensions/reasoning-strategy/react.js';
import { assay as assay_role } from '../dimensions/role/assay.js';
import { satisfice as satisfice_satisficing } from '../dimensions/satisficing/satisfice.js';
import { acceptanceCriteriaCheck as acceptanceCriteriaCheck_selfEvaluation } from '../dimensions/self-evaluation/acceptance-criteria-check.js';
import { comprehension as comprehension_situationAwareness } from '../dimensions/situation-awareness/comprehension.js';
import { provenanceAttribution as provenanceAttribution_transparency } from '../dimensions/transparency/provenance-attribution.js';
import type { RoleCell } from './hold.js';

// THE UPWARD ARROW. `software-engineering` is PRESENT here and absent one rung up, and
// the two facts are the same decision: this is the position that descends, so that the
// design-holder does not.
//
// EVERY ASPECT BELOW IS CHOSEN AGAINST THE ONE FAILURE MODE — turning into a code
// reviewer. `thoroughness` rewards answering every concept in `realizes(unit)` rather
// than finding something to say. `satisfice` stops at the answer instead of reading on.
// `structured-data` makes the report a list of ⟨concept, uncovered-factor, locus⟩ rather
// than a narrative, and a narrative is where mechanism-prose gets in. `cratylism`
// carries the cheapest of the three questions — does the artifact SPELL its concept —
// and `first-principles` forbids inheriting the executor's own account of what it built.
//
// `design` and no `deliver`: it must read the lattice to lift into it, and judging is
// not its remit.

export const assayRole: RoleCell = {
  sign: assay_role,
  skills: ['design'],
  vector: {
    formality: plain_formality,
    audienceAdaptation: maintenance_audienceAdaptation,
    // `provenance-attribution`: an unachieved concept travels with a locus, and a locus
    // asserted without a source is a claim the principal cannot route.
    transparency: provenanceAttribution_transparency,
    // No `principal-self`. It is dispatched, it answers, it returns.
    autonomy: [missionCommand, handoff_autonomy],
    objective: thoroughness_objective,
    engineeringPrinciples: [
      cratylism_engineeringPrinciples,
      firstPrinciples_engineeringPrinciples,
      mece_engineeringPrinciples,
    ],
    guardrails: [honesty_guardrails],
    capabilities: [
      softwareEngineering_capabilities,
      researchInvestigation_capabilities,
    ],
    learning: correctionConsolidation_learning,
    situationAwareness: comprehension_situationAwareness,
    framing: analytical_framing,
    reasoningStrategy: react_reasoningStrategy,
    satisficing: satisfice_satisficing,
    outputFormat: structuredData_outputFormat,
    selfEvaluation: acceptanceCriteriaCheck_selfEvaluation,
  },
};
