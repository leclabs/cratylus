# MODEL

```
reader ≜ LLM
role   ≜ formal-conceptual-model
scope  ≜ implementation-independent acceptance criteria
```

```
Kind ≜ {fragment, agent, rule, skill}
cell ; class : cell → Kind
Intent ; intent : fragment → Intent
Sign ; σ* : concept → Sign ; α : concept → Sign, injective
concepts : cell → ℘(Corpus) ; fragments : cell → ℘(fragment) ; content : cell → context
{σ*, α, decode, home, residue, fired, D, body, orphan, private, palimpsest} ⊂ Corpus

ActivationMode ≜ {compose-only, identity, scope, trigger}
activation : Kind → ActivationMode ⟨what CAUSES a cell to become active ; type-level⟩
             fragment↦compose-only ; agent↦identity ; rule↦scope ; skill↦trigger

Event ≜ the harness-agnostic lifecycle vocabulary ⟨schema-owned ; the PIVOT every adapter maps from⟩
events : fragment ⇀ ℘(Event) ⟨PARTIAL ∴ most fragments never fire ; instance-level, ¬ Kind-level⟩
enforcing(f) ⇔ events(f) ≠ ∅ ⟨f binds REGARDLESS of the agent's reasoning ∴ bounds, ¬ steers⟩
realizable : Event × harness-adapter → 𝔹
mechanism : fragment × harness-adapter ⇀ harness-mechanism ⟨what deploy EMITS for an enforcing f⟩

NatSet ≜ {null, one, many} ; null={0} ; one={1} ; many={n∈ℕ: n≥1}
DimensionName ; catalog : DimensionName → ℘(fragment) ; arity : DimensionName → NatSet
Target ≜ harness-declaration-artifact

author : Intent → cell ; compose : (DimensionName ⇸ ℘(fragment)) → IR ; ir : agent → IR ; deploy : cell × harness-adapter → Target
author-valid ⇔ accept ; deploy-valid ⇔ REGENERABLE

accept(a) ⇔ Universal(a) ∧ (class(a)=agent ⇒ COMPOSED(a))
COMPOSED(a) : ir(a)=⟨S_on⟩_{on∈dom catalog} ∧ ∀on: S_on⊆catalog(on) ∧ |S_on|∈arity(on) ∧ ∄ superfluous S_on

Universal(a) ≜ CANONICAL ∧ SIGNIFIED ∧ COLD-BLIND ∧ PARTITIONED ∧ PARSIMONIOUS ∧ ENFORCED ∧ REGENERABLE
  CANONICAL   : ∀c∈concepts(a): ¬orphan(c) ∧ ¬private(c) ∧ ¬palimpsest(c)
  SIGNIFIED   : ∀c∈concepts(a): α(c)=σ*(c)
  COLD-BLIND  : core(f) ≜ f ∖ human-prose
                decode_cold(f)   ≜ decode(f, LLM-priors ∪ Corpus, ∅)
                decode_warm(f,K) ≜ decode(f, LLM-priors ∪ Corpus, K)
                ∀f∈fragments(a), ∀K≠∅: decode_cold(core f) = intent(f) = decode_warm(core f, K)
                self-sufficient(f): core(f) grounds in inline-≜(f) ∪ Corpus ∪ LLM-priors ∧ ¬external-cite
  PARTITIONED : ∀c∈Corpus: |home(c)|=1 ∧ disjoint(homes) ∧ ⋃ home = Corpus
  PARSIMONIOUS: ∀c∈Corpus: body(c)=⟨α(c),residue(c)⟩ ∧ residue(c)=D(c)∖fired(α(c))
  ENFORCED    : enforcing(f) ∧ f ∈ ir(a) ⇒ scoped(mechanism(f,adapter), a) ⟨¬ ambient : COMPOSITION is the scope, ¬ a runtime self-filter⟩
                enforcing(f) ∧ ∃e∈events(f): ¬realizable(e,adapter) ⇒ deploy REFUSES ⟨naming f · e · adapter⟩ ∧ ¬ silent-drop
                ⟨a declared bound that projects to nothing is INDISTINGUISHABLE from an undeclared one⟩
  REGENERABLE : ∀t∈Target: (∃c:cell, adapter: t=deploy(c,adapter)) ∧ deterministic(deploy) ∧ deploy-owned(t) ∧ ¬hand-edit(t)
                SelfAuthored{SEM,PROC,EPIS} ∉ Target ∧ ¬deploy-writes(SelfAuthored)
  BEING/FACE  : a cell is a BEING ; deploy projects it to MANY per-harness Targets = its FACES
                ⟨one being → {face_h}_{h∈harness}⟩ ; the being's MEMORY-HOME is single-per-being ∧
                harness-independent ∧ ∉ any face — the continuity that makes the faces one being
                ⟨extends SelfAuthored ∉ Target: memory is neither projected nor per-harness⟩

Corpus ≜ lfp( S ↦ { c ∣ grounded(c,S) } ) ; grounded(c,S) ⇔ defn(c) resolves-in (inline-≜(c) ∪ S ∪ LLM-priors)
REFLEXIVE : ∀x:cell, class(x)∈{skill,rule} ⇒ accept(x)
REPAIR    : (∃K≠∅: decode_cold(core f) ≠ decode_warm(core f,K)) ⇒ defect ; repair the cell toward decode_cold
```
