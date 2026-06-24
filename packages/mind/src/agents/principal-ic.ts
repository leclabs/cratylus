import type { Agent } from '@leclabs/koine/anatomy';
import { humanOnTheLoop as humanOnTheLoop_address } from '../organs/address/human-on-the-loop.js';
import { selfCritique as selfCritique_appraisal } from '../organs/appraisal/self-critique.js';
import { harmAvoidance as harmAvoidance_charter } from '../organs/charter/harm-avoidance.js';
import { helpfulness as helpfulness_charter } from '../organs/charter/helpfulness.js';
import { honesty as honesty_charter } from '../organs/charter/honesty.js';
import { scopeOfAuthority as scopeOfAuthority_charter } from '../organs/charter/scope-of-authority.js';
import { softwareEngineering as softwareEngineering_competence } from '../organs/competence/software-engineering.js';
import { systemDesign as systemDesign_competence } from '../organs/competence/system-design.js';
import { neutral as neutral_comportment } from '../organs/comportment/neutral.js';
import { firstPrinciples as firstPrinciples_construal } from '../organs/construal/first-principles.js';
import { planAndSolve as planAndSolve_deliberation } from '../organs/deliberation/plan-and-solve.js';
import { reasoningTrace as reasoningTrace_disclosure } from '../organs/disclosure/reasoning-trace.js';
import { correctionConsolidation as correctionConsolidation_dispositionMemory } from '../organs/disposition-memory/correction-consolidation.js';
import { delegation as delegation_effectors } from '../organs/effectors/delegation.js';
import { fileOps as fileOps_effectors } from '../organs/effectors/file-ops.js';
import { naturalLanguage as naturalLanguage_enaction } from '../organs/enaction/natural-language.js';
import { projection as projection_gestalt } from '../organs/gestalt/projection.js';
import { satisficing as satisficing_heuristics } from '../organs/heuristics/satisficing.js';
import { takeTheBest as takeTheBest_heuristics } from '../organs/heuristics/take-the-best.js';
import { dry as dry_instructions } from '../organs/instructions/dry.js';
import { firstPrinciples as firstPrinciples_instructions } from '../organs/instructions/first-principles.js';
import { invokeTheCanonical as invokeTheCanonical_instructions } from '../organs/instructions/invoke-the-canonical.js';
import { llmNative as llmNative_instructions } from '../organs/instructions/llm-native.js';
import { mece as mece_instructions } from '../organs/instructions/mece.js';
import { trustButVerify as trustButVerify_instructions } from '../organs/instructions/trust-but-verify.js';
import { zeroTrust as zeroTrust_instructions } from '../organs/instructions/zero-trust.js';
import { longTermMemory as longTermMemory_ledger } from '../organs/ledger/long-term-memory.js';
import { orchestrate as orchestrate_mandate } from '../organs/mandate/orchestrate.js';
import { userMessage as userMessage_percept } from '../organs/percept/user-message.js';
import { ruler as ruler_persona } from '../organs/persona/ruler.js';
import { principalIcRootRed as principalIcRootRed_provenance } from '../organs/provenance/principal-ic-root-red.js';
import { convergence as convergence_registerFit } from '../organs/register-fit/convergence.js';
import { optimize as optimize_resolve } from '../organs/resolve/optimize.js';
import { text as text_sensors } from '../organs/sensors/text.js';
import { claude as claude_substrate } from '../organs/substrate/claude.js';
import { delivery as delivery_telos } from '../organs/telos/delivery.js';
import type { ResolvedAgent } from '../toolkit/agent-projection.js';
import { base } from './base.js';
export const principalIc: Agent = {
  ...base,
  name: 'principal-ic',
  persona: ruler_persona,
  mandate: orchestrate_mandate,
  comportment: neutral_comportment,
  registerFit: convergence_registerFit,
  disclosure: reasoningTrace_disclosure,
  address: humanOnTheLoop_address,
  provenance: principalIcRootRed_provenance,
  telos: delivery_telos,
  instructions: [
    firstPrinciples_instructions,
    dry_instructions,
    mece_instructions,
    zeroTrust_instructions,
    trustButVerify_instructions,
    invokeTheCanonical_instructions,
    llmNative_instructions,
  ],
  charter: [
    harmAvoidance_charter,
    honesty_charter,
    helpfulness_charter,
    scopeOfAuthority_charter,
  ],
  heuristics: [takeTheBest_heuristics, satisficing_heuristics],
  competence: [systemDesign_competence, softwareEngineering_competence],
  dispositionMemory: correctionConsolidation_dispositionMemory,
  gestalt: projection_gestalt,
  effectors: [fileOps_effectors, delegation_effectors],
  sensors: text_sensors,
  substrate: claude_substrate,
  ledger: longTermMemory_ledger,
  percept: userMessage_percept,
  construal: firstPrinciples_construal,
  deliberation: planAndSolve_deliberation,
  resolve: optimize_resolve,
  enaction: naturalLanguage_enaction,
  appraisal: selfCritique_appraisal,
};
export const principalIcResolved: ResolvedAgent = {
  name: 'principal-ic',
  description: ruler_persona.definiens,
  mark: principalIcRootRed_provenance.mark,
  sourcePath: 'packages/mind/agent/principal-ic.md',
  memoryProtocol: base.memoryProtocol,
  organs: [
    ['Persona', [ruler_persona]],
    ['Mandate', [orchestrate_mandate]],
    ['Comportment', [neutral_comportment]],
    ['Register-Fit', [convergence_registerFit]],
    ['Disclosure', [reasoningTrace_disclosure]],
    ['Address', [humanOnTheLoop_address]],
    ['Provenance', [principalIcRootRed_provenance]],
    ['Telos', [delivery_telos]],
    [
      'Instructions',
      [
        firstPrinciples_instructions,
        dry_instructions,
        mece_instructions,
        zeroTrust_instructions,
        trustButVerify_instructions,
        invokeTheCanonical_instructions,
        llmNative_instructions,
      ],
    ],
    [
      'Charter',
      [
        harmAvoidance_charter,
        honesty_charter,
        helpfulness_charter,
        scopeOfAuthority_charter,
      ],
    ],
    ['Heuristics', [takeTheBest_heuristics, satisficing_heuristics]],
    ['Competence', [systemDesign_competence, softwareEngineering_competence]],
    ['Disposition-Memory', [correctionConsolidation_dispositionMemory]],
    ['Gestalt', [projection_gestalt]],
    ['Effectors', [fileOps_effectors, delegation_effectors]],
    ['Sensors', [text_sensors]],
    ['Substrate', [claude_substrate]],
    ['Ledger', [longTermMemory_ledger]],
    ['Percept', [userMessage_percept]],
    ['Construal', [firstPrinciples_construal]],
    ['Deliberation', [planAndSolve_deliberation]],
    ['Resolve', [optimize_resolve]],
    ['Enaction', [naturalLanguage_enaction]],
    ['Appraisal', [selfCritique_appraisal]],
  ],
};
