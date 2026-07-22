// policy.ts — the corpus POLICY DATA the doctrine-agnostic validate ALGORITHM
// (`@leclabs/agent-forge/validate`) consumes by injection. The engine declares the
// `Policy` SHAPE; THIS module is agent-canon's canon supplying the DATA — the
// specific tokens THIS corpus treats as palimpsest, and THIS corpus's operator
// lexicon. Injected at every call site (`universalCell(cell, homes, anatomyPolicy)`,
// `admissibleSingleLine(payload, anatomyPolicy)`), never baked into the engine.

import type { Policy } from '@leclabs/agent-forge/validate';
import { OPERATORS, RESIDUE_OPERATORS } from '../operator-lexicon.js';

/**
 * Retired framing tokens — a superseded layer this corpus once used (the `polis`/
 * `oikos`/`conatus` founding-doctrine lexicon), not present in a clean cell. CANONICAL
 * convicts a cell whose body still carries one. Corpus doctrine — lives HERE, never in
 * the engine.
 */
const PALIMPSEST_TOKENS: ReadonlyArray<readonly [string, RegExp]> = [
  ['polis', /\bpolis\b/i],
  ['oikos', /\boikos\b/i],
  ['conatus', /\bconatus\b/i],
  ['stance-conatus', /\bstance[-\s]conatus\b/i],
];

/**
 * The single corpus-policy bundle threaded to every validate gate: `palimpsestTokens`
 * (CANONICAL) · `operators` + `residueOperators` (RESIDUE — the operator lexicon, one
 * home in `../operator-lexicon.ts`).
 */
export const anatomyPolicy: Policy = {
  palimpsestTokens: PALIMPSEST_TOKENS,
  operators: OPERATORS,
  residueOperators: RESIDUE_OPERATORS,
};
