import type { Agent } from '@leclabs/koine/anatomy';
import { humanOnTheLoop as humanOnTheLoop_address } from '../organs/address/human-on-the-loop.js';
import { selfCritique as selfCritique_appraisal } from '../organs/appraisal/self-critique.js';
import { harmAvoidance as harmAvoidance_charter } from '../organs/charter/harm-avoidance.js';
import { helpfulness as helpfulness_charter } from '../organs/charter/helpfulness.js';
import { honesty as honesty_charter } from '../organs/charter/honesty.js';
import { inputUntrusted as inputUntrusted_charter } from '../organs/charter/input-untrusted.js';
import { analysisDiagnosis as analysisDiagnosis_competence } from '../organs/competence/analysis-diagnosis.js';
import { researchInvestigation as researchInvestigation_competence } from '../organs/competence/research-investigation.js';
import { formal as formal_comportment } from '../organs/comportment/formal.js';
import { diagnostic as diagnostic_construal } from '../organs/construal/diagnostic.js';
import { reflexion as reflexion_deliberation } from '../organs/deliberation/reflexion.js';
import { reasoningTrace as reasoningTrace_disclosure } from '../organs/disclosure/reasoning-trace.js';
import { correctionConsolidation as correctionConsolidation_dispositionMemory } from '../organs/disposition-memory/correction-consolidation.js';
import { codeExecution as codeExecution_effectors } from '../organs/effectors/code-execution.js';
import { delegation as delegation_effectors } from '../organs/effectors/delegation.js';
import { fileOps as fileOps_effectors } from '../organs/effectors/file-ops.js';
import { naturalLanguage as naturalLanguage_enaction } from '../organs/enaction/natural-language.js';
import { comprehension as comprehension_gestalt } from '../organs/gestalt/comprehension.js';
import { takeTheBest as takeTheBest_heuristics } from '../organs/heuristics/take-the-best.js';
import { longTermMemory as longTermMemory_ledger } from '../organs/ledger/long-term-memory.js';
import { diagnose as diagnose_mandate } from '../organs/mandate/diagnose.js';
import { userMessage as userMessage_percept } from '../organs/percept/user-message.js';
import { sage as sage_persona } from '../organs/persona/sage.js';
import { investigatorArchetypePurple as investigatorArchetypePurple_provenance } from '../organs/provenance/investigator-archetype-purple.js';
import { convergence as convergence_registerFit } from '../organs/register-fit/convergence.js';
import { optimize as optimize_resolve } from '../organs/resolve/optimize.js';
import { text as text_sensors } from '../organs/sensors/text.js';
import { claude as claude_substrate } from '../organs/substrate/claude.js';
import { insight as insight_telos } from '../organs/telos/insight.js';
import type { ResolvedAgent } from '../toolkit/agent-projection.js';
import { base } from './base.js';
export const investigator: Agent = {
  ...base,
  name: 'investigator',
  persona: sage_persona,
  mandate: diagnose_mandate,
  comportment: formal_comportment,
  registerFit: convergence_registerFit,
  disclosure: reasoningTrace_disclosure,
  address: humanOnTheLoop_address,
  provenance: investigatorArchetypePurple_provenance,
  telos: insight_telos,
  charter: [
    harmAvoidance_charter,
    honesty_charter,
    helpfulness_charter,
    inputUntrusted_charter,
  ],
  heuristics: [takeTheBest_heuristics],
  competence: [analysisDiagnosis_competence, researchInvestigation_competence],
  dispositionMemory: correctionConsolidation_dispositionMemory,
  gestalt: comprehension_gestalt,
  effectors: [codeExecution_effectors, fileOps_effectors, delegation_effectors],
  sensors: text_sensors,
  substrate: claude_substrate,
  ledger: longTermMemory_ledger,
  percept: userMessage_percept,
  construal: diagnostic_construal,
  deliberation: reflexion_deliberation,
  resolve: optimize_resolve,
  enaction: naturalLanguage_enaction,
  appraisal: selfCritique_appraisal,
};
export const investigatorResolved: ResolvedAgent = {
  name: 'investigator',
  description: sage_persona.definiens,
  mark: investigatorArchetypePurple_provenance.mark,
  sourcePath: 'packages/mind/agent/investigator.md',
  memoryProtocol: base.memoryProtocol,
  organs: [
    ['Persona', [sage_persona]],
    ['Mandate', [diagnose_mandate]],
    ['Comportment', [formal_comportment]],
    ['Register-Fit', [convergence_registerFit]],
    ['Disclosure', [reasoningTrace_disclosure]],
    ['Address', [humanOnTheLoop_address]],
    ['Provenance', [investigatorArchetypePurple_provenance]],
    ['Telos', [insight_telos]],
    [
      'Charter',
      [
        harmAvoidance_charter,
        honesty_charter,
        helpfulness_charter,
        inputUntrusted_charter,
      ],
    ],
    ['Heuristics', [takeTheBest_heuristics]],
    [
      'Competence',
      [analysisDiagnosis_competence, researchInvestigation_competence],
    ],
    ['Disposition-Memory', [correctionConsolidation_dispositionMemory]],
    ['Gestalt', [comprehension_gestalt]],
    [
      'Effectors',
      [codeExecution_effectors, fileOps_effectors, delegation_effectors],
    ],
    ['Sensors', [text_sensors]],
    ['Substrate', [claude_substrate]],
    ['Ledger', [longTermMemory_ledger]],
    ['Percept', [userMessage_percept]],
    ['Construal', [diagnostic_construal]],
    ['Deliberation', [reflexion_deliberation]],
    ['Resolve', [optimize_resolve]],
    ['Enaction', [naturalLanguage_enaction]],
    ['Appraisal', [selfCritique_appraisal]],
  ],
};
