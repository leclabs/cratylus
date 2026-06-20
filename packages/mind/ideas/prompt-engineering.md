---
kind: concept
delineation: prompt-engineering ≡ computing σ*_R(C) — to engineer a prompt is to compute the reader-relative optimal signifier of a target concept C for the executing reader R. Fix C and R and the prompt has an optimal form; iteration holds C and R fixed and moves only the encoding toward that optimum.
---

# Prompt-Engineering

**`prompt-engineering ≡ computing σ*_R(C)`** — the load-bearing identity of the whole project. To engineer a prompt is to compute the reader-relative optimal signifier of a target concept `C` for the reader `R` that will execute it. Everything else — skills, agents, the corpus, the projector — is an instrument for computing, storing, or composing `σ*_R(C)`.

A prompt factors into three separable axes, and only one of them is what "engineering" moves:

- **C** — the concept / target behavior to induce; invariant, fixed by intent.
- **R** — the reader / executor that decodes the prompt; for a prompt run by a model, `R = that LLM` ([[anchor-to-the-readers-priors]]).
- **σ\*** — the encoding; the _only_ thing iteration changes.

Fix `C` and `R` and the prompt has an optimal form. "Prompt engineering" is nothing but the search for that form: a compression that holds `C` and `R` fixed and moves only the encoding toward `σ*_R(C)` ([[signifier-star-r]]) is the work, in full. The optimum is found, not asserted — encode a candidate ([[signify]]), then decode-verify it blind against a fresh `R` as a round-trip fixed point ([[round-trip-fidelity]]), fanning out for stochastic stability; never let the target leak into the eliciting prompt ([[closed-context-of-an-inference-call]]).

## See also

- [[signifier-star-r]] — the operator a prompt computes; `σ*_R(C)`, its signature and laws.
- [[llm-native-source-human-render-at-boundary]] — the corollary for stored modules: internals are `σ*_LLM`, human prose a lazy boundary render.
- [[precise-circumscription]] — the same argmin at the naming grain; prompt-engineering is it at the whole-prompt grain.
