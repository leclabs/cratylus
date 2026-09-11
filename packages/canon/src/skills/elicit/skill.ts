import type { Skill, SkillExpression } from '../../manifest.js';

// COMPOSES NOTHING, and that is the repair.
//
// This cell used to declare `composition: () => [probe, signify, conceptualize]` and import those
// modules to do it. The thunk's only consumer is the trailing `Composed from …`
// line of the projected SKILL.md (`forge/src/core/exemplify/skill-cell.ts`), so each
// import bought one sentence of provenance and cost a module-level cycle: the four
// signification cells each claimed to be composed from the other three, and no one of
// them could be read, taken or deployed alone.
//
// The relation those edges named is CITATION, not dependency: `symbol-altitude`'s
// LEDGER records these cells RESTATING each other's signs in different registers
// (prose here, signature there), which is what a REFERENCE row means. A citation
// belongs inside the block, at the sign that borrows it (`@ <cell>`), where it needs
// no import and cannot cycle. Composition is the caller's: an agent pipes these cells
// in whatever order the work wants.

export const elicit: Skill = {
  name: 'elicit',
  description: `use this skill to elicit the operator's hidden intended concept — recover it by asking maximally-informative yes/no questions, each a distinction that bisects the live candidates by prior mass (binary-search / information-gain over the concept lattice), converging in the fewest questions; the active, query-driven counterpart to probe (which reads a signifier already given) — stop when one candidate survives or no question is worth its burden, then hand the recovered concept to signify to name.`,
  formalBlock: `C        ≜ concept lattice
D        ≜ distinction set
c          ≜ a closed distinction-set ; c ⊆ D
q ∈ c      ⇔ c draws the distinction q
priors   ≜ structured understanding of a token before any definition
μ          ≜ prior mass over candidates read off priors by conceptual fit ; μ : ℘(C) → [0,1] ; μ(C) = 1
t          ≜ the operator's hidden target concept ; t ∈ C ; unobserved
candidates          ≜ the live candidate set ; candidates ⊆ C
q          ≜ a query ; q ∈ D ; operator answers yes ∨ no
θ          ≜ the burden threshold ; θ ∈ (0,1]

Y(q)      ≜ { c ∈ candidates | q ∈ c }
bal(q)    ≜ | μ(Y(q)) - μ(candidates \\ Y(q)) |
ask(candidates)    ≜ argmin over q of bal(q)
filter(candidates) ≜ Y(ask(candidates)) if yes ; candidates \\ Y(ask(candidates)) if no
stop(candidates)   ⇔ | candidates | = 1 ∨ bal(ask(candidates)) > θ
elicit    ≜ from candidates = C, iterate filter until stop ; return t = the one surviving candidate` as SkillExpression,
  composition: () => [],
};
