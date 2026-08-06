// policy.ts — the corpus POLICY DATA the doctrine-agnostic validate ALGORITHM
// (`@cratylus/forge/validate`) consumes by injection. The engine declares the
// `Policy` SHAPE; THIS module is canon's canon supplying the DATA — the
// specific tokens THIS corpus treats as palimpsest, THIS corpus's operator
// lexicon, and the language THIS corpus's cold reader answers in. Injected at
// every call site (`universalCell(cell, homes, canonPolicy)`,
// `admissibleSingleLine(payload, canonPolicy)`, `./oracle.ts`), never baked
// into the engine.

import type { Policy, RegisterPolicy } from '@cratylus/forge/validate';
import { OPERATORS, RESIDUE_OPERATORS } from '../../operator-lexicon.js';

const PALIMPSEST_TOKENS: ReadonlyArray<readonly [string, RegExp]> = [
  ['conatus', /\bconatus\b/i],
  ['stance-conatus', /\bstance[-\s]conatus\b/i],
];

/**
 * The generic-prior "no established meaning" phrasings THIS corpus's cold reader
 * emits. English, because this corpus is authored in English — which is exactly
 * why the engine cannot hold them: `nonceControl` detects a generic prior, it does
 * not know which language the reader answers in.
 */
const NO_PRIOR_MARKERS: readonly RegExp[] = [
  /is ?n'?t a (real|standard|recognized|established|actual) (term|word)/i,
  /\bnonsense\b/i,
  /\bplaceholder\b/i,
  /\b(coined|made[-\s]?up|invented|fabricated|fictional)\b/i,
  /\bdo(es)? not (appear|exist)\b/i,
  /\bno (established|standard|recognized|dictionary|known) (meaning|definition|term)\b/i,
  /\bdon'?t (recognize|have) (this|any)\b/i,
  /\bnot a (word|term) I\b/i,
];

/**
 * THIS corpus's human-register doctrine for the `conform` classifier — the
 * politeness/narrative/courtesy lexicon an R=LLM body carries at density 0. Its
 * richer sibling is `test/reader-register.ts` (hedge · second-person · FPP), which
 * scores the corpus's own static surfaces; this is the greppable under-approximation
 * the exemplify pipeline gates emitted artifacts with. Both are canon's, because
 * both are claims about English and about this corpus's prose.
 *
 * The two floors are a CALIBRATION, not a constant: `humanHitFloor` is the absolute
 * count above which prose reads courteous, `humanDensityFloor` catches the short
 * courteous paragraph that never reaches it.
 */
const REGISTER: RegisterPolicy = {
  humanMarkers: [
    /\bplease\b/gi,
    /\bthanks?\b/gi,
    /\bthank you\b/gi,
    /\bhi there\b/gi,
    /\bwelcome\b/gi,
    /\bfeel free\b/gi,
    /\bdid we mention\b/gi,
    /\bwe (?:would|really|care|repeat|prefer|like|appreciate)\b/gi,
    /\bremember to\b/gi,
    /\bso, /gi,
    /\bagain: /gi,
    /\ba lot\b/gi,
    /!(?=\s|$)/g,
  ],
  humanHitFloor: 3,
  humanDensityFloor: 0.02,
};

export const canonPolicy: Policy = {
  palimpsestTokens: PALIMPSEST_TOKENS,
  operators: OPERATORS,
  residueOperators: RESIDUE_OPERATORS,
  noPriorMarkers: NO_PRIOR_MARKERS,
  register: REGISTER,
};
