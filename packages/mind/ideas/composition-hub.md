---
kind: concept
delineation: A named integration point where unbraided strands compose — CLI handler, API route, hook dispatcher, event handler, job worker, UI root. Orchestrates without implementing; concentrates effects, validation, and config-awareness at the edge.
---

# Composition Hub

The boundary where [[unbraided-code]]'s independent strands braid together. Six canonical hubs: CLI handler, API route, hook dispatcher, event handler, job worker, UI root.

The hub contract:

- **Orchestrate, don't implement** — a hub composes; business logic lives in the domain modules it calls.
- **Edge validation** — validate untrusted input at the hub; trust internals.
- **Effect concentration** — I/O, network, mutation happen at hubs, not interior.
- **One responsibility per hub** — a hub that "also" does N things is N+1 hubs.

**Config-awareness lives only at the hub.** The interior is forbidden state-of-the-system awareness; a pure module that reads config/env/registry has reached up the stack and become a hub. This isolation is what makes the interior one-line-testable ([[unbraided-code]]) and the wiring inspectable from one place.

Violation signatures: logic in the route; effect in the interior; and **force-fit-to-hit-coverage** — inserting a hub to satisfy an "every widget has a hub" metric, where the metric becomes the target ([[metric-is-a-guide-not-a-target]]) and the hub stops marking real composition.

## See also

- [[unbraided-code]] — the principle this names the integration points for.
- [[metric-is-a-guide-not-a-target]] — why hub-as-coverage-target degrades.
