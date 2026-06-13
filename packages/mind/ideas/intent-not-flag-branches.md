---
kind: principle
delineation: Expose a capability as one host-provided API whose argument is a named mode, and let an opaque resolver route it; the consumer states intent ("open a DM") not mechanism ("if flag X open widget Y") — a mesh of named modes through one broker, never a hub of per-consumer flag-branches.
---

# Intent, Not Flag-Branches

When a capability has several variants and a routing decision behind it (which surface, which backend, which experiment), give consumers **one host-provided API whose argument is a named mode** and put the routing behind an **opaque resolver**. The consumer expresses **intent** — `openMessage(DIRECT_MESSAGE, …)`, "open a DM for this user" — never **mechanism** — "if flag X is on, open widget Y, else modal Z."

The anti-pattern is the **hub of flag-branches**: every consumer importing the variants and branching on feature flags. That multiplies the routing decision across every call site, so each must be updated in lockstep and each can drift. The right shape is a **mesh of named modes through one broker** — the modes are a closed, tagged set; the resolver is the single place the routing lives.

Two corollaries:

- **The argument carries the meaning.** A named-mode (tagged-union) argument is self-describing and exhaustively checkable; a boolean flag at the call site is not. Adding a variant is one new mode at the resolver, not an edit to every consumer.
- **When routing moves to the host, delete the consumer-side branch.** Leaving a defensive call "just in case" re-introduces the per-consumer logic you just centralized.

This is "express what you want, not how to get it" at the API seam: the affordance is the intent verb; the mechanism is the host's to choose.

## See also

- [[decision-at-the-locus-of-need]] — the resolver behind the intent API _is_ the single deciding layer.
- [[definitions-over-defaults]] — the named mode is a binding definition the consumer states; the host honours it.
- [[minimalism]] — one intent API with a closed mode set, no per-consumer fallback branch.
