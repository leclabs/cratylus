// policy.ts — the corpus DATA the doctrine-agnostic cold-oracle driver
// (`@cratylus/forge/validate`) consumes by injection: the language THIS corpus's cold
// reader answers in, and the bounded context THIS corpus's own cells are read in.
// Injected by `./oracle.ts`, never baked into the engine.

import type { BoundedContext } from '@cratylus/forge/validate';

/**
 * The bounded context the corpus's own cells are read in: a cold read of one of them
 * gives the reader the sign with this context's name and subject.
 */
export const corpusContext: BoundedContext = {
  name: 'corpus',
  subject:
    'the agent semantics cratylus ships, written once in signs a model reads as meant',
};

/**
 * The generic-prior "no established meaning" phrasings THIS corpus's cold reader
 * emits. English, because this corpus is authored in English — which is exactly
 * why the engine cannot hold them: `nonceControl` detects a generic prior, it does
 * not know which language the reader answers in.
 */
export const noPriorMarkers: readonly RegExp[] = [
  /is ?n'?t a (real|standard|recognized|established|actual) (term|word)/i,
  /\bnonsense\b/i,
  /\bplaceholder\b/i,
  /\b(coined|made[-\s]?up|invented|fabricated|fictional)\b/i,
  /\bdo(es)? not (appear|exist)\b/i,
  /\bno (established|standard|recognized|dictionary|known) (meaning|definition|term)\b/i,
  /\bdon'?t (recognize|have) (this|any)\b/i,
  /\bnot a (word|term) I\b/i,
];
