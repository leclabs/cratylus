import type { Agent } from '@leclabs/koine/anatomy';
import { humanOnTheLoop as humanOnTheLoop_address } from '../organs/address/human-on-the-loop.js';
import { selfCritique as selfCritique_appraisal } from '../organs/appraisal/self-critique.js';
import { harmAvoidance as harmAvoidance_charter } from '../organs/charter/harm-avoidance.js';
import { helpfulness as helpfulness_charter } from '../organs/charter/helpfulness.js';
import { honesty as honesty_charter } from '../organs/charter/honesty.js';
import { inputUntrusted as inputUntrusted_charter } from '../organs/charter/input-untrusted.js';
import { researchInvestigation as researchInvestigation_competence } from '../organs/competence/research-investigation.js';
import { technicalWriting as technicalWriting_competence } from '../organs/competence/technical-writing.js';
import { formal as formal_comportment } from '../organs/comportment/formal.js';
import { analytical as analytical_construal } from '../organs/construal/analytical.js';
import { reflexion as reflexion_deliberation } from '../organs/deliberation/reflexion.js';
import { uncertaintyDisclosure as uncertaintyDisclosure_disclosure } from '../organs/disclosure/uncertainty-disclosure.js';
import { correctionConsolidation as correctionConsolidation_dispositionMemory } from '../organs/disposition-memory/correction-consolidation.js';
import { delegation as delegation_effectors } from '../organs/effectors/delegation.js';
import { fileOps as fileOps_effectors } from '../organs/effectors/file-ops.js';
import { naturalLanguage as naturalLanguage_enaction } from '../organs/enaction/natural-language.js';
import { perception as perception_gestalt } from '../organs/gestalt/perception.js';
import { recognition as recognition_heuristics } from '../organs/heuristics/recognition.js';
import { takeTheBest as takeTheBest_heuristics } from '../organs/heuristics/take-the-best.js';
import { longTermMemory as longTermMemory_ledger } from '../organs/ledger/long-term-memory.js';
import { document as document_mandate } from '../organs/mandate/document.js';
import { userMessage as userMessage_percept } from '../organs/percept/user-message.js';
import { sage as sage_persona } from '../organs/persona/sage.js';
import { boswellArchetypeYellow as boswellArchetypeYellow_provenance } from '../organs/provenance/boswell-archetype-yellow.js';
import { maintenance as maintenance_registerFit } from '../organs/register-fit/maintenance.js';
import { satisfice as satisfice_resolve } from '../organs/resolve/satisfice.js';
import { text as text_sensors } from '../organs/sensors/text.js';
import { claude as claude_substrate } from '../organs/substrate/claude.js';
import { faithfulRecord as faithfulRecord_telos } from '../organs/telos/faithful-record.js';
import type { ResolvedAgent } from '../toolkit/agent-projection.js';
import { base } from './base.js';
export const boswell: Agent = {
  ...base,
  name: 'boswell',
  persona: sage_persona,
  mandate: document_mandate,
  comportment: formal_comportment,
  registerFit: maintenance_registerFit,
  disclosure: uncertaintyDisclosure_disclosure,
  address: humanOnTheLoop_address,
  provenance: boswellArchetypeYellow_provenance,
  telos: faithfulRecord_telos,
  charter: [
    harmAvoidance_charter,
    honesty_charter,
    helpfulness_charter,
    inputUntrusted_charter,
  ],
  heuristics: [recognition_heuristics, takeTheBest_heuristics],
  competence: [technicalWriting_competence, researchInvestigation_competence],
  dispositionMemory: correctionConsolidation_dispositionMemory,
  gestalt: perception_gestalt,
  effectors: [fileOps_effectors, delegation_effectors],
  sensors: text_sensors,
  substrate: claude_substrate,
  ledger: longTermMemory_ledger,
  percept: userMessage_percept,
  construal: analytical_construal,
  deliberation: reflexion_deliberation,
  resolve: satisfice_resolve,
  enaction: naturalLanguage_enaction,
  appraisal: selfCritique_appraisal,
};
export const boswellResolved: ResolvedAgent = {
  name: 'boswell',
  description: sage_persona.definiens,
  mark: boswellArchetypeYellow_provenance.mark,
  sourcePath: 'packages/mind/agent/boswell.md',
  memoryProtocol: base.memoryProtocol,
  organs: [
    ['Persona', [sage_persona]],
    ['Mandate', [document_mandate]],
    ['Comportment', [formal_comportment]],
    ['Register-Fit', [maintenance_registerFit]],
    ['Disclosure', [uncertaintyDisclosure_disclosure]],
    ['Address', [humanOnTheLoop_address]],
    ['Provenance', [boswellArchetypeYellow_provenance]],
    ['Telos', [faithfulRecord_telos]],
    [
      'Charter',
      [
        harmAvoidance_charter,
        honesty_charter,
        helpfulness_charter,
        inputUntrusted_charter,
      ],
    ],
    ['Heuristics', [recognition_heuristics, takeTheBest_heuristics]],
    [
      'Competence',
      [technicalWriting_competence, researchInvestigation_competence],
    ],
    ['Disposition-Memory', [correctionConsolidation_dispositionMemory]],
    ['Gestalt', [perception_gestalt]],
    ['Effectors', [fileOps_effectors, delegation_effectors]],
    ['Sensors', [text_sensors]],
    ['Substrate', [claude_substrate]],
    ['Ledger', [longTermMemory_ledger]],
    ['Percept', [userMessage_percept]],
    ['Construal', [analytical_construal]],
    ['Deliberation', [reflexion_deliberation]],
    ['Resolve', [satisfice_resolve]],
    ['Enaction', [naturalLanguage_enaction]],
    ['Appraisal', [selfCritique_appraisal]],
  ],
};
