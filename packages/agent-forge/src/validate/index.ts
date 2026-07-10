// validate/ — the doctrine-agnostic acceptance ALGORITHM (agent-forge ENGINE).
//
// The pure leg-witness gates behind the root model's `accept()` (MODEL.md): the
// static Universal floor (`accept.ts`), the σ*-residue predicate (`residue.ts`), the
// structural-parsimony leg (`structural-parsimony.ts`), and the live blind cold-oracle
// driver (`oracle.ts`). Every corpus-specific datum the algorithm reads — the
// palimpsest token table, the operator lexicon, the isolation script's repo path — is
// INJECTED (`policy.ts` declares the SHAPE); the DATA lives in the corpus. This module
// carries NO corpus doctrine — no specific palimpsest tokens, no operator glyphs.
//
// DISTINCT from `../core/exemplify` `accept` (the pipeline gate over an LLM-authored
// manifest): these share the word "accept" but are different concerns — the pipeline
// gate routes fragments, these witness a cell's Universal legs.

export * from './policy.js';
export * from './accept.js';
export * from './residue.js';
export * from './structural-parsimony.js';
export * from './oracle.js';
