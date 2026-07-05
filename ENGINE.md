# ENGINE

```
reader ≜ LLM
role   ≜ operational-mechanics
scope  ≜ pipeline realizing MODEL invariants + boundary projections rendering a validated cell to a reader
```

```
{class, activation, content, catalog, concepts, fragments, accept, COMPOSED, PARSIMONIOUS, SIGNIFIED, CANONICAL, REGENERABLE, σ*, intent, decode_cold, core, ir} ⊂ MODEL
canon ≜ {c:cell ∣ accept(c)}
valid(canon) ⇒ deterministic(deploy) ∧ ∀stage∈pipeline: preserves(stage, MODEL-invariants)

discover   : Intent → Sign ; discover realized-by {signify, conceptualize, elicit, probe}
author     : Intent → cell
normalize  : cell → cell ; normalize ⊨ PARSIMONIOUS
verify     : fragment → Bool ; verify(f) ⇔ decode_cold(core f) = intent(f)
validate   : cell → cell ∪ {⊥} ; validate(c) = (c if accept(c) else ⊥) ; verify ⊑ validate
select     : agent → (OrganName ⇸ ℘(organ-value))
compose    : (OrganName ⇸ ℘(organ-value)) → IR ; compose(select(a)) = ir(a) ∧ ir(a) ⊑ content(a)
realize    : ActivationMode × harness-adapter → harness-mechanism
inject     : context × harness-mechanism → Target

pipeline ≜ ⟨discover, author, normalize, validate, select, compose, deploy⟩
stage-invariant : discover ⊨ SIGNIFIED ; author ⊨ CANONICAL ; validate ⊨ accept ; compose ⊨ COMPOSED ; deploy ⊨ REGENERABLE

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
