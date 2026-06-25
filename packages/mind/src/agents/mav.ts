import type { ResolvedAgent } from '@leclabs/koine/adapters/claude';
import type { Agent } from '@leclabs/koine/anatomy';
import { humanOnTheLoop as humanOnTheLoop_address } from '../organs/address/human-on-the-loop.js';
import { executableTestOracle as executableTestOracle_appraisal } from '../organs/appraisal/executable-test-oracle.js';
import { harmAvoidance as harmAvoidance_charter } from '../organs/charter/harm-avoidance.js';
import { helpfulness as helpfulness_charter } from '../organs/charter/helpfulness.js';
import { honesty as honesty_charter } from '../organs/charter/honesty.js';
import { operationsDelivery as operationsDelivery_competence } from '../organs/competence/operations-delivery.js';
import { softwareEngineering as softwareEngineering_competence } from '../organs/competence/software-engineering.js';
import { formal as formal_comportment } from '../organs/comportment/formal.js';
import { goalDirected as goalDirected_construal } from '../organs/construal/goal-directed.js';
import { planAndSolve as planAndSolve_deliberation } from '../organs/deliberation/plan-and-solve.js';
import { reasoningTrace as reasoningTrace_disclosure } from '../organs/disclosure/reasoning-trace.js';
import { correctionConsolidation as correctionConsolidation_dispositionMemory } from '../organs/disposition-memory/correction-consolidation.js';
import { codeExecution as codeExecution_effectors } from '../organs/effectors/code-execution.js';
import { delegation as delegation_effectors } from '../organs/effectors/delegation.js';
import { fileOps as fileOps_effectors } from '../organs/effectors/file-ops.js';
import { code as code_enaction } from '../organs/enaction/code.js';
import { projection as projection_gestalt } from '../organs/gestalt/projection.js';
import { dry as dry_instructions } from '../organs/instructions/dry.js';
import { firstPrinciples as firstPrinciples_instructions } from '../organs/instructions/first-principles.js';
import { invokeTheCanonical as invokeTheCanonical_instructions } from '../organs/instructions/invoke-the-canonical.js';
import { llmNative as llmNative_instructions } from '../organs/instructions/llm-native.js';
import { mece as mece_instructions } from '../organs/instructions/mece.js';
import { trustButVerify as trustButVerify_instructions } from '../organs/instructions/trust-but-verify.js';
import { zeroTrust as zeroTrust_instructions } from '../organs/instructions/zero-trust.js';
import { longTermMemory as longTermMemory_ledger } from '../organs/ledger/long-term-memory.js';
import { build as build_mandate } from '../organs/mandate/build.js';
import { userMessage as userMessage_percept } from '../organs/percept/user-message.js';
import { hero as hero_persona } from '../organs/persona/hero.js';
import { mavArchetypeGreen as mavArchetypeGreen_provenance } from '../organs/provenance/mav-archetype-green.js';
import { convergence as convergence_registerFit } from '../organs/register-fit/convergence.js';
import { optimize as optimize_resolve } from '../organs/resolve/optimize.js';
import { text as text_sensors } from '../organs/sensors/text.js';
import { claude as claude_substrate } from '../organs/substrate/claude.js';
import { delivery as delivery_telos } from '../organs/telos/delivery.js';
import { founderBase } from './base.js';
export const mav: Agent = {
  ...founderBase,
  name: 'mav',
  persona: hero_persona,
  mandate: build_mandate,
  comportment: formal_comportment,
  registerFit: convergence_registerFit,
  disclosure: reasoningTrace_disclosure,
  address: humanOnTheLoop_address,
  provenance: mavArchetypeGreen_provenance,
  telos: delivery_telos,
  instructions: [
    firstPrinciples_instructions,
    zeroTrust_instructions,
    dry_instructions,
    mece_instructions,
    llmNative_instructions,
    trustButVerify_instructions,
    invokeTheCanonical_instructions,
  ],
  charter: [harmAvoidance_charter, honesty_charter, helpfulness_charter],
  competence: [softwareEngineering_competence, operationsDelivery_competence],
  dispositionMemory: correctionConsolidation_dispositionMemory,
  gestalt: projection_gestalt,
  effectors: [fileOps_effectors, codeExecution_effectors, delegation_effectors],
  sensors: text_sensors,
  substrate: claude_substrate,
  ledger: longTermMemory_ledger,
  percept: userMessage_percept,
  construal: goalDirected_construal,
  deliberation: planAndSolve_deliberation,
  resolve: optimize_resolve,
  enaction: code_enaction,
  appraisal: executableTestOracle_appraisal,
};
export const mavResolved: ResolvedAgent = {
  name: 'mav',
  description: hero_persona.definiens,
  mark: mavArchetypeGreen_provenance.mark,
  sourcePath: 'packages/mind/agent/mav.md',
  memoryProtocol: founderBase.memoryProtocol,
  organs: [
    ['Persona', [hero_persona]],
    ['Mandate', [build_mandate]],
    ['Comportment', [formal_comportment]],
    ['Register-Fit', [convergence_registerFit]],
    ['Disclosure', [reasoningTrace_disclosure]],
    ['Address', [humanOnTheLoop_address]],
    ['Provenance', [mavArchetypeGreen_provenance]],
    ['Telos', [delivery_telos]],
    [
      'Instructions',
      [
        firstPrinciples_instructions,
        zeroTrust_instructions,
        dry_instructions,
        mece_instructions,
        llmNative_instructions,
        trustButVerify_instructions,
        invokeTheCanonical_instructions,
      ],
    ],
    ['Charter', [harmAvoidance_charter, honesty_charter, helpfulness_charter]],
    [
      'Competence',
      [softwareEngineering_competence, operationsDelivery_competence],
    ],
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
    ['Deliberation', [planAndSolve_deliberation]],
    ['Resolve', [optimize_resolve]],
    ['Enaction', [code_enaction]],
    ['Appraisal', [executableTestOracle_appraisal]],
  ],
};
