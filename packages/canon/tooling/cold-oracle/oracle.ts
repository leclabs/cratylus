// oracle.ts — canon's policy binding for the LIVE blind cold-oracle. The
// pure isolation-driving ALGORITHM lives in the engine
// (`@cratylus/forge/validate` `oracle.ts`); THIS module injects the two
// corpus-coupled data it needs — WHICH isolation script, bound to the
// manifest-owned `./cold-oracle.sh` (the script carries this corpus's repo-path guard
// + credentials/isolation protocol), and WHICH no-prior lexicon, taken from
// `canonPolicy` so the corpus declares it in ONE place. Callers name the bounded context
// the text is read in (`nonceControl({ context: corpusContext })` for this corpus's own
// cells, `./policy.ts`) and keep the rest of the surface (`model`, `timeoutMs`); the
// script and the lexicon are bound here, never passed by them.

import { fileURLToPath } from 'node:url';
import {
  type DecodeOpts,
  type NonceControl,
  decodeCold as decodeColdEngine,
  nonceControl as nonceControlEngine,
} from '@cratylus/forge/validate';
import { canonPolicy } from './policy.js';

export type { NonceControl };
/** The caller-facing options — the injected `scriptPath` is bound here; the caller names
 *  the bounded context. */
export type ColdOracleOpts = Omit<DecodeOpts, 'scriptPath'>;

/** The manifest-owned isolation script (carries the repo-path guard — corpus policy). */
const SCRIPT_PATH = fileURLToPath(new URL('./cold-oracle.sh', import.meta.url));

/** decode_cold(text, κ) — the isolated, priors-only cold read in the named bounded
 *  context, bound to the corpus script. */
export function decodeCold(text: string, opts: ColdOracleOpts): string {
  return decodeColdEngine(text, { ...opts, scriptPath: SCRIPT_PATH });
}

/** The nonce positive control — proof the corpus/registry did not leak into the reader. */
export function nonceControl(opts: ColdOracleOpts): NonceControl {
  return nonceControlEngine({
    ...opts,
    scriptPath: SCRIPT_PATH,
    noPriorMarkers: canonPolicy.noPriorMarkers,
  });
}
