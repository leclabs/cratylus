---
kind: skill
name: probe
delineation: use this skill to probe a signifier — read out the latent priors a word, phrase, or candidate name fires in the reader (`fired_R`, [[signify]]'s decoder `dec_R` generalized off its assigned anchors) and the concept they circumscribe; the forward, no-commit inverse of [[signify]], for discovering the concept latent in a name or experimenting with candidate anchors before committing — a keeper crystallizes through [[signify]].
trigger: /probe
---

# probe

Forward, no-commit inverse of [[signify]]: read a signifier `w` already given and return the priors it fires plus the concept it circumscribes, committing nothing — the active counterpart [[elicit]] instead queries an oracle for a target not yet signified. Resolve from context: `w` — the signifier under probe (a word, phrase, or candidate name); `R` — the reader whose priors are the instrument.

Bindings (cite-once): `fired_R` extends `dec_R`, [[signify]]'s empirical decoder (carrying `Names`, the anchor map `α`), from assigned anchors to any signifier — the fired priors are the reader's [[latent-priors]] under [[read-by-priors-not-surface]]; `D_R`, the closure `cl_R`, the lattice `C_R` are [[conceptualize]]'s distinction space; `concept_R` closes the fired priors into the concept `w` circumscribes. _discover_ reads the concept latent in a given name; _experiment_ weighs candidate names against a target by [[precise-circumscription]]; a keeper crystallizes through [[signify]]. Symbol table: `references/formal-symbolic-notation.md`.

```text
w          — a signifier under probe; w ∈ Names, need not lie in dom(dec_R)
fired_R    — the priors w evokes in R; signify's decoder, generalized off its anchors

fired_R : Names → ℘(D_R)
fired_R(a) = dec_R(a)              ,  a ∈ dom(dec_R)      -- agrees with signify on assigned anchors
concept_R(w) ≜ cl_R(fired_R(w))                          -- the concept w circumscribes in R
probe(w) ≜ ( fired_R(w), concept_R(w) )                  -- readout only; α and C_R unchanged
```
