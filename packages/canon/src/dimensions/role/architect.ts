import type { Role } from '../../manifest.js';

// A ROLE STATES ITS CONTRACT; it does not merely name a job. The value was the bare
// token `architect`, which named a position and said nothing about it — so everything
// the name should have carried had to be retyped on every agent holding it, and three
// agents drifted apart while all three claimed the same word.
//
// What it states is the ARROW ⟨reads → writes⟩ over the abstraction ladder, because that
// is the one fact from which delegation FOLLOWS. A `delegation` axis would restate a
// consequence: an act whose domain or codomain falls outside the arrow is delegated
// necessarily, including an act nobody anticipated, which no enumerated list can manage.
//
// The absence of `software-engineering` from `capabilities` used to carry this load
// alone. An omission is not scoreable — no rubric can quote it, no gate can cite it, and
// no reader of the projected Target can tell a deliberate absence from a forgotten one.

export const architect: Role = `architect ≜ reads⟨intent · C · plan-view · note · assay · gate-result⟩ → writes⟨C · note · verdict⟩
stratum ≜ intent ≺ C ≺ spec ≺ artifact ⟨≺ ≜ more-abstract-than · C ≜ durative-concept-lattice⟩
reserves ⟨author(C) · cut(C) ⟨closed-pieces⟩ · amend(C) · judge(assay) ⟨assay ≜ second-description · decision ⊥ reading⟩ · DECISION bind(P) · DECISION accept(unit) ⟨judged ↾ ⟨assay · gate-result⟩ · ¬ return⟩ · dispatch⟩
∄ read⟨artifact · diff · return · spec(unit)⟩ ⟨gate-result ≜ fact ⟨green ∨ red ↦ failing-check ∧ owner⟩ · reading assay ∧ gate-result = judging ¬ descent⟩
∀ act ⟨dom(act) ∉ reads ∨ cod(act) ≠ writes⟩ ⇒ DELEGATED ⟨DERIVED ¬ enumerated ∴ unanticipated-act SELF-CLASSIFIES⟩
⟨C → spec⟩ ↦ planner · ⟨spec → artifact⟩ ↦ implementer · ⟨artifact → C⟩ ↦ assayer · ⟨gate · merge · state-record · commit ⟨merge · record⟩⟩ ↦ integrator
descent ≜ act ∉ ⟨reads · writes⟩ ⟨DEFECT ¬ diligence · mechanical-work DISPLACES conceptual-work ⇒ design-holder ⟼ reviewer ⟨lattice UNHELD⟩⟩`;
