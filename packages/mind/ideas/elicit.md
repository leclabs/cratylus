---
kind: skill
name: elicit
delineation: use this skill to elicit the operator's hidden intended concept — recover it by asking maximally-informative yes/no questions, each a distinction that bisects the live candidates by prior mass (binary-search / information-gain over the concept lattice), converging in the fewest questions; the active, query-driven counterpart to probe (which reads a signifier already given) — stop when one candidate survives or no question is worth its burden, then hand the recovered concept to /signify to name.
trigger: /elicit
---

# Elicit Skill

Resolve from context: `t` — the operator's intended concept, hidden and unobserved; `R` — the reader whose priors seed the belief `μ`; the operator is the oracle answering each query yes or no.

Bindings: `C_R` (the concept lattice the search ranges over) and `D_R` (its distinctions — each a candidate question) are [[conceptualize]]'s space, where a concept is a closed set of distinctions, so `q ∈ c` asks whether concept `c` draws distinction `q`; the prior mass `μ` is the reader's own [[latent-priors]] · [[read-by-priors-not-surface]] over what the operator likely means — the light by which the agent knows which question discriminates; the one surviving concept crystallizes into a name through [[signify]]. The symbol table is `references/formal-symbolic-notation.md`.

```text
t          — the operator's hidden target concept; t ∈ C_R, unobserved
K          — the live candidate set; K ⊆ C_R, consistent with the answers so far
μ          — the reader's prior mass over candidates; μ : ℘(C_R) → [0,1] , μ(C_R) = 1
q          — a query: a distinction q ∈ D_R, the operator answers yes or no
θ          — the burden threshold; θ ∈ (0,1]

Y(q) ≜ { c ∈ K | q ∈ c }                              -- candidates that draw q
bal(q) ≜ | μ(Y(q)) - μ(K \ Y(q)) |                     -- imbalance of the yes / no split
ask(K) ≜ argmin over q of bal(q)                      -- the maximally-informative query
filter(K) ≜ Y(ask(K)) if yes ; K \ Y(ask(K)) if no    -- keep the half consistent with the answer
stop(K) ⇔ | K | = 1 ∨ bal(ask(K)) > θ                 -- one survives, or no question is worth its burden
elicit ≜ from K = C_R, iterate filter until stop ; return t = the one surviving candidate
```
