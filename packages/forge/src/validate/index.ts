// validate/ — the doctrine-agnostic acceptance ALGORITHM (forge ENGINE).
//
// The pure leg-witness gates behind the root model's `accept()` (MODEL.md): the static
// Universal floor (`accept.ts`), the σ*-residue predicate (`residue.ts`), and the live
// blind cold-oracle driver (`oracle.ts`). Every corpus-specific datum the algorithm
// reads — the palimpsest token table, the operator lexicon, the isolation script's repo
// path — is INJECTED (`policy.ts` declares the SHAPE); the DATA lives in the corpus.
// This module carries NO corpus doctrine — no specific palimpsest tokens, no operator
// glyphs.
//
// The STRUCTURAL leg of PARSIMONIOUS is NOT here, and that is the rule not the exception:
// its witnesses quantify over canon's `agents/`, name `ResolvedAgent`, and read canon's
// `mark:{emoji,hue}` token, so no injection could make it doctrine-agnostic. It lives
// with the corpus it gates, at `@cratylus/canon` `tooling/structural-parsimony.ts`.
//
// DISTINCT from `../core/exemplify` `accept` (the pipeline gate over an LLM-authored
// manifest): these share the word "accept" but are different concerns — the pipeline
// gate routes fragments, these witness a cell's Universal legs.

export * from './formal-block-self-sufficiency.js';
export * from './policy.js';
export * from './accept.js';
export * from './residue.js';
export * from './oracle.js';
