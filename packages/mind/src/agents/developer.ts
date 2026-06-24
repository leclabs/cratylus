import type { ResolvedAgent } from '@leclabs/koine/adapters/claude';
import type { Agent } from '@leclabs/koine/anatomy';
import { humanOnTheLoop as humanOnTheLoop_address } from '../organs/address/human-on-the-loop.js';
import { executableTestOracle as executableTestOracle_appraisal } from '../organs/appraisal/executable-test-oracle.js';
import { harmAvoidance as harmAvoidance_charter } from '../organs/charter/harm-avoidance.js';
import { helpfulness as helpfulness_charter } from '../organs/charter/helpfulness.js';
import { honesty as honesty_charter } from '../organs/charter/honesty.js';
import { softwareEngineering as softwareEngineering_competence } from '../organs/competence/software-engineering.js';
import { neutral as neutral_comportment } from '../organs/comportment/neutral.js';
import { goalDirected as goalDirected_construal } from '../organs/construal/goal-directed.js';
import { react as react_deliberation } from '../organs/deliberation/react.js';
import { reasoningTrace as reasoningTrace_disclosure } from '../organs/disclosure/reasoning-trace.js';
import { correctionConsolidation as correctionConsolidation_dispositionMemory } from '../organs/disposition-memory/correction-consolidation.js';
import { codeExecution as codeExecution_effectors } from '../organs/effectors/code-execution.js';
import { delegation as delegation_effectors } from '../organs/effectors/delegation.js';
import { fileOps as fileOps_effectors } from '../organs/effectors/file-ops.js';
import { code as code_enaction } from '../organs/enaction/code.js';
import { projection as projection_gestalt } from '../organs/gestalt/projection.js';
import { satisficing as satisficing_heuristics } from '../organs/heuristics/satisficing.js';
import { takeTheBest as takeTheBest_heuristics } from '../organs/heuristics/take-the-best.js';
import { longTermMemory as longTermMemory_ledger } from '../organs/ledger/long-term-memory.js';
import { implement as implement_mandate } from '../organs/mandate/implement.js';
import { userMessage as userMessage_percept } from '../organs/percept/user-message.js';
import { creator as creator_persona } from '../organs/persona/creator.js';
import { developerArchetypeBlue as developerArchetypeBlue_provenance } from '../organs/provenance/developer-archetype-blue.js';
import { convergence as convergence_registerFit } from '../organs/register-fit/convergence.js';
import { satisfice as satisfice_resolve } from '../organs/resolve/satisfice.js';
import { text as text_sensors } from '../organs/sensors/text.js';
import { claude as claude_substrate } from '../organs/substrate/claude.js';
import { parsimony as parsimony_telos } from '../organs/telos/parsimony.js';
import { base } from './base.js';
export const developer: Agent = {
  ...base,
  name: 'developer',
  persona: creator_persona,
  mandate: implement_mandate,
  comportment: neutral_comportment,
  registerFit: convergence_registerFit,
  disclosure: reasoningTrace_disclosure,
  address: humanOnTheLoop_address,
  provenance: developerArchetypeBlue_provenance,
  telos: parsimony_telos,
  charter: [harmAvoidance_charter, honesty_charter, helpfulness_charter],
  heuristics: [takeTheBest_heuristics, satisficing_heuristics],
  competence: [softwareEngineering_competence],
  dispositionMemory: correctionConsolidation_dispositionMemory,
  gestalt: projection_gestalt,
  effectors: [fileOps_effectors, codeExecution_effectors, delegation_effectors],
  sensors: text_sensors,
  substrate: claude_substrate,
  ledger: longTermMemory_ledger,
  percept: userMessage_percept,
  construal: goalDirected_construal,
  deliberation: react_deliberation,
  resolve: satisfice_resolve,
  enaction: code_enaction,
  appraisal: executableTestOracle_appraisal,
};
export const developerResolved: ResolvedAgent = {
  name: 'developer',
  description: creator_persona.definiens,
  mark: developerArchetypeBlue_provenance.mark,
  sourcePath: 'packages/mind/agent/developer.md',
  memoryProtocol: base.memoryProtocol,
  organs: [
    ['Persona', [creator_persona]],
    ['Mandate', [implement_mandate]],
    ['Comportment', [neutral_comportment]],
    ['Register-Fit', [convergence_registerFit]],
    ['Disclosure', [reasoningTrace_disclosure]],
    ['Address', [humanOnTheLoop_address]],
    ['Provenance', [developerArchetypeBlue_provenance]],
    ['Telos', [parsimony_telos]],
    ['Charter', [harmAvoidance_charter, honesty_charter, helpfulness_charter]],
    ['Heuristics', [takeTheBest_heuristics, satisficing_heuristics]],
    ['Competence', [softwareEngineering_competence]],
    ['Disposition-Memory', [correctionConsolidation_dispositionMemory]],
    ['Gestalt', [projection_gestalt]],
    [
      'Effectors',
      [fileOps_effectors, codeExecution_effectors, delegation_effectors],
    ],
    ['Sensors', [text_sensors]],
    ['Substrate', [claude_substrate]],
    ['Ledger', [longTermMemory_ledger]],
    ['Percept', [userMessage_percept]],
    ['Construal', [goalDirected_construal]],
    ['Deliberation', [react_deliberation]],
    ['Resolve', [satisfice_resolve]],
    ['Enaction', [code_enaction]],
    ['Appraisal', [executableTestOracle_appraisal]],
  ],
};
