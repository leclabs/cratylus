# ENGINE

```
reader ≜ LLM
role   ≜ operational-mechanics
scope  ≜ pipeline realizing MODEL invariants + boundary projections rendering a validated cell to a reader
```

```
{class, activation, content, catalog, concepts, fragments, accept, COMPOSED, PARSIMONIOUS, SIGNIFIED, CANONICAL, REGENERABLE, σ*, α, intent, decode_cold, core, terminology, ir} ⊂ MODEL
canon ≜ {c:cell ∣ accept(c)}
valid(canon) ⇒ deterministic(deploy) ∧ ∀stage∈pipeline: preserves(stage, MODEL-invariants)

discover   : Intent → Sign ; discover realized-by {signify, conceptualize, elicit, probe}
Execution  ≜ a plan under praxis ; yield : Execution → ℘(Intent) ⟨what only the DOING establishes ; ¬ derivable from the Intent that launched it⟩
intake     : yield(Execution) → discover ⟨the feedback edge⟩ ; ∄ intake ⇒ yield dies at plan-retirement ∧ re-derives privately, per agent, forever
author     : Intent → cell
normalize  : cell → cell ; normalize ⊨ PARSIMONIOUS
verify     : fragment → Bool ; verify(f) ⇔ decode_cold(core f) = intent(f)
             ⟨the cold-decode oracle decides signs only for the corpus's core agent dimension names and values (MODEL's terminology) ; every other term is the industry's own, used as the industry understands it, ∉ verify ∧ ∉ the oracle⟩
             ⟨nothing cratylus ships holds a consumer's own surfaces to it⟩
signify-verify : symbol → Bool ; signify-verify(w) ⇔ concept_R(w) = α⁻¹(w)         -- probe round-trip @ reader=LLM ; α injective (MODEL) ⇒ α⁻¹(w) = the concept w is assigned ; w a symbol this corpus's own skills declare
canonizable(skill) ⇒ ∀ w ∈ declared(skill) : signify-verify(w)                    -- skill of THIS corpus ; one obligation per declared symbol ; the gate routes RECORDED probe readouts to pass ∨ fail, and a symbol with none is owed, ¬ passed
validate   : cell → cell ∪ {⊥} ; validate(c) = (c if accept(c) else ⊥) ; verify ⊑ validate ; signify-verify ⊑ validate
Role       ≜ (DimensionName ⇸ ℘(fragment)) ⟨NAMED ∧ PARTIAL : the EXPECTATIONS of anyone holding the role ; made OF dimension values ∴ ¬ itself a dimension — the `role` dimension carries its SIGN⟩
             ⟨∧ the identity of its generic holder : description · archetype · provenance.mark⟩
generic-holder ≜ the agent NAMED for its Role (architect · planner · implementer · assayer · integrator) ⟨carries nothing beyond the Role : its description, archetype and mark are the Role's ; declares ∅⟩
persona    ≜ an agent named as an individual (mav · nico · kino) ⟨holds one Role and DECLARES its residue over it : its own description, archetype and mark at least, any dimension value besides⟩
holds      : agent → Role ⟨SINGULAR : a Role is the contract a PEER dispatches against ∧ ∄ dispatcher that can reason about a union of Roles⟩
declares   : agent → (DimensionName ⇸ ℘(fragment)) ⟨what a persona states over the Role : its residue ; ¬ bounded in size ; ∅ for a generic-holder⟩
select     : agent → (DimensionName ⇸ ℘(fragment)) ; select(a) = holds(a) ⊕ declares(a)   -- the fold runs @ select ∴ the emitted Target is FLAT
⊕ ⊨ arity @ manifest ⟨set ⇒ holds(a) ∪ declares(a) ⟨EXTEND⟩ ; scalar ⇒ declares(a) if the key is STATED ⟨OVERRIDE⟩, else holds(a)⟩
role ∉ dom(declares) ⇒ contract(holds(a)) ¬ overridable ⟨∄ field a persona may state ∴ inviolable BY CONSTRUCTION, ¬ by a marking⟩
mark ∉ dom(⊕) ⟨identity, ¬ folded : a generic-holder's mark is its Role's, a persona's is its own⟩
             ⟨the fold REFUSES a persona with no archetype or mark of its own, a persona whose mark is its Role's, and a Role-named agent that declares anything beyond its Role⟩
compose    : (DimensionName ⇸ ℘(fragment)) → IR ; compose(select(a)) = ir(a) ∧ ir(a) ⊑ content(a)
realize    : cell × harness-adapter ⇀ harness-mechanism ⟨realizes MODEL's `mechanism` ; keyed on the CELL, ¬ on ActivationMode alone⟩
             ⟨reads activation(c) ∧ — for an enforcing f — events(f) ∧ substrate(f) : a mode cannot see which Event fires⟩
             ⟨PARTIAL ∵ mechanism is PARTIAL : most cells realize to nothing ⟨compose-only⟩⟩
inject     : context × harness-mechanism → Target

pipeline ≜ ⟨discover, author, normalize, validate, select, compose, deploy⟩ ⊕ intake ⟨pipeline is CYCLIC, ¬ linear : deploy ↦ Execution ↦ yield ↦ discover⟩
stage-invariant : discover ⊨ SIGNIFIED ; author ⊨ CANONICAL ; validate ⊨ accept ; compose ⊨ COMPOSED ; deploy ⊨ REGENERABLE ; intake ⊨ SIGNIFIED ⟨a yield enters as Intent, ¬ as a Sign : execution NAMES nothing, it only establishes what needs naming⟩

Reader ≜ {LLM, human} ; source : artifact → cell ; intent-of : cell → Intent ; author(I)=c ⇒ intent-of(c)=I
HumanSign ; human-artifact ; human-priors ; artifact ≜ Target ⊎ human-artifact
deploy            : cell × harness-adapter → Target ; deploy(c,adapter) = inject(content(c), realize(c, adapter))
                    ⟨activation is INSTANCE-level @ MODEL ∴ realize reads activation(c), ¬ activation(class c) : a Kind-typical DEFAULT is not the value⟩
regenerate        ≜ deploy
σ*_human          : concept → HumanSign
decode_cold_human : human-artifact → Intent ; decode_cold_human(h) ≜ decode(h, human-priors, ∅)
project-human     : cell → human-artifact ; project-human(c) = ⟨ σ*_human(k) : k ∈ concepts(c) ⟩
                    ⟨DEFINED ∧ UNINHABITED @ this corpus — operator ruling 2026-08-05 ⟨zero generated documentation⟩ ⇒ ext(project-human) = ∅ ; hand-authored ground is ¬ generated ∴ ∄ source(h) for it. ∉ boundary-projection ∵ a member with a provably empty extension is a claim ENGINE cannot support ; re-admission reverses the RULING, ¬ merely adds an impl⟩
boundary-projection ≜ {deploy}
deploy-valid ⇔ REGENERABLE ; human-valid(h) ⇔ decode_cold_human(h) = intent-of(source(h))

ENGINE ⊥ MODEL : MODEL fixes invariants ; ENGINE realizes them ∧ owns boundary-projection ; engine-impl varies freely
```
