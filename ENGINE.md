# ENGINE

```
reader ≜ LLM
role   ≜ operational-mechanics
scope  ≜ pipeline realizing MODEL invariants + boundary projections rendering a validated cell to a reader
```

```
{class, activation, content, catalog, concepts, fragments, accept, COMPOSED, PARSIMONIOUS, SIGNIFIED, CANONICAL, REGENERABLE, σ*, α, κ, intent, decode_cold, core, terminology, ir} ⊂ MODEL
canon ≜ {c:cell ∣ accept(c)}
valid(canon) ⇒ deterministic(deploy) ∧ ∀stage∈pipeline: preserves(stage, MODEL-invariants)

discover   : Intent → Sign ; discover realized-by {signify, conceptualize, elicit, probe}
Execution  ≜ a plan under praxis ; yield : Execution → ℘(Intent) ⟨what only the DOING establishes ; ¬ derivable from the Intent that launched it⟩
intake     : yield(Execution) → discover ⟨the feedback edge⟩ ; ∄ intake ⇒ yield dies at plan-retirement ∧ re-derives privately, per agent, forever
author     : Intent → cell
normalize  : cell → cell ; normalize ⊨ PARSIMONIOUS
verify     : fragment → Bool ; verify(f) ⇔ decode_cold(core f) = intent(f)
             ⟨the cold-decode oracle decides signs only for the corpus's core agent dimension names and values (MODEL's terminology), each read in its bounded context κ and judged by residue @ workflow ; every other term is the industry's own, used as the industry understands it, ∉ verify ∧ ∉ the oracle⟩
             ⟨nothing cratylus ships holds a consumer's own surfaces to it⟩
signify-verify : symbol → Bool ; signify-verify(w) ⇔ concept_R(w, κ) = α⁻¹(w, κ)  -- probe round-trip @ reader=LLM, w read in its bounded context κ (MODEL) ; α injective within each κ ⇒ α⁻¹(w, κ) = the concept w is assigned in κ ; w a symbol this corpus's own skills declare
canonizable(skill) ⇒ ∀ w ∈ declared(skill) : signify-verify(w)                    -- skill of THIS corpus ; one obligation per declared symbol ; the gate routes RECORDED probe readouts to pass ∨ fail, and a symbol with none is owed, ¬ passed
validate   : cell → cell ∪ {⊥} ; validate(c) = (c if accept(c) else ⊥) ; verify ⊑ validate ; signify-verify ⊑ validate
Role       ≜ (DimensionName → ℘(entry)) ⟨NAMED ∧ TOTAL : a value for EVERY factor the catalog gives a field, an explicitly empty set counting as one ; the EXPECTATIONS of anyone holding the role ; made OF factor values ∴ ¬ itself a factor — the `role` factor carries its SIGN⟩
             ⟨∧ the identity of its generic holder : name · description ; a Role carries no mark⟩
entry      ≜ ⟨value, level⟩ ⟨level ∈ {advisory, firm, fixed} ∪ {—} : enforcement-level is an ATTRIBUTE of every value held, ¬ a value of its own ; unstated ⇒ the factor's default @ manifest⟩
generic-holder ≜ holder(Role) : the agent NAMED for its Role (architect · lead · builder · reviewer · illustrator · check-writer) ⟨carries nothing beyond the Role : its name and description are the Role's ; no mark ; declares ∅⟩
             ⟨holder REFUSES a Role missing a factor, a scalar without exactly one value, a slot not filled exactly once, ∨ empty guardrails⟩
persona    ≜ persona(Role, overrides) : an agent named as an individual (kino · nico · mav) ⟨holds one Role and DECLARES its overrides and extensions of it, never restating it : its own description and mark at least, any factor value besides⟩
holds      : agent → Role ⟨SINGULAR : a Role is the contract a PEER dispatches against ∧ ∄ dispatcher that can reason about a union of Roles⟩
declares   : agent → (DimensionName ⇸ ℘(entry)) ⟨what a persona states over the Role : its overrides and extensions ; ¬ bounded in size ; ∅ for a generic-holder⟩
select     : agent → (DimensionName → ℘(entry)) ; select(a) = holds(a) ⊕ declares(a)   -- the fold runs @ select ∴ the emitted Target is FLAT
⊕ ⊨ arity @ manifest ⟨scalar ⇒ declares(a) if STATED ⟨OVERRIDE⟩, else holds(a) ; slots ⇒ each stated slot OVERRIDES its own ; set ⇒ holds(a) then declares(a) ⟨EXTEND ; restating a held value changes only its level ∨ note⟩ ; Reach ⇒ a persona may only NARROW it⟩
role ∉ dom(declares) ⇒ contract(holds(a)) ¬ overridable ⟨∄ field a persona may state ∴ inviolable BY CONSTRUCTION, ¬ by a marking⟩
mark ∉ dom(⊕) ⟨identity, ¬ folded : a generic-holder has none, a persona's is its own⟩
             ⟨⊕ REFUSES, never silently ignores, naming what it refused : overrides that WIDEN Reach ⟨a perception-scope, action-scope ∨ handoff the Role does not hold⟩, remove a guardrail ∨ lower its level, remove any other set's value, ∨ name a factor ∉ catalog ; a persona with no mark, ∨ whose mark is its Role's⟩
compose    : (DimensionName → ℘(entry)) → IR ; compose(select(a)) = ir(a) ∧ ir(a) ⊑ content(a)
             ⟨Reach ⟨perception-scope · action-scope · handoffs⟩ ∧ model are BINDINGS, ¬ text : realize compiles them to the harness's tool, dispatch ∧ model-role settings ; a level is rendered only where fixed⟩
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
