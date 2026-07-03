/**
 * The mechanical register classifier behind the gate's `conform` predicate
 * (`register(a) = ρ(a)`; ρ = LLM for every pipeline artifact).
 *
 * SEMANTIC SEAM: true register judgment is the reader's (an LLM pass). This
 * classifier is the greppable invariant of the human register — the
 * politeness/narrative marker lexicon that R=LLM bodies carry at density 0 —
 * so the gate can refuse a human-register emission deterministically. It is
 * an under-approximation by design: passing it is necessary, not sufficient.
 */

export type Register = 'LLM' | 'human';

/** Human-register markers: politeness, narrative filler, courtesy address. */
const HUMAN_MARKERS: readonly RegExp[] = [
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
];

/** Every human-register marker hit in `text` (the refusal's evidence list). */
export function humanMarkerHits(text: string): string[] {
  const hits: string[] = [];
  for (const marker of HUMAN_MARKERS) {
    for (const m of text.matchAll(marker)) hits.push(m[0]);
  }
  return hits;
}

/**
 * Classify a body's register. Human ⇔ marker count ≥ 3, or ≥ 1 with marker
 * density ≥ 2 per 100 words (a short courteous paragraph is human even with
 * few absolute hits). Everything else is LLM.
 */
export function classifyRegister(text: string): Register {
  const hits = humanMarkerHits(text).length;
  const words = text.split(/\s+/).filter(Boolean).length || 1;
  return hits >= 3 || (hits >= 1 && hits / words >= 0.02) ? 'human' : 'LLM';
}
