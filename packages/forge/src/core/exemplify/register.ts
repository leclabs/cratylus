/**
 * The mechanical register classifier behind the gate's `conform` predicate
 * (`register(a) = ρ(a)`; ρ = LLM for every pipeline artifact).
 *
 * SEMANTIC SEAM: true register judgment is the reader's (an LLM pass). This
 * classifier is the greppable invariant of the human register — the
 * politeness/narrative marker lexicon that R=LLM bodies carry at density 0 —
 * so the gate can refuse a human-register emission deterministically. It is
 * an under-approximation by design: passing it is necessary, not sufficient.
 *
 * DOCTRINE IS INJECTED. The marker lexicon and the two floors are the CORPUS's
 * ({@link RegisterPolicy}, supplied through `Policy.register`), never the
 * projector's: the lexicon is a set of phrasings in one natural language, and the
 * floors are a calibration swept from one corpus's prose. This module owns only
 * the predicate that reads them — there is no default here, because a default
 * would be a doctrine-agnostic module deciding what "human" reads like.
 */

import type { RegisterPolicy } from '../../validate/policy.js';

export type { RegisterPolicy };

export type Register = 'LLM' | 'human';

/** Every human-register marker hit in `text` (the refusal's evidence list). */
export function humanMarkerHits(
  text: string,
  policy: RegisterPolicy,
): string[] {
  const hits: string[] = [];
  for (const marker of policy.humanMarkers) {
    for (const m of text.matchAll(marker)) hits.push(m[0]);
  }
  return hits;
}

/**
 * Classify a body's register against the corpus's own doctrine. Human ⇔ marker
 * count ≥ `humanHitFloor`, or ≥ 1 with marker density ≥ `humanDensityFloor` (a
 * short courteous paragraph is human even with few absolute hits). Everything
 * else is LLM.
 */
export function classifyRegister(
  text: string,
  policy: RegisterPolicy,
): Register {
  const hits = humanMarkerHits(text, policy).length;
  const words = text.split(/\s+/).filter(Boolean).length || 1;
  return hits >= policy.humanHitFloor ||
    (hits >= 1 && hits / words >= policy.humanDensityFloor)
    ? 'human'
    : 'LLM';
}
