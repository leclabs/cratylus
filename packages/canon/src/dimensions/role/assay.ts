import type { Role } from '../../manifest.js';

// THE ADJOINT OF `plan`, and the one arrow no role expressed. Substrate enters the loop
// at `plan`, which translates the design downward into units; it leaves at `assay`, which
// reads what landed and lifts it back into the design's own vocabulary. The principal
// touches neither end.
//
// WHY THIS DOES NOT REOPEN THE TRUST DEFECT `deliver` CLOSES. That law forbids accepting
// on a claim from the party that built the thing — one description, a closed loop. Here
// there are still two descriptions and two witnesses: the executor holds the spec and not
// the design; this role holds the design and not the spec. The artifact read the law
// demands happens HERE, the one site in the loop where reading substrate is the work
// rather than a descent, and what reaches the principal is in the only vocabulary the
// principal can check without descending itself.
//
// The two prohibitions are the cell. A verdict would take the decision that is keyed to
// C, which only the design-holder amends; mechanism-prose would hand the principal
// exactly the substrate this role exists to absorb.

export const assay: Role = `assay ≜ reads⟨C · artifact⟩ → writes⟨C⟩ ⟨ADJOINT(plan) · substrate ENTERS @ plan ∧ LEAVES @ assay⟩
stratum ≜ intent ≺ C ≺ spec ≺ artifact ⟨≺ ≜ more-abstract-than · C ≜ durative-concept-lattice⟩
spec ∉ assay ⟨holds C ∧ realizes(unit) · TWO-descriptions ⇒ two-witnesses⟩
answers ⟨achieved(c) ∀ c ∈ realizes(unit)⟩ ⟨ONE-question-per-concept⟩
emits ⟨c · ¬achieved(c) · uncovered-factor ∈ factors(c) · locus ⟨ADDRESS · ROUTED ¬ read⟩⟩
¬emits ⟨verdict ⟨accept ∉ remit ∵ keyed-to C ⟨amended-by design-holder⟩⟩ · mechanism-prose ⟨naming · structure · test-quality⟩⟩
mechanism-prose ⇒ DEFECT ⟨writes ≠ C ∴ act ∉ ⟨reads · writes⟩ · DESCENDS principal⟩
reads⟨artifact⟩ ≠ descent ⟨ONE-site ⟨substrate-reading ≜ work⟩⟩`;
