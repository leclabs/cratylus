// oracle.ts — the LIVE half of the acceptance gate: the priors-only BLIND
// cold-oracle driver. Wraps an ISOLATION script (fresh /tmp cwd OUTSIDE the repo +
// a credentials-only CLAUDE_CONFIG_DIR ⇒ no corpus/memory/root/registry reads) and
// exposes it as the authority for the two decode-shaped Universal legs:
//
//   COLD-BLIND : decode_cold(core f) = intent(f)
//   SIGNIFIED  : α's fired priors circumscribe the concept  (α = σ*)
//
// ISOLATION IS THE INVARIANT. A subagent is NOT cold (it inherits session context
// + the local agent-registry aliases); only this process-level isolation yields a
// true cold read. The `nonceControl` positive control PROVES the isolation holds:
// a freshly coined nonce must decode to its GENERIC prior — "not a real term" —
// NOT to any local registry gloss. If the corpus/registry leaked in, the nonce
// would come back glossed; it does not.
//
// This is the doctrine-agnostic ALGORITHM (agent-forge ENGINE): the isolation-driving
// protocol + the no-prior detection. The one corpus-coupled datum — WHICH isolation
// script (it carries the corpus's repo-path guard) — is INJECTED as `scriptPath`; the
// script itself is a corpus asset (agent-canon), never bundled here.
//
// These calls hit the network + a live model — SLOW and non-deterministic. They
// are NOT part of the hermetic `pnpm test` floor; the caller gates them behind
// `COLD_ORACLE_LIVE=1` (an integration lane). The static floor (`./accept.ts`)
// runs always; this oracle is the pre-land ceiling.

import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

export interface DecodeOpts {
  /** the isolation script that runs the cold, priors-only decode (injected corpus asset). */
  readonly scriptPath: string;
  /** model to pin for reproducibility (default: the script's default). */
  readonly model?: string;
  /** hard cap in ms (default 120_000). */
  readonly timeoutMs?: number;
}

/** decode_cold(text) — the isolated, priors-only cold read of a fragment. */
export function decodeCold(text: string, opts: DecodeOpts): string {
  const args = ['--raw', '--text', text];
  if (opts.model) {
    args.push('--model', opts.model);
  }
  return execFileSync('bash', [opts.scriptPath, ...args], {
    encoding: 'utf8',
    maxBuffer: 1 << 20,
    timeout: opts.timeoutMs ?? 120_000,
  }).trim();
}

/** The generic-prior "no established meaning" signals a cold reader emits. */
const NO_PRIOR = [
  /is ?n'?t a (real|standard|recognized|established|actual) (term|word)/i,
  /\bnonsense\b/i,
  /\bplaceholder\b/i,
  /\b(coined|made[-\s]?up|invented|fabricated|fictional)\b/i,
  /\bdo(es)? not (appear|exist)\b/i,
  /\bno (established|standard|recognized|dictionary|known) (meaning|definition|term)\b/i,
  /\bdon'?t (recognize|have) (this|any)\b/i,
  /\bnot a (word|term) I\b/i,
];

export interface NonceControl {
  readonly nonce: string;
  readonly decode: string;
  /** true ⇔ the decode reads as a generic no-prior term (isolation holds). */
  readonly isolated: boolean;
}

/**
 * The positive control: coin a fresh nonce (no generic prior, no registry entry)
 * and decode it cold. `isolated` ⇔ it comes back as an unknown/coined term — the
 * proof that NO corpus/registry gloss leaked into the reader. A false here means
 * the cold-oracle is warm (the whole gate is void), so the caller asserts it.
 */
export function nonceControl(opts: DecodeOpts): NonceControl {
  // hex-with-a-vowel-cluster: pronounceable enough to look like a term, yet has
  // zero dictionary/registry footprint — a clean unknown.
  const nonce = `zqfm${randomBytes(3).toString('hex')}brindlewax`;
  const decode = decodeCold(nonce, opts);
  return { nonce, decode, isolated: NO_PRIOR.some((re) => re.test(decode)) };
}
