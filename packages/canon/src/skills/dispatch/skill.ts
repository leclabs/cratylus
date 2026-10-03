import type { Skill, SkillExpression } from '../../manifest.js';

const FORMAL_BLOCK = `dispatch ≜ one invocation of delegation
caller ≜ owner of the invocation contract
contract ≜ the strict shape and unit this invocation requires
return ≜ structured value conforming to contract

∀ invocation : caller declares its own contract ⟨outputSchema ∧ schemaMode: strict⟩
contract(invocation) ≻ inherited ∨ session ∨ role defaults ⟨defaults neither required nor authoritative⟩
delegate(invocation) ⇒ return conforms to contract(invocation)
¬conforms(return, contract(invocation)) ⇒ failed-dispatch ↦ dispatcher ⟨¬ design note · ¬ whole failure · ¬ semantic assay verdict · ¬ automatic redispatch⟩
unit-bound contract ⇒ unit(return) = unit(named by caller)

omp ⟨native Agent invocation⟩ : pass invocation-specific outputSchema ∧ schemaMode: strict; consume parsed structuredOutput.data ⟨including agent://<id>/<field> addressing when available⟩
Claude ⟨native Agent invocation⟩ : preserve caller-owned intent at highest available fidelity, but native Agent calls lack omp's machine-enforced per-call schema mechanism ⟨--json-schema on print mode does not enforce Agent-tool returns⟩

contract ∉ plan ∨ unit ⟨no schema or transport field⟩
contract ∉ deliver ∨ generic output-format ∨ forge ∨ lifecycle state
loop-result ⟨planner⟩ ∈ { waiting(plan ∧ waiting[unit ∧ blockers]), ready(plan ∧ ready[unit]), closed(plan) }
loop-result ⟨implementer⟩ ∈ { landed(unit ∧ commit), blocked(unit ∧ reason) }
loop-result ⟨assayer⟩ ∈ { achieved(unit ∧ commit), not-achieved(unit ∧ commit ∧ missing[concept ∧ factor ∧ locus]) }
loop-result ⟨integrator⟩ ∈ { whole(unit ∧ commit), red(unit ∧ commit ∧ failing-check), plan-close(plan ∧ release-disposition) }
branch-required facts accompany the chosen result ⟨ad-hoc request ∉ loop is not forced into a loop result⟩
` as SkillExpression;

export const dispatch: Skill = {
  name: 'dispatch',
  description: 'Use at every delegation seam to make the caller own a strict invocation-specific return contract, pass it to the delegate, and consume only the conforming structured result. A mismatch is a failed dispatch returned to the dispatcher, never an automatic retry or a semantic verdict. Harness enforcement differs: omp supports native per-call strict schemas; Claude native Agent calls do not.',
  formalBlock: FORMAL_BLOCK,
};
