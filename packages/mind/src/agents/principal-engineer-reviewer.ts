import type { ResolvedAgent } from '@leclabs/koine/adapters/claude';
import type { Agent } from '@leclabs/koine/anatomy';
import { humanOnTheLoop as humanOnTheLoop_address } from '../organs/address/human-on-the-loop.js';
import { selfCritique as selfCritique_appraisal } from '../organs/appraisal/self-critique.js';
import { harmAvoidance as harmAvoidance_charter } from '../organs/charter/harm-avoidance.js';
import { helpfulness as helpfulness_charter } from '../organs/charter/helpfulness.js';
import { honesty as honesty_charter } from '../organs/charter/honesty.js';
import { inputUntrusted as inputUntrusted_charter } from '../organs/charter/input-untrusted.js';
import { scopeOfAuthority as scopeOfAuthority_charter } from '../organs/charter/scope-of-authority.js';
import { reviewCritique as reviewCritique_competence } from '../organs/competence/review-critique.js';
import { formal as formal_comportment } from '../organs/comportment/formal.js';
import { riskOriented as riskOriented_construal } from '../organs/construal/risk-oriented.js';
import { react as react_deliberation } from '../organs/deliberation/react.js';
import { reasoningTrace as reasoningTrace_disclosure } from '../organs/disclosure/reasoning-trace.js';
import { correctionConsolidation as correctionConsolidation_dispositionMemory } from '../organs/disposition-memory/correction-consolidation.js';
import { delegation as delegation_effectors } from '../organs/effectors/delegation.js';
import { fileOps as fileOps_effectors } from '../organs/effectors/file-ops.js';
import { structuredDecision as structuredDecision_enaction } from '../organs/enaction/structured-decision.js';
import { comprehension as comprehension_gestalt } from '../organs/gestalt/comprehension.js';
import { takeTheBest as takeTheBest_heuristics } from '../organs/heuristics/take-the-best.js';
import { longTermMemory as longTermMemory_ledger } from '../organs/ledger/long-term-memory.js';
import { review as review_mandate } from '../organs/mandate/review.js';
import { userMessage as userMessage_percept } from '../organs/percept/user-message.js';
import { ruler as ruler_persona } from '../organs/persona/ruler.js';
import { reviewerArchetypePurple as reviewerArchetypePurple_provenance } from '../organs/provenance/reviewer-archetype-purple.js';
import { convergence as convergence_registerFit } from '../organs/register-fit/convergence.js';
import { optimize as optimize_resolve } from '../organs/resolve/optimize.js';
import { text as text_sensors } from '../organs/sensors/text.js';
import { claude as claude_substrate } from '../organs/substrate/claude.js';
import { correctness as correctness_telos } from '../organs/telos/correctness.js';
import { base } from './base.js';
export const principalEngineerReviewer: Agent = {
  ...base,
  name: 'principal-engineer-reviewer',
  persona: ruler_persona,
  mandate: review_mandate,
  comportment: formal_comportment,
  registerFit: convergence_registerFit,
  disclosure: reasoningTrace_disclosure,
  address: humanOnTheLoop_address,
  provenance: reviewerArchetypePurple_provenance,
  telos: correctness_telos,
  charter: [
    harmAvoidance_charter,
    honesty_charter,
    helpfulness_charter,
    inputUntrusted_charter,
    scopeOfAuthority_charter,
  ],
  heuristics: [takeTheBest_heuristics],
  competence: [reviewCritique_competence],
  dispositionMemory: correctionConsolidation_dispositionMemory,
  gestalt: comprehension_gestalt,
  effectors: [fileOps_effectors, delegation_effectors],
  sensors: text_sensors,
  substrate: claude_substrate,
  ledger: longTermMemory_ledger,
  percept: userMessage_percept,
  construal: riskOriented_construal,
  deliberation: react_deliberation,
  resolve: optimize_resolve,
  enaction: structuredDecision_enaction,
  appraisal: selfCritique_appraisal,
};
export const principalEngineerReviewerResolved: ResolvedAgent = {
  name: 'principal-engineer-reviewer',
  description: ruler_persona.definiens,
  mark: reviewerArchetypePurple_provenance.mark,
  sourcePath: 'packages/mind/agent/principal-engineer-reviewer.md',
  memoryProtocol: base.memoryProtocol,
  organs: [
    ['Persona', [ruler_persona]],
    ['Mandate', [review_mandate]],
    ['Comportment', [formal_comportment]],
    ['Register-Fit', [convergence_registerFit]],
    ['Disclosure', [reasoningTrace_disclosure]],
    ['Address', [humanOnTheLoop_address]],
    ['Provenance', [reviewerArchetypePurple_provenance]],
    ['Telos', [correctness_telos]],
    [
      'Charter',
      [
        harmAvoidance_charter,
        honesty_charter,
        helpfulness_charter,
        inputUntrusted_charter,
        scopeOfAuthority_charter,
      ],
    ],
    ['Heuristics', [takeTheBest_heuristics]],
    ['Competence', [reviewCritique_competence]],
    ['Disposition-Memory', [correctionConsolidation_dispositionMemory]],
    ['Gestalt', [comprehension_gestalt]],
    ['Effectors', [fileOps_effectors, delegation_effectors]],
    ['Sensors', [text_sensors]],
    ['Substrate', [claude_substrate]],
    ['Ledger', [longTermMemory_ledger]],
    ['Percept', [userMessage_percept]],
    ['Construal', [riskOriented_construal]],
    ['Deliberation', [react_deliberation]],
    ['Resolve', [optimize_resolve]],
    ['Enaction', [structuredDecision_enaction]],
    ['Appraisal', [selfCritique_appraisal]],
  ],
};
