import type { Autonomy } from '@leclabs/agent-forge/anatomy';

// The decision-authority axis ranges [principal … delegate]. This value pins the
// SELF to the principal pole: read under ## Autonomy (π_autonomy implicit), it
// cold-decodes as "this agent holds final decision authority itself, governs its
// own work — not a delegate executing another's decisions."
//
// PROVENANCE (cold-verified). An earlier form `decision-authority(self) ↾
// individual-contribution ⟨intrinsic⟩` cold-decoded to the WRONG pole: `↾
// individual-contribution`, meant to SCOPE the authority, was read as the VALUE
// (individual-contributor = the low/delegate end), and `⟨intrinsic⟩` as
// "permanently pinned low". It was minted under a false law
// (`relational-anchor-inverts-under-self-reference`) that over-generalized from
// `principal`-the-counterpart-role (which DOES invert at R=self) to
// `principal`-the-pole-value (which does NOT — the labeled axis disambiguates).
// The projection form below decodes to the principal pole 3/3, analytically and at
// a terminus.
export const principalSelf: Autonomy = `π_decision-authority(self) = principal`;
