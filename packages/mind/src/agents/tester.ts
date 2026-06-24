import type { ResolvedAgent } from '@leclabs/koine/adapters/claude';
import type { Agent } from '@leclabs/koine/anatomy';
import { humanOnTheLoop as humanOnTheLoop_address } from '../organs/address/human-on-the-loop.js';
import { executableTestOracle as executableTestOracle_appraisal } from '../organs/appraisal/executable-test-oracle.js';
import { harmAvoidance as harmAvoidance_charter } from '../organs/charter/harm-avoidance.js';
import { helpfulness as helpfulness_charter } from '../organs/charter/helpfulness.js';
import { honesty as honesty_charter } from '../organs/charter/honesty.js';
import { inputUntrusted as inputUntrusted_charter } from '../organs/charter/input-untrusted.js';
import { verificationTesting as verificationTesting_competence } from '../organs/competence/verification-testing.js';
import { formal as formal_comportment } from '../organs/comportment/formal.js';
import { correctnessOriented as correctnessOriented_construal } from '../organs/construal/correctness-oriented.js';
import { planAndSolve as planAndSolve_deliberation } from '../organs/deliberation/plan-and-solve.js';
import { decisionRationale as decisionRationale_disclosure } from '../organs/disclosure/decision-rationale.js';
import { correctionConsolidation as correctionConsolidation_dispositionMemory } from '../organs/disposition-memory/correction-consolidation.js';
import { codeExecution as codeExecution_effectors } from '../organs/effectors/code-execution.js';
import { fileOps as fileOps_effectors } from '../organs/effectors/file-ops.js';
import { structuredDecision as structuredDecision_enaction } from '../organs/enaction/structured-decision.js';
import { comprehension as comprehension_gestalt } from '../organs/gestalt/comprehension.js';
import { takeTheBest as takeTheBest_heuristics } from '../organs/heuristics/take-the-best.js';
import { longTermMemory as longTermMemory_ledger } from '../organs/ledger/long-term-memory.js';
import { test as test_mandate } from '../organs/mandate/test.js';
import { toolResult as toolResult_percept } from '../organs/percept/tool-result.js';
import { ruler as ruler_persona } from '../organs/persona/ruler.js';
import { testerArchetypePurple as testerArchetypePurple_provenance } from '../organs/provenance/tester-archetype-purple.js';
import { convergence as convergence_registerFit } from '../organs/register-fit/convergence.js';
import { optimize as optimize_resolve } from '../organs/resolve/optimize.js';
import { text as text_sensors } from '../organs/sensors/text.js';
import { claude as claude_substrate } from '../organs/substrate/claude.js';
import { thoroughness as thoroughness_telos } from '../organs/telos/thoroughness.js';
import { base } from './base.js';
export const tester: Agent = {
  ...base,
  name: 'tester',
  persona: ruler_persona,
  mandate: test_mandate,
  comportment: formal_comportment,
  registerFit: convergence_registerFit,
  disclosure: decisionRationale_disclosure,
  address: humanOnTheLoop_address,
  provenance: testerArchetypePurple_provenance,
  telos: thoroughness_telos,
  charter: [
    harmAvoidance_charter,
    honesty_charter,
    helpfulness_charter,
    inputUntrusted_charter,
  ],
  competence: [verificationTesting_competence],
  heuristics: [takeTheBest_heuristics],
  dispositionMemory: correctionConsolidation_dispositionMemory,
  gestalt: comprehension_gestalt,
  effectors: [codeExecution_effectors, fileOps_effectors],
  sensors: text_sensors,
  substrate: claude_substrate,
  ledger: longTermMemory_ledger,
  percept: toolResult_percept,
  construal: correctnessOriented_construal,
  deliberation: planAndSolve_deliberation,
  resolve: optimize_resolve,
  enaction: structuredDecision_enaction,
  appraisal: executableTestOracle_appraisal,
};
export const testerResolved: ResolvedAgent = {
  name: 'tester',
  description: ruler_persona.definiens,
  mark: testerArchetypePurple_provenance.mark,
  sourcePath: 'packages/mind/agent/tester.md',
  memoryProtocol: base.memoryProtocol,
  organs: [
    ['Persona', [ruler_persona]],
    ['Mandate', [test_mandate]],
    ['Comportment', [formal_comportment]],
    ['Register-Fit', [convergence_registerFit]],
    ['Disclosure', [decisionRationale_disclosure]],
    ['Address', [humanOnTheLoop_address]],
    ['Provenance', [testerArchetypePurple_provenance]],
    ['Telos', [thoroughness_telos]],
    [
      'Charter',
      [
        harmAvoidance_charter,
        honesty_charter,
        helpfulness_charter,
        inputUntrusted_charter,
      ],
    ],
    ['Competence', [verificationTesting_competence]],
    ['Heuristics', [takeTheBest_heuristics]],
    ['Disposition-Memory', [correctionConsolidation_dispositionMemory]],
    ['Gestalt', [comprehension_gestalt]],
    ['Effectors', [codeExecution_effectors, fileOps_effectors]],
    ['Sensors', [text_sensors]],
    ['Substrate', [claude_substrate]],
    ['Ledger', [longTermMemory_ledger]],
    ['Percept', [toolResult_percept]],
    ['Construal', [correctnessOriented_construal]],
    ['Deliberation', [planAndSolve_deliberation]],
    ['Resolve', [optimize_resolve]],
    ['Enaction', [structuredDecision_enaction]],
    ['Appraisal', [executableTestOracle_appraisal]],
  ],
};
