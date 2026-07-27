# ENGINE

```
reader ≜ LLM
role   ≜ operational-mechanics
scope  ≜ pipeline realizing MODEL invariants + boundary projections rendering a validated cell to a reader
```

```
{class, activation, content, catalog, concepts, fragments, accept, COMPOSED, PARSIMONIOUS, SIGNIFIED, CANONICAL, REGENERABLE, σ*, α, intent, decode_cold, core, ir} ⊂ MODEL
canon ≜ {c:cell ∣ accept(c)}
valid(canon) ⇒ deterministic(deploy) ∧ ∀stage∈pipeline: preserves(stage, MODEL-invariants)

discover   : Intent → Sign ; discover realized-by {signify, conceptualize, elicit, probe}
Execution  ≜ a plan under praxis ; yield : Execution → ℘(Intent) ⟨what only the DOING establishes ; ¬ derivable from the Intent that launched it⟩
intake     : yield(Execution) → discover ⟨the feedback edge⟩ ; ∄ intake ⇒ yield dies at plan-retirement ∧ re-derives privately, per agent, forever
author     : Intent → cell
normalize  : cell → cell ; normalize ⊨ PARSIMONIOUS
verify     : fragment → Bool ; verify(f) ⇔ decode_cold(core f) = intent(f)
signify-verify : symbol → Bool ; signify-verify(w) ⇔ concept_R(w) = α⁻¹(w)         -- probe round-trip @ reader=LLM ; α injective (MODEL) ⇒ α⁻¹(w) = the concept w is assigned
canonizable(skill) ⇒ ∀ w ∈ declarations(skill) : signify-verify(w)                 -- formal blocks ARE the symbolic-σ* regression suite
validate   : cell → cell ∪ {⊥} ; validate(c) = (c if accept(c) else ⊥) ; verify ⊑ validate ; signify-verify ⊑ validate
select     : agent → (DimensionName ⇸ ℘(fragment))
compose    : (DimensionName ⇸ ℘(fragment)) → IR ; compose(select(a)) = ir(a) ∧ ir(a) ⊑ content(a)
realize    : ActivationMode × harness-adapter → harness-mechanism
inject     : context × harness-mechanism → Target

pipeline ≜ ⟨discover, author, normalize, validate, select, compose, deploy⟩ ⊕ intake ⟨pipeline is CYCLIC, ¬ linear : deploy ↦ Execution ↦ yield ↦ discover⟩
stage-invariant : discover ⊨ SIGNIFIED ; author ⊨ CANONICAL ; validate ⊨ accept ; compose ⊨ COMPOSED ; deploy ⊨ REGENERABLE ; intake ⊨ SIGNIFIED ⟨a yield enters as Intent, ¬ as a Sign : execution NAMES nothing, it only establishes what needs naming⟩

Reader ≜ {LLM, human} ; source : artifact → cell ; intent-of : cell → Intent ; author(I)=c ⇒ intent-of(c)=I
HumanSign ; human-artifact ; human-priors ; artifact ≜ Target ⊎ human-artifact
deploy            : cell × harness-adapter → Target ; deploy(c,adapter) = inject(content(c), realize(activation(class c), adapter))
regenerate        ≜ deploy
σ*_human          : concept → HumanSign
decode_cold_human : human-artifact → Intent ; decode_cold_human(h) ≜ decode(h, human-priors, ∅)
project-human     : cell → human-artifact ; project-human(c) = ⟨ σ*_human(k) : k ∈ concepts(c) ⟩
boundary-projection ≜ {deploy, project-human}
deploy-valid ⇔ REGENERABLE ; human-valid(h) ⇔ decode_cold_human(h) = intent-of(source(h))

ENGINE ⊥ MODEL : MODEL fixes invariants ; ENGINE realizes them ∧ owns boundary-projection ; engine-impl varies freely
```
