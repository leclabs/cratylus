---
kind: principle
delineation: Expose a capability as one host-provided API whose argument is a named mode, and let an opaque resolver route it; the consumer states intent ("open a DM") not mechanism ("if flag X open widget Y") — a mesh of named modes through one broker, never a hub of per-consumer flag-branches.
---

# Intent, Not Flag-Branches

The named mode is a closed, tagged set — self-describing and exhaustively checkable where a call-site boolean is not. Adding a variant is one new mode at the resolver, never an edit to every consumer.

When routing moves to the host, delete the consumer-side branch: a defensive call left "just in case" re-introduces the per-consumer logic the broker centralized.

## See also

- [[decision-at-the-locus-of-need]] — the resolver behind the intent API _is_ the single deciding layer.
- [[definitions-over-defaults]] — the named mode is a binding definition the consumer states; the host honours it.
- [[minimalism]] — one intent API with a closed mode set, no per-consumer fallback branch.
