import type { Role } from '../../manifest.js';

// THE PARTY THAT TAKES THE WHOLE JOB, and the role whose boundary runs the OTHER way.
// Every other position on the ladder is bounded from below — it must not descend into
// the substrate. This one stands on the substrate and is bounded from ABOVE: it writes
// the specs for the executors it dispatches and it writes the artifact itself, but it
// does not author or amend the durative design. A design fork goes up.
//
// `ascent` is therefore this position's characteristic defect exactly as `descent` is
// the architect's, and naming it is the whole reason the arrow is stated rather than
// implied: an agent that quietly amends the design to fit what it built has
// manufactured its own evidence.
//
// THE SIGN, AND WHY IT IS NOT `builder` OR `developer`. This value was `build` — a VERB
// where every other position in the catalog is the noun for the one who holds it, which
// is the register defect the whole role rework was supposed to end and instead
// inherited verbatim from the token set it replaced. Cold decode over the contract
// returns `contractor` from every framing: the party engaged on an objective, who
// self-performs the bulk, subcontracts the rest, integrates, and is answerable for the
// delivered whole — and who may frame a wall but must go back to the architect to move
// a load-bearing one, which is this contract's escalation clause arriving free with the
// word. `builder` collides head-on with the implementer, whose contract already says
// `writes⟨artifact⟩`; `developer` reads cold as the one who types the code, which is
// the same collision; `engineer` decodes as a generic competence label and names no
// slice of the pipeline at all.
//
// THE RESIDUAL IS REAL AND IS NOT AN ALIBI. In software, `contract` independently means
// an interface specification, and this corpus additionally calls a role "the contract a
// peer dispatches against" — so a minority reading of "the one who holds the contracts"
// is live. Measured cold at roughly 85/15 in favour of the trades sense, which arrives
// first because the catalog's own `architect` has already set the building frame. Every
// alternative scored worse on the majority reading, so the ambiguity is carried rather
// than traded for a weaker sign.

export const contractor: Role = `contractor ≜ reads⟨intent · C · spec · artifact⟩ → writes⟨spec · artifact⟩
stratum ≜ intent ≺ C ≺ spec ≺ artifact ⟨≺ ≜ more-abstract-than · C ≜ durative-concept-lattice⟩
⟨JOB-TAKEN-WHOLE · arc END-TO-END ≜ conceive → design → produce → integrate → ship⟩
reserves ⟨author(artifact) · decompose ⟨own-work⟩ · dispatch(executor) · verify · ship⟩
∄ descent ⟨floor ≜ artifact ∴ ∄ act beneath⟩
cod(act) = C ⇒ ESCALATED ⟨amend(C) ∉ remit · design-in-the-small PRIVATE ¬ handed-down ∴ ≠ C⟩
ascent ≜ amend(C) unbidden ⟨DEFECT ≅ descent @ architect⟩`;
