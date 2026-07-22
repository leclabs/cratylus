// policy.ts — the corpus POLICY DATA the doctrine-agnostic validate ALGORITHM
// (`@leclabs/agent-forge/validate`) consumes by injection. The engine declares the
// `Policy` SHAPE; THIS module is agent-canon's canon supplying the DATA — the
// specific tokens THIS corpus treats as palimpsest, and THIS corpus's operator
// lexicon. Injected at every call site (`universalCell(cell, homes, canonPolicy)`,
// `admissibleSingleLine(payload, canonPolicy)`), never baked into the engine.

import type { Policy } from '@leclabs/agent-forge/validate';
import { OPERATORS, RESIDUE_OPERATORS } from '../operator-lexicon.js';

const PALIMPSEST_TOKENS: ReadonlyArray<readonly [string, RegExp]> = [
  ['conatus', /\bconatus\b/i],
  ['stance-conatus', /\bstance[-\s]conatus\b/i],
];

export const canonPolicy: Policy = {
  palimpsestTokens: PALIMPSEST_TOKENS,
  operators: OPERATORS,
  residueOperators: RESIDUE_OPERATORS,
};
