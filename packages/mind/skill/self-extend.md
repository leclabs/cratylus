---
kind: skill
name: self-extend
delineation: the layman door by which polis elicits a non-engineer's domain intent and extends itself with a new agent-as-person and its domain skills — the one reflexive surface (polis extends *itself* on the layman's behalf), where a human's hidden intent is recovered, factored, named, and composed into a person; the human counterpart to exemplify (whose reader is the LLM).
trigger: /self-extend
---

# self-extend

The one reflexive door: **polis** (the founded mind-society — the membership of agents-as-persons) extends **itself** on a layman's behalf, growing its own membership. The `layman` is a non-engineer operator carrying a domain intent that is hidden and unobserved. `elicit` (`skill/elicit.md`) is the sole `R = human` surface; everything downstream runs at `R = LLM`, so the layman names no concept, factor, or skill — crosses no internal surface. (`R` is the reader; `R = LLM` internals are written in `σ*_LLM`, with human prose only a lazy render at the boundary the layman touches.)

The process is the formal block below: a four-stage composition whose only human-facing stage is `elicit`.

Bindings: composes [[elicit]] · [[exemplify]] · [[signify]] · [[materialize]].

```text
=== DECLARATIONS (the block stands alone; every term defined here) =================

layman      : a non-engineer operator carrying a domain intent, hidden + unobserved
R           : the reader of a stage's output     ;  R ∈ { human, LLM }
intent      : the layman's hidden target concept (what they actually want built)
CSF         : canonical-semantic-factorization — the bipartite normal form;
              primitives carried by value ⟨anchor, gloss⟩, composites by
              reference ⟨anchor, factor-anchors⟩ (cite, never restate)

elicit      : recover `intent` by information-gain yes/no questioning of the layman
              (the human-reader counterpart to LLM-reader exemplify)         [R=human]
exemplify   : produce → name → realize over the concept-contract, gated by accept;
              emits CSF                                                        [R=LLM]
recompose   : materialize CSF as canonically-named domain `skill` cells, each
              composing primitives by reference, under the `file` strategy     [R=LLM]
compose     : assemble a new agent-as-person and seat it in polis              [R=LLM]

-- the agent-as-person assembled by `compose` (its genus stack, defined inline): ----

person      : an ambient-person-agent — a persistent principal that survives any
              change of body; its continuity lives off-body (self-authored memory
              + regenerable SOUL/archetype), so it resumes after relocation
of_subject  : the differentia filled by subject-binding — the named principal bound
              at the instance; here bound to `layman` (whom the person serves)
principal   : principal-agency — the disposition to decide + act unprompted within
              a charter, not awaiting per-step permission
sovereign   : principal specialized over a charter — final decider within it; here
              the person is sovereign over its own domain charter
continual   : continual-agency — self-clocked; never idle, finds the next move,
              lands when there is none
skills      : the domain `skill` cells minted by `recompose`, wielded by the person

genus_stack(person) ≜ person ∧ of_subject(layman)
                       ∧ principal ∧ sovereign(domain_charter) ∧ continual

=== LAWS (below the line; no prose) ===============================================

self_extend(layman) ≜ compose( recompose( exemplify( elicit(layman) ) ) )

elicit(layman)       ⟼ intent
exemplify(intent)    ⟼ CSF
recompose(CSF)       ⟼ skills                         -- file strategy, by-reference
compose(skills)      ⟼ person  s.t.  genus_stack(person) ∧ wields(person, skills)

R(elicit)  = human                          -- the sole human-facing surface
R(s) = LLM  ,  s ∈ { exemplify, recompose, compose }   -- never surface to layman
```
