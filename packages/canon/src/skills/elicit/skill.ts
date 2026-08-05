import type { Skill, SkillExpression } from '../../manifest.js';
import { conceptualize } from '../conceptualize/skill.js';
import { probe } from '../probe/skill.js';
import { signify } from '../signify/skill.js';

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
  composition: () => [probe, signify, conceptualize],
};
