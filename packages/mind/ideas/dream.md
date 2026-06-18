---
kind: skill
delineation: use this skill to consolidate an agent's memory — the four-layer identity-memory stack (SOUL commons-fixed; SELF, MEMORY, EPISODIC self-authored) distilled upward by durability × orthogonality: next-steps stay in EPISODIC, durable orthogonal facts rise to MEMORY, identity-shaping facts rise to SELF, source-coupled facts leave for the source-local doc, consumed raw is cleared; SOUL is never written.
trigger: /dream
---

# Dream Skill

The agent's "sleep" — sleep-dependent memory consolidation (replay → schema) run as an explicit step: fires as step 1 of agent-know-thyself's wake sequence, before resuming work. The product is a **reboot seed, never a journal** ([[self-application-is-mandatory]] · [[context-not-prose]]): a scar carried up as narrative is a [[palimpsest]].

The stack it consolidates into — the layers SOUL/SELF/MEMORY/EPISODIC and their two opposite-provenance motions — is [[identity-memory-stack]]. `dream` is the **up-and-out** motion; the down-and-in counterpart `encode` binds [[episodic-encoding]]. `SOUL ∉ range(dream)` — the archetype changes only in the commons.

Bindings: `dream` invokes the [[exemplify]] pipeline (`D ──CA──→ C ──η──→ A ──Φ──→ σ(·, s) ──→ F`), used below as the bare operator `exemplify`; it is step 1 of [[agent-know-thyself]]'s wake sequence, consolidating that protocol's `${AGENT_HOME}` layers. The symbol table is `references/formal-symbolic-notation.md`.

Resolve from context:

- ${AGENT_HOME} — the agent's absolute home `{home}/{agent}/`; each self-authored layer lives at `AGENT_HOME/<layer>.md`, for `<layer> ∈ {SELF, MEMORY, EPISODIC}`.

## 1. Distillation

```text
E ≜ raw items of AGENT_HOME/EPISODIC.md

dream ≜ exemplify : E → I        ∵ consolidation is exemplify applied to the raw stream

∀ i ∈ I :
    i = densest-faithful-point(i)
    instances-governing-exemplar(i) ⇒ i ↦ pointer    ∵ cite-dont-copy
```

## 2. Routing

dream's materialization strategy — σ(Φ_self, layers) in [[materialize]]'s terms, with ρ keyed on **durability × orthogonality** rather than kind:

```text
route : I → L ∪ docs        L ≜ {SELF, MEMORY, EPISODIC}

orthogonal(i) ≜ ¬∃ source artifact a : i is load-bearing for a

∀ i ∈ I :
    ¬orthogonal(i)      ⇒ i → docs(a), i ∉ L    ∵ L is read every session, competing with the loaded source for attention
    identity-shaping(i) ⇒ i → SELF
    durable-fact(i)     ⇒ i → MEMORY
    next-step(i)        ⇒ i → EPISODIC
```

## 3. Clearing

```text
promotion ≜ move, not copy

consumed raw → ∅            ∴ EPISODIC never grows unbounded

∀ layer ∈ L : layer keeps only its proper residue
```

## 4. Integrated Cascade

```text
EPISODIC ──dream──→ {SELF, MEMORY, EPISODIC}

periodically : MEMORY ──dream──→ {SELF, MEMORY}
    identity-level(i) ⇒ i → SELF
    stale(i)          ⇒ ∅

acceptance ≜ a wake-time read biases the very next action

¬graspable-in-one-glance(entry) ⇒ distill-further(entry) ∨ drop(entry)
```
