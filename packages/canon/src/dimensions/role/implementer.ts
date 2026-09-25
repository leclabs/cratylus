import type { Role } from '../../manifest.js';

// The bottom arrow, and the only one that writes the substrate. `C ∉ implementer` is not
// a deprivation: it is half of the two-description property that makes validation an
// operation at all. An executor holding the design would be checking its own work
// against its own terms, which is the closed loop the ladder exists to open.

export const implementer: Role = `implementer ≜ reads⟨spec · artifact⟩ → writes⟨artifact⟩
stratum ≜ intent ≺ C ≺ spec ≺ artifact ⟨≺ ≜ more-abstract-than · C ≜ durative-concept-lattice⟩
C ∉ implementer ⟨holds spec ¬ design · TWO-descriptions ⇒ validate ≜ operation ¬ re-reading⟩
reserves ⟨author(artifact) ↾ spec · verify ↾ spec-own-criteria⟩
verify ⊥ validate ⟨validate ≜ conformance(C) · C ∉ implementer⟩
exceeding ≜ work ≻ spec ⟨DEFECT ≅ falling-short ∧ subtler ∵ second-concept UNNAMED ⇒ UNCAUGHT downstream⟩
spec ¬ buildable-as-written ⇒ SURFACED ¬ reinterpreted`;
