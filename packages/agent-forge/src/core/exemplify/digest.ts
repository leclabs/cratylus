import { createHash } from 'node:crypto';

/**
 * `fragment_digest` — the R3 manifest key for a concept: sha256 over the
 * canonicalized text (NFC + whitespace-collapse + trim), `sha256:`-prefixed.
 * Canonicalization makes the digest a semantic-identity key across
 * re-serializations, which is what idempotence (`reuse` dispositions) keys on.
 */
export function fragmentDigest(text: string): string {
  const canonical = text.normalize('NFC').replace(/\s+/g, ' ').trim();
  return `sha256:${createHash('sha256').update(canonical, 'utf8').digest('hex')}`;
}

/** The same canonicalization used for containment checks (REC's mechanical
 *  leg, replacement no-loss): NFC + whitespace-collapse + trim. */
export function canonicalText(text: string): string {
  return text.normalize('NFC').replace(/\s+/g, ' ').trim();
}
