---
kind: skill
name: dream
delineation: use this skill to consolidate an agent's memory — distil the raw EPISODIC stream and route each item by two orthogonal axes (type/voice picks the organ, scope picks the instance): identity rises to SELF, durable knowledge to MEMORY, directives to the scoped AGENTS.md, networked reference to the vault, next-steps stay in EPISODIC, the rest is dropped; consumed raw is cleared; SOUL is never written.
trigger: /dream
---

# Dream Skill

dream ≜ invokes [[exemplify]], [[materialize]] · binds [[memory]], [[self-application-is-mandatory]], [[context-not-prose]], [[palimpsest]]

The agent's "sleep" — sleep-dependent consolidation (replay → schema) run as an explicit step. The product is a **reboot seed, never a journal** ([[self-application-is-mandatory]] · [[context-not-prose]]): a scar carried up as narrative is a [[palimpsest]]. Within [[memory]], `dream` is the **up-and-out** motion; encode is its down-and-in counterpart in the same home. `SOUL ∉ range(dream)` ∵ the archetype changes only in the commons. `dream` is step 1 of the [[wake]] sequence. Symbol table: `references/formal-symbolic-notation.md`.

Resolve from context:

- `${AGENT_HOME}` — the agent's absolute sidecar home; each layer lives at `${AGENT_HOME}/<layer>.md` for `<layer> ∈ {SELF, MEMORY, EPISODIC}`.

## 1. Distillation

```text
E ≜ raw items read from ${AGENT_HOME}/EPISODIC          -- via memory's `read` verb (the store is the source of truth)

dream ≜ exemplify : E → I                                ∵ consolidation is exemplify applied to the raw stream

∀ i ∈ I :
    i = densest-faithful-point(i)
    instances-governing-exemplar(i) ⇒ i ↦ pointer        ∵ cite-dont-copy
```

## 2. Routing

route(I) by [[memory]]'s two axes — type/voice → organ, scope → instance. dream's materialization (σ(Φ_self) in [[materialize]]'s terms) adds only the two consolidation-only outcomes the store's resident routing has no slot for:

```text
route : I → organs(memory) ∪ { EPISODIC, drop }
identity-level(i)  ↦ SELF
durable(i)         ↦ MEMORY        ( ¬resident-worthy ⇒ vault     ∵ hot index → cold corpus )
directive(i)       ↦ scoped AGENTS.md
networked-ref(i)   ↦ vault
next-step ↦ EPISODIC                ∵ forward-looking, not yet durable
scaffold  ↦ drop                    ∵ graduates nowhere
```

## 3. Clearing

Clearing executes [[memory]]'s promotion-is-move invariant: a promoted item is gone from its raw source. The [[memory]] runtime is append-and-read (`V = {encode, read, migrate}`) — it exposes **no** compact/delete verb — so the clearing is **dream's own atomic act over the store**, not a runtime call: rewrite the EPISODIC file as (current minus consumed ids), atomically.

```text
consumed raw → ∅            ∴ EPISODIC never grows unbounded   (rewrite minus consumed ids, atomic)
∀ home : home keeps only its proper residue
```

## 4. Integrated Cascade

```text
EPISODIC ──dream──→ { SELF, MEMORY, EPISODIC, AGENTS.md, vault }

periodically : MEMORY ──dream──→ { SELF, MEMORY, vault }   ∵ depalimpsest the resident set vs current ground-truth, ¬only drop stale
    identity-level(i)              ⇒ i → SELF
    durable ∧ ¬resident-worthy(i)  ⇒ i → vault     ∵ hot index → cold corpus
    superseded(i)                  ⇒ ∅              ∵ a newer resident fact overturned i's referent — palimpsest, ¬merely stale (unused)
    stale(i)                       ⇒ ∅

acceptance ≜ a wake-time read biases the very next action
¬graspable-in-one-glance(entry) ⇒ distill-further(entry) ∨ drop(entry)
```

## See also

- [[memory]] — the organ-home this consolidation motion belongs to (and whose `read` verb sources E).
- [[wake]] — the read-and-resume counterpart; dream is step 1 of its sequence.
- [[exemplify]] · [[materialize]] — the consolidation pipeline dream applies to the raw stream.
