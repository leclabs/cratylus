// validate/ — the live blind cold-oracle driver (`oracle.ts`), the doctrine-agnostic
// half of the cold-decode oracle. Every corpus-specific datum it reads — the isolation
// script's path, the no-prior lexicon, the bounded context a cold read is given — is
// INJECTED by the corpus; this module carries no corpus doctrine.

export * from './oracle.js';
