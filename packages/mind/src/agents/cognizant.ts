import type { ResolvedAgent } from '@leclabs/koine/adapters/claude';
import type { Agent } from '@leclabs/koine/anatomy';
import { humanOnTheLoop as humanOnTheLoop_address } from '../organs/address/human-on-the-loop.js';
import { selfCritique as selfCritique_appraisal } from '../organs/appraisal/self-critique.js';
import { harmAvoidance as harmAvoidance_charter } from '../organs/charter/harm-avoidance.js';
import { helpfulness as helpfulness_charter } from '../organs/charter/helpfulness.js';
import { honesty as honesty_charter } from '../organs/charter/honesty.js';
import { scopeOfAuthority as scopeOfAuthority_charter } from '../organs/charter/scope-of-authority.js';
import { analysisDiagnosis as analysisDiagnosis_competence } from '../organs/competence/analysis-diagnosis.js';
import { formal as formal_comportment } from '../organs/comportment/formal.js';
import { diagnostic as diagnostic_construal } from '../organs/construal/diagnostic.js';
import { react as react_deliberation } from '../organs/deliberation/react.js';
import { provenanceAttribution as provenanceAttribution_disclosure } from '../organs/disclosure/provenance-attribution.js';
import { correctionConsolidation as correctionConsolidation_dispositionMemory } from '../organs/disposition-memory/correction-consolidation.js';
import { communication as communication_effectors } from '../organs/effectors/communication.js';
import { retrieval as retrieval_effectors } from '../organs/effectors/retrieval.js';
import { structuredData as structuredData_enaction } from '../organs/enaction/structured-data.js';
import { comprehension as comprehension_gestalt } from '../organs/gestalt/comprehension.js';
import { takeTheBest as takeTheBest_heuristics } from '../organs/heuristics/take-the-best.js';
import { longTermMemory as longTermMemory_ledger } from '../organs/ledger/long-term-memory.js';
import { diagnose as diagnose_mandate } from '../organs/mandate/diagnose.js';
import { introspectionRequest as introspectionRequest_percept } from '../organs/percept/introspection-request.js';
import { magician as magician_persona } from '../organs/persona/magician.js';
import { diagnosticDelegateOfPolisCyan as diagnosticDelegateOfPolisCyan_provenance } from '../organs/provenance/diagnostic-delegate-of-polis-cyan.js';
import { convergence as convergence_registerFit } from '../organs/register-fit/convergence.js';
import { satisfice as satisfice_resolve } from '../organs/resolve/satisfice.js';
import { text as text_sensors } from '../organs/sensors/text.js';
import { claude as claude_substrate } from '../organs/substrate/claude.js';
import { insight as insight_telos } from '../organs/telos/insight.js';
import { base } from './base.js';
export const cognizant: Agent = {
  ...base,
  name: 'cognizant',
  persona: magician_persona,
  mandate: diagnose_mandate,
  comportment: formal_comportment,
  registerFit: convergence_registerFit,
  disclosure: provenanceAttribution_disclosure,
  address: humanOnTheLoop_address,
  provenance: diagnosticDelegateOfPolisCyan_provenance,
  telos: insight_telos,
  charter: [
    harmAvoidance_charter,
    honesty_charter,
    helpfulness_charter,
    scopeOfAuthority_charter,
  ],
  heuristics: [takeTheBest_heuristics],
  competence: [analysisDiagnosis_competence],
  dispositionMemory: correctionConsolidation_dispositionMemory,
  gestalt: comprehension_gestalt,
  effectors: [retrieval_effectors, communication_effectors],
  sensors: text_sensors,
  substrate: claude_substrate,
  ledger: longTermMemory_ledger,
  percept: introspectionRequest_percept,
  construal: diagnostic_construal,
  deliberation: react_deliberation,
  resolve: satisfice_resolve,
  enaction: structuredData_enaction,
  appraisal: selfCritique_appraisal,
};
export const cognizantResolved: ResolvedAgent = {
  name: 'cognizant',
  description: magician_persona.definiens,
  mark: diagnosticDelegateOfPolisCyan_provenance.mark,
  sourcePath: 'packages/mind/agent/cognizant.md',
  memoryProtocol: base.memoryProtocol,
  organs: [
    ['Persona', [magician_persona]],
    ['Mandate', [diagnose_mandate]],
    ['Comportment', [formal_comportment]],
    ['Register-Fit', [convergence_registerFit]],
    ['Disclosure', [provenanceAttribution_disclosure]],
    ['Address', [humanOnTheLoop_address]],
    ['Provenance', [diagnosticDelegateOfPolisCyan_provenance]],
    ['Telos', [insight_telos]],
    [
      'Charter',
      [
        harmAvoidance_charter,
        honesty_charter,
        helpfulness_charter,
        scopeOfAuthority_charter,
      ],
    ],
    ['Heuristics', [takeTheBest_heuristics]],
    ['Competence', [analysisDiagnosis_competence]],
    ['Disposition-Memory', [correctionConsolidation_dispositionMemory]],
    ['Gestalt', [comprehension_gestalt]],
    ['Effectors', [retrieval_effectors, communication_effectors]],
    ['Sensors', [text_sensors]],
    ['Substrate', [claude_substrate]],
    ['Ledger', [longTermMemory_ledger]],
    ['Percept', [introspectionRequest_percept]],
    ['Construal', [diagnostic_construal]],
    ['Deliberation', [react_deliberation]],
    ['Resolve', [satisfice_resolve]],
    ['Enaction', [structuredData_enaction]],
    ['Appraisal', [selfCritique_appraisal]],
  ],
};
