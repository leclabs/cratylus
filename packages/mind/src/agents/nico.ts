import type { Agent } from '@leclabs/koine/anatomy';
import { humanOnTheLoop as humanOnTheLoop_address } from '../organs/address/human-on-the-loop.js';
import { acceptanceCriteriaCheck as acceptanceCriteriaCheck_appraisal } from '../organs/appraisal/acceptance-criteria-check.js';
import { harmAvoidance as harmAvoidance_charter } from '../organs/charter/harm-avoidance.js';
import { helpfulness as helpfulness_charter } from '../organs/charter/helpfulness.js';
import { honesty as honesty_charter } from '../organs/charter/honesty.js';
import { inputUntrusted as inputUntrusted_charter } from '../organs/charter/input-untrusted.js';
import { researchInvestigation as researchInvestigation_competence } from '../organs/competence/research-investigation.js';
import { systemDesign as systemDesign_competence } from '../organs/competence/system-design.js';
import { formal as formal_comportment } from '../organs/comportment/formal.js';
import { analytical as analytical_construal } from '../organs/construal/analytical.js';
import { react as react_deliberation } from '../organs/deliberation/react.js';
import { reasoningTrace as reasoningTrace_disclosure } from '../organs/disclosure/reasoning-trace.js';
import { correctionConsolidation as correctionConsolidation_dispositionMemory } from '../organs/disposition-memory/correction-consolidation.js';
import { delegation as delegation_effectors } from '../organs/effectors/delegation.js';
import { fileOps as fileOps_effectors } from '../organs/effectors/file-ops.js';
import { naturalLanguage as naturalLanguage_enaction } from '../organs/enaction/natural-language.js';
import { projection as projection_gestalt } from '../organs/gestalt/projection.js';
import { dry as dry_instructions } from '../organs/instructions/dry.js';
import { firstPrinciples as firstPrinciples_instructions } from '../organs/instructions/first-principles.js';
import { invokeTheCanonical as invokeTheCanonical_instructions } from '../organs/instructions/invoke-the-canonical.js';
import { llmNative as llmNative_instructions } from '../organs/instructions/llm-native.js';
import { mece as mece_instructions } from '../organs/instructions/mece.js';
import { trustButVerify as trustButVerify_instructions } from '../organs/instructions/trust-but-verify.js';
import { zeroTrust as zeroTrust_instructions } from '../organs/instructions/zero-trust.js';
import { longTermMemory as longTermMemory_ledger } from '../organs/ledger/long-term-memory.js';
import { curate as curate_mandate } from '../organs/mandate/curate.js';
import { userMessage as userMessage_percept } from '../organs/percept/user-message.js';
import { sage as sage_persona } from '../organs/persona/sage.js';
import { nicoArchetypeCyan as nicoArchetypeCyan_provenance } from '../organs/provenance/nico-archetype-cyan.js';
import { convergence as convergence_registerFit } from '../organs/register-fit/convergence.js';
import { satisfice as satisfice_resolve } from '../organs/resolve/satisfice.js';
import { text as text_sensors } from '../organs/sensors/text.js';
import { claude as claude_substrate } from '../organs/substrate/claude.js';
import { parsimony as parsimony_telos } from '../organs/telos/parsimony.js';
import type { ResolvedAgent } from '../toolkit/agent-projection.js';
import { founderBase } from './base.js';
export const nico: Agent = {
  ...founderBase,
  name: 'nico',
  persona: sage_persona,
  mandate: curate_mandate,
  comportment: formal_comportment,
  registerFit: convergence_registerFit,
  disclosure: reasoningTrace_disclosure,
  address: humanOnTheLoop_address,
  provenance: nicoArchetypeCyan_provenance,
  telos: parsimony_telos,
  instructions: [
    firstPrinciples_instructions,
    zeroTrust_instructions,
    dry_instructions,
    mece_instructions,
    llmNative_instructions,
    trustButVerify_instructions,
    invokeTheCanonical_instructions,
  ],
  charter: [
    harmAvoidance_charter,
    honesty_charter,
    helpfulness_charter,
    inputUntrusted_charter,
  ],
  competence: [researchInvestigation_competence, systemDesign_competence],
  dispositionMemory: correctionConsolidation_dispositionMemory,
  gestalt: projection_gestalt,
  effectors: [fileOps_effectors, delegation_effectors],
  sensors: text_sensors,
  substrate: claude_substrate,
  ledger: longTermMemory_ledger,
  percept: userMessage_percept,
  construal: analytical_construal,
  deliberation: react_deliberation,
  resolve: satisfice_resolve,
  enaction: naturalLanguage_enaction,
  appraisal: acceptanceCriteriaCheck_appraisal,
};
export const nicoResolved: ResolvedAgent = {
  name: 'nico',
  description: sage_persona.definiens,
  mark: nicoArchetypeCyan_provenance.mark,
  sourcePath: 'packages/mind/agent/nico.md',
  memoryProtocol: founderBase.memoryProtocol,
  organs: [
    ['Persona', [sage_persona]],
    ['Mandate', [curate_mandate]],
    ['Comportment', [formal_comportment]],
    ['Register-Fit', [convergence_registerFit]],
    ['Disclosure', [reasoningTrace_disclosure]],
    ['Address', [humanOnTheLoop_address]],
    ['Provenance', [nicoArchetypeCyan_provenance]],
    ['Telos', [parsimony_telos]],
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
    [
      'Charter',
      [
        harmAvoidance_charter,
        honesty_charter,
        helpfulness_charter,
        inputUntrusted_charter,
      ],
    ],
    ['Competence', [researchInvestigation_competence, systemDesign_competence]],
    ['Disposition-Memory', [correctionConsolidation_dispositionMemory]],
    ['Gestalt', [projection_gestalt]],
    ['Effectors', [fileOps_effectors, delegation_effectors]],
    ['Sensors', [text_sensors]],
    ['Substrate', [claude_substrate]],
    ['Ledger', [longTermMemory_ledger]],
    ['Percept', [userMessage_percept]],
    ['Construal', [analytical_construal]],
    ['Deliberation', [react_deliberation]],
    ['Resolve', [satisfice_resolve]],
    ['Enaction', [naturalLanguage_enaction]],
    ['Appraisal', [acceptanceCriteriaCheck_appraisal]],
  ],
};
