import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { conceptualize } from './conceptualize.js';
import { probe } from './probe.js';
import { signify } from './signify.js';

export const elicit: Skill = {
  name: 'elicit',
  description: `use this skill to elicit the operator's hidden intended concept — recover it by asking maximally-informative yes/no questions, each a distinction that bisects the live candidates by prior mass (binary-search / information-gain over the concept lattice), converging in the fewest questions; the active, query-driven counterpart to probe (which reads a signifier already given) — stop when one candidate survives or no question is worth its burden, then hand the recovered concept to signify to name.`,
  formalBlock:
    `-- declarations (the block stands alone) ----------------------------
R          — the reader; the agent in whom concepts and priors live
C_R        — R's concept lattice: the closed set of candidate concepts
D_R        — R's distinction set: the questions that cut C_R
c          — a concept ≜ a closed distinction-set ; c ⊆ D_R
q ∈ c      ⇔ c draws the distinction q                  -- membership test
priors_R   — R's structured understanding of a token before any definition: the reader-substrate against which a query discriminates
μ          — prior mass over candidates, read off priors_R by fit (meaning from conceptual fit, not surface wording) ; μ : ℘(C_R) → [0,1] , μ(C_R) = 1
t          — the operator's hidden target concept ; t ∈ C_R, unobserved
K          — the live candidate set ; K ⊆ C_R, consistent with answers so far
q          — a query: a distinction q ∈ D_R ; operator answers yes or no
θ          — the burden threshold ; θ ∈ (0,1]

-- laws -------------------------------------------------------------
Y(q)      ≜ { c ∈ K | q ∈ c }                          -- candidates that draw q
bal(q)    ≜ | μ(Y(q)) - μ(K \\ Y(q)) |                   -- imbalance of the yes / no split
ask(K)    ≜ argmin over q of bal(q)                     -- the maximally-informative query
filter(K) ≜ Y(ask(K)) if yes ; K \\ Y(ask(K)) if no      -- keep the half consistent with the answer
stop(K)   ⇔ | K | = 1 ∨ bal(ask(K)) > θ                 -- one survives, or no question is worth its burden
elicit    ≜ from K = C_R, iterate filter until stop ; return t = the one surviving candidate` as SkillExpression,
  composition: () => [probe, signify, conceptualize],
};
