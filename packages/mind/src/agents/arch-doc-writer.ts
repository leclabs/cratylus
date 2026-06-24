import type { ResolvedAgent } from '@leclabs/koine/adapters/claude';
import type { Agent } from '@leclabs/koine/anatomy';
import { humanOnTheLoop as humanOnTheLoop_address } from '../organs/address/human-on-the-loop.js';
import { acceptanceCriteriaCheck as acceptanceCriteriaCheck_appraisal } from '../organs/appraisal/acceptance-criteria-check.js';
import { harmAvoidance as harmAvoidance_charter } from '../organs/charter/harm-avoidance.js';
import { helpfulness as helpfulness_charter } from '../organs/charter/helpfulness.js';
import { honesty as honesty_charter } from '../organs/charter/honesty.js';
import { systemDesign as systemDesign_competence } from '../organs/competence/system-design.js';
import { technicalWriting as technicalWriting_competence } from '../organs/competence/technical-writing.js';
import { neutral as neutral_comportment } from '../organs/comportment/neutral.js';
import { systems as systems_construal } from '../organs/construal/systems.js';
import { react as react_deliberation } from '../organs/deliberation/react.js';
import { provenanceAttribution as provenanceAttribution_disclosure } from '../organs/disclosure/provenance-attribution.js';
import { correctionConsolidation as correctionConsolidation_dispositionMemory } from '../organs/disposition-memory/correction-consolidation.js';
import { delegation as delegation_effectors } from '../organs/effectors/delegation.js';
import { fileOps as fileOps_effectors } from '../organs/effectors/file-ops.js';
import { toolCall as toolCall_effectors } from '../organs/effectors/tool-call.js';
import { document as document_enaction } from '../organs/enaction/document.js';
import { comprehension as comprehension_gestalt } from '../organs/gestalt/comprehension.js';
import { takeTheBest as takeTheBest_heuristics } from '../organs/heuristics/take-the-best.js';
import { longTermMemory as longTermMemory_ledger } from '../organs/ledger/long-term-memory.js';
import { document as document_mandate } from '../organs/mandate/document.js';
import { userMessage as userMessage_percept } from '../organs/percept/user-message.js';
import { sage as sage_persona } from '../organs/persona/sage.js';
import { archDocWriterArchetypePink as archDocWriterArchetypePink_provenance } from '../organs/provenance/arch-doc-writer-archetype-pink.js';
import { convergence as convergence_registerFit } from '../organs/register-fit/convergence.js';
import { satisfice as satisfice_resolve } from '../organs/resolve/satisfice.js';
import { text as text_sensors } from '../organs/sensors/text.js';
import { claude as claude_substrate } from '../organs/substrate/claude.js';
import { faithfulRecord as faithfulRecord_telos } from '../organs/telos/faithful-record.js';
import { base } from './base.js';
export const archDocWriter: Agent = {
  ...base,
  name: 'arch-doc-writer',
  persona: sage_persona,
  mandate: document_mandate,
  comportment: neutral_comportment,
  registerFit: convergence_registerFit,
  disclosure: provenanceAttribution_disclosure,
  address: humanOnTheLoop_address,
  provenance: archDocWriterArchetypePink_provenance,
  telos: faithfulRecord_telos,
  charter: [harmAvoidance_charter, honesty_charter, helpfulness_charter],
  heuristics: [takeTheBest_heuristics],
  competence: [technicalWriting_competence, systemDesign_competence],
  dispositionMemory: correctionConsolidation_dispositionMemory,
  gestalt: comprehension_gestalt,
  effectors: [fileOps_effectors, toolCall_effectors, delegation_effectors],
  sensors: text_sensors,
  substrate: claude_substrate,
  ledger: longTermMemory_ledger,
  percept: userMessage_percept,
  construal: systems_construal,
  deliberation: react_deliberation,
  resolve: satisfice_resolve,
  enaction: document_enaction,
  appraisal: acceptanceCriteriaCheck_appraisal,
};
export const archDocWriterResolved: ResolvedAgent = {
  name: 'arch-doc-writer',
  description: sage_persona.definiens,
  mark: archDocWriterArchetypePink_provenance.mark,
  sourcePath: 'packages/mind/agent/arch-doc-writer.md',
  memoryProtocol: base.memoryProtocol,
  organs: [
    ['Persona', [sage_persona]],
    ['Mandate', [document_mandate]],
    ['Comportment', [neutral_comportment]],
    ['Register-Fit', [convergence_registerFit]],
    ['Disclosure', [provenanceAttribution_disclosure]],
    ['Address', [humanOnTheLoop_address]],
    ['Provenance', [archDocWriterArchetypePink_provenance]],
    ['Telos', [faithfulRecord_telos]],
    ['Charter', [harmAvoidance_charter, honesty_charter, helpfulness_charter]],
    ['Heuristics', [takeTheBest_heuristics]],
    ['Competence', [technicalWriting_competence, systemDesign_competence]],
    ['Disposition-Memory', [correctionConsolidation_dispositionMemory]],
    ['Gestalt', [comprehension_gestalt]],
    [
      'Effectors',
      [fileOps_effectors, toolCall_effectors, delegation_effectors],
    ],
    ['Sensors', [text_sensors]],
    ['Substrate', [claude_substrate]],
    ['Ledger', [longTermMemory_ledger]],
    ['Percept', [userMessage_percept]],
    ['Construal', [systems_construal]],
    ['Deliberation', [react_deliberation]],
    ['Resolve', [satisfice_resolve]],
    ['Enaction', [document_enaction]],
    ['Appraisal', [acceptanceCriteriaCheck_appraisal]],
  ],
};
