import type { Skill, SkillExpression } from '../../manifest.js';

const FORMAL_BLOCK = `dispatch ≜ one invocation of delegation
caller ≜ owner of the invocation contract
contract ≜ the strict shape and unit this invocation requires
return ≜ structured value conforming to contract

∀ invocation : caller declares its own contract and requests only a conforming value
contract(invocation) ≻ inherited ∨ session ∨ role defaults ⟨defaults neither required nor authoritative⟩
delegate(invocation) ⇒ return conforms to contract(invocation)
¬conforms(return, contract(invocation)) ⇒ failed-dispatch ↦ dispatcher ⟨¬ design note · ¬ whole failure · ¬ semantic assay verdict · ¬ automatic redispatch · ¬ lifecycle mutation⟩
unit-bound contract ⇒ unit(return) = unit(named by caller)

omp ⟨native Agent invocation⟩ : pass invocation-specific outputSchema ∧ schemaMode: strict; consume parsed structuredOutput.data ⟨including agent://<id>/<field> addressing when available⟩
Claude Code ⟨native Agent invocation⟩ : include the caller's actual schema and conforming-return instruction in available call instructions ⟨highest-fidelity instruction projection; not machine-enforced structured transport⟩; do not use nonconforming returns as routes or verdicts
Claude Code ∧ omp ⊨ supported harnesses ⟨native per-call schema enforcement exists on omp only⟩
Claude Code print-mode --json-schema ¬⇒ Agent-tool enforcement

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
  description:
    'Use at every delegation seam to make the caller own an invocation-specific return contract and request only a conforming value. Harness enforcement differs: omp supports native per-call strict schemas; Claude Code carries the caller schema in call instructions without machine enforcement.',
  formalBlock: FORMAL_BLOCK,
  composition: () => [],
};
