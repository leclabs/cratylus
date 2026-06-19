---
kind: skill
delineation: use this skill to consolidate an agent's memory — distil the raw EPISODIC stream and route each item by two orthogonal axes (type/voice picks the organ, scope picks the instance): identity rises to SELF, durable knowledge to MEMORY, directives to the scoped AGENTS.md, networked reference to the vault, next-steps stay in EPISODIC, the rest is dropped; consumed raw is cleared; SOUL is never written.
trigger: /dream
---

# Dream Skill

The agent's "sleep" — sleep-dependent memory consolidation (replay → schema) run as an explicit step. The product is a **reboot seed, never a journal** ([[self-application-is-mandatory]] · [[context-not-prose]]): a scar carried up as narrative is a [[palimpsest]].

Within [[memory]] — the store of layers, homes, and their two opposite-provenance motions — `dream` is the **up-and-out** motion; encode is its **down-and-in** counterpart in the same home. `SOUL ∉ range(dream)` ∵ the archetype changes only in the commons.

Bindings: `dream` invokes [[exemplify]]; it is step 1 of the [[memory]] wake sequence. The symbol table is `references/formal-symbolic-notation.md`.

Resolve from context:

- ${AGENT_HOME} — the agent's absolute home `{home}/{agent}/`; each self-authored layer lives at `AGENT_HOME/<layer>.md`, for `<layer> ∈ {SELF, MEMORY, EPISODIC}`.

## 1. Distillation

```text
E ≜ raw items of AGENT_HOME/EPISODIC

dream ≜ exemplify : E → I        ∵ consolidation is exemplify applied to the raw stream

∀ i ∈ I :
    i = densest-faithful-point(i)
    instances-governing-exemplar(i) ⇒ i ↦ pointer    ∵ cite-dont-copy
```

## 2. Routing

route(I) by [[memory]]'s two axes — type/voice → organ, scope → instance. dream's materialization (σ(Φ_self) in [[materialize]]'s terms) adds only the two consolidation-only outcomes the store's resident routing has no slot for:

```text
route : I → organs(memory) ∪ { EPISODIC, drop }
next-step ↦ EPISODIC      ∵ forward-looking, not yet durable
scaffold  ↦ drop          ∵ graduates nowhere
```

## 3. Clearing

```text
promotion ≜ move, not copy

consumed raw → ∅            ∴ EPISODIC never grows unbounded (compact: rewrite minus consumed ids, atomic)

∀ home : home keeps only its proper residue
```

## 4. Integrated Cascade

```text
EPISODIC ──dream──→ { SELF, MEMORY, EPISODIC, AGENTS.md, vault }

periodically : MEMORY ──dream──→ { SELF, MEMORY, vault }
    identity-level(i)              ⇒ i → SELF
    durable ∧ ¬resident-worthy(i)  ⇒ i → vault     ∵ hot index → cold corpus
    stale(i)                       ⇒ ∅

acceptance ≜ a wake-time read biases the very next action

¬graspable-in-one-glance(entry) ⇒ distill-further(entry) ∨ drop(entry)
```
