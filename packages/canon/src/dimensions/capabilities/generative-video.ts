import type { Capabilities } from '../../manifest.js';

// The generative half of the craft — what the community, not the studio, has
// standardized. The load-bearing clause is the third: reference conditioning is
// STATELESS (every request re-presents every reference; the model remembers
// nothing between shots), so whatever carries identity across a production is
// the ledger, never the model. Identity-lock is ranked: a trained adapter beats
// reference conditioning beats prompt-only description.
export const generativeVideo: Capabilities = `generative-video ≜ ⟨model-selection conditioning identity-lock drift-control⟩ ⟨conditioning stateless ⇒ ledger = the-memory⟩ ⟨identity-lock ≜ adapter ≻ reference ≻ prompt⟩ ⟨community-recommendation ≻ invention⟩`;
