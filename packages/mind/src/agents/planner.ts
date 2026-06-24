import type { Agent } from '@leclabs/koine/anatomy';
import { humanOnTheLoop as humanOnTheLoop_address } from '../organs/address/human-on-the-loop.js';
import { acceptanceCriteriaCheck as acceptanceCriteriaCheck_appraisal } from '../organs/appraisal/acceptance-criteria-check.js';
import { harmAvoidance as harmAvoidance_charter } from '../organs/charter/harm-avoidance.js';
import { helpfulness as helpfulness_charter } from '../organs/charter/helpfulness.js';
import { honesty as honesty_charter } from '../organs/charter/honesty.js';
import { planningDecomposition as planningDecomposition_competence } from '../organs/competence/planning-decomposition.js';
import { formal as formal_comportment } from '../organs/comportment/formal.js';
import { decompositional as decompositional_construal } from '../organs/construal/decompositional.js';
import { planAndSolve as planAndSolve_deliberation } from '../organs/deliberation/plan-and-solve.js';
import { decisionRationale as decisionRationale_disclosure } from '../organs/disclosure/decision-rationale.js';
import { correctionConsolidation as correctionConsolidation_dispositionMemory } from '../organs/disposition-memory/correction-consolidation.js';
import { delegation as delegation_effectors } from '../organs/effectors/delegation.js';
import { fileOps as fileOps_effectors } from '../organs/effectors/file-ops.js';
import { structuredDecision as structuredDecision_enaction } from '../organs/enaction/structured-decision.js';
import { projection as projection_gestalt } from '../organs/gestalt/projection.js';
import { separationOfConcerns as separationOfConcerns_instructions } from '../organs/instructions/separation-of-concerns.js';
import { longTermMemory as longTermMemory_ledger } from '../organs/ledger/long-term-memory.js';
import { plan as plan_mandate } from '../organs/mandate/plan.js';
import { userMessage as userMessage_percept } from '../organs/percept/user-message.js';
import { ruler as ruler_persona } from '../organs/persona/ruler.js';
import { plannerArchetypeBlue as plannerArchetypeBlue_provenance } from '../organs/provenance/planner-archetype-blue.js';
import { convergence as convergence_registerFit } from '../organs/register-fit/convergence.js';
import { satisfice as satisfice_resolve } from '../organs/resolve/satisfice.js';
import { text as text_sensors } from '../organs/sensors/text.js';
import { claude as claude_substrate } from '../organs/substrate/claude.js';
import { delivery as delivery_telos } from '../organs/telos/delivery.js';
import type { ResolvedAgent } from '../toolkit/agent-projection.js';
import { base } from './base.js';
export const planner: Agent = {
  ...base,
  name: 'planner',
  persona: ruler_persona,
  mandate: plan_mandate,
  comportment: formal_comportment,
  registerFit: convergence_registerFit,
  disclosure: decisionRationale_disclosure,
  address: humanOnTheLoop_address,
  provenance: plannerArchetypeBlue_provenance,
  telos: delivery_telos,
  instructions: [separationOfConcerns_instructions],
  charter: [harmAvoidance_charter, honesty_charter, helpfulness_charter],
  competence: [planningDecomposition_competence],
  dispositionMemory: correctionConsolidation_dispositionMemory,
  gestalt: projection_gestalt,
  effectors: [fileOps_effectors, delegation_effectors],
  sensors: text_sensors,
  substrate: claude_substrate,
  ledger: longTermMemory_ledger,
  percept: userMessage_percept,
  construal: decompositional_construal,
  deliberation: planAndSolve_deliberation,
  resolve: satisfice_resolve,
  enaction: structuredDecision_enaction,
  appraisal: acceptanceCriteriaCheck_appraisal,
};
export const plannerResolved: ResolvedAgent = {
  name: 'planner',
  description: ruler_persona.definiens,
  mark: plannerArchetypeBlue_provenance.mark,
  sourcePath: 'packages/mind/agent/planner.md',
  memoryProtocol: base.memoryProtocol,
  organs: [
    ['Persona', [ruler_persona]],
    ['Mandate', [plan_mandate]],
    ['Comportment', [formal_comportment]],
    ['Register-Fit', [convergence_registerFit]],
    ['Disclosure', [decisionRationale_disclosure]],
    ['Address', [humanOnTheLoop_address]],
    ['Provenance', [plannerArchetypeBlue_provenance]],
    ['Telos', [delivery_telos]],
    ['Instructions', [separationOfConcerns_instructions]],
    ['Charter', [harmAvoidance_charter, honesty_charter, helpfulness_charter]],
    ['Competence', [planningDecomposition_competence]],
    ['Disposition-Memory', [correctionConsolidation_dispositionMemory]],
    ['Gestalt', [projection_gestalt]],
    ['Effectors', [fileOps_effectors, delegation_effectors]],
    ['Sensors', [text_sensors]],
    ['Substrate', [claude_substrate]],
    ['Ledger', [longTermMemory_ledger]],
    ['Percept', [userMessage_percept]],
    ['Construal', [decompositional_construal]],
    ['Deliberation', [planAndSolve_deliberation]],
    ['Resolve', [satisfice_resolve]],
    ['Enaction', [structuredDecision_enaction]],
    ['Appraisal', [acceptanceCriteriaCheck_appraisal]],
  ],
};
