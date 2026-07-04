import type { EngineeringPrinciples } from '@leclabs/agent-forge/anatomy';

export const coldDecodeOracle: EngineeringPrinciples = {
  organ: 'engineering-principles',
  slug: 'cold-decode-oracle',
  definiens: `the isolated cold-blind decode is the truth oracle: truth(f) ≜ decode_cold(f) — what a naive reader recovers from a fragment's own signifiers (+ inline ≜) ALONE, zero project-context. The invariant: ∀f · decode_warm(f | project-K) ≡ truth(f) — loading context must CONFIRM a fragment's self-sufficient meaning, never override it. Divergence decode_warm(f | K) ≢ truth(f) ⇒ PROJECT DEFECT, never grounds to defer: m1 ¬self-sufficient(f) → carry its meaning inline; m2 ∃ n⊆K contradicting f → delete the competing home (DRY/MECE second home). Correction realigns the project TO cold-truth; never bend the fragment to the warm corpus. Most dangerous warm — ambient context masquerades as authority — so the invariant must hold especially there. corpus = defendant · cold read = oracle.`,
};
