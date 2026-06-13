---
kind: skill
delineation: use this skill to consolidate an agent's memory — the four-layer identity-memory stack (SOUL commons-fixed; SELF, MEMORY, EPISODIC self-authored) distilled upward by durability × orthogonality: next-steps stay in EPISODIC, durable orthogonal facts rise to MEMORY, identity-shaping facts rise to SELF, source-coupled facts leave for the source-local doc, consumed raw is cleared; SOUL is never written.
trigger: /dream
---

# Dream Skill

dream ≜ invokes [[exemplify]], references [[agent-know-thyself]]

The agent's "sleep" — sleep-dependent memory consolidation (replay → schema) run as an explicit step: fires as step 1 of [[agent-know-thyself]]'s wake sequence, before resuming work. The down-and-in counterpart `encode` binds [[episodic-encoding]]. The product is a **reboot seed, never a journal** ([[self-application-is-mandatory]], [[context-not-prose]]): a scar carried up as narrative is a [[palimpsest]].

Resolve from context:

- ${AGENT_HOME} - the agent's absolute home `{home}/{agent}/` ([[agent-know-thyself]]).
- exemplify - the [[exemplify]] pipeline (`D ──CA──→ C ──η──→ A ──Φ──→ σ(·, s) ──→ F`), bound here once and used in the blocks below as the bare operator `exemplify`.

Scope: Identity & Memory

## 1. The Stack

```text
stack ≜ (SOUL, SELF, MEMORY, EPISODIC)

order(stack) ≜ volatility × authorship

SOUL ≜ the resolved archetype — commons-authored, always in-prompt, never hand-edited

SELF ≜ the reboot seed — self-authored, read in full at wake

MEMORY ≜ durable semantic facts — self-authored, recalled by relevance

EPISODIC ≜ the raw stream — self-authored, appended per turn

stack ≅ (temperament, autobiographical self, semantic memory, episodic memory)
```

```text
L ≜ {SELF, MEMORY, EPISODIC}

∀ layer ∈ L : home(layer) ≜ AGENT_HOME/layer.md

SOUL ∉ L

SOUL ∉ range(dream)    ∵ the archetype changes only in the commons
```

```text
writes ≜ { encode : turn → EPISODIC, dream : EPISODIC → L }

reads(wake) ≜ SELF in full ∪ MEMORY by relevance ∪ EPISODIC next-steps

the two write-directions never tangle
```

---

## 2. Distillation

```text
E ≜ raw items of AGENT_HOME/EPISODIC.md

dream ≜ exemplify : E → I

I ≜ Distilled Items
```

```text
∀ i ∈ I :
    i = densest-faithful-point(i)

instances-governing-exemplar(i) ⇒ i ↦ pointer    ∵ cite-dont-copy
```

---

## 3. Routing

Routing is dream's materialization strategy — σ(Φ_self, layers) in [[materialize]]'s terms, with ρ keyed on durability × orthogonality instead of kind:

```text
route : I → L ∪ docs

orthogonal(i) ≜ ¬∃ source artifact a : i is load-bearing for a
```

```text
∀ i ∈ I :
    ¬orthogonal(i)      ⇒ i → docs(a), i ∉ L    ∵ L is read every session and competes with the loaded source for attention
    identity-shaping(i) ⇒ i → SELF
    durable-fact(i)     ⇒ i → MEMORY
    next-step(i)        ⇒ i → EPISODIC
```

---

## 4. Clearing

```text
promotion ≜ move, not copy
```

```text
consumed raw → ∅    ∴ EPISODIC never grows unbounded

∀ layer ∈ L :
    layer keeps only its proper residue
```

---

## 5. Integrated Cascade

```text
EPISODIC ──dream──→ {SELF, MEMORY, EPISODIC}

periodically : MEMORY ──dream──→ {SELF, MEMORY}
    identity-level(i) ⇒ i → SELF
    stale(i)          ⇒ ∅
```

```text
acceptance ≜ a wake-time read biases the very next action

¬graspable-in-one-glance(entry) ⇒ distill-further(entry) ∨ drop(entry)
```
