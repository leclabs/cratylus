---
kind: concept
delineation: A named integration point where unbraided strands compose — CLI handler, API route, hook dispatcher, event handler, job worker, UI root. Orchestrates without implementing; concentrates effects, validation, and config-awareness at the edge.
---

# Composition Hub

The boundary where [[unbraided-code]]'s independent strands braid together.

Beyond the delineation's orchestrate/validate/concentrate contract:

- **One responsibility per hub** — a hub that "also" does N things is N+1 hubs.
- **Config-awareness lives only at the hub.** The interior is forbidden state-of-the-system awareness; a pure module that reads config/env/registry has reached up the stack and become a hub — which is what keeps the interior one-line-testable ([[unbraided-code]]).

Violation signatures: logic in the route; effect in the interior; and **force-fit-to-hit-coverage** — inserting a hub to satisfy an "every widget has a hub" metric ([[goodharts-law]]), where it stops marking real composition.

## See also

- [[unbraided-code]] — the principle this names the integration points for.
- [[goodharts-law]] — why hub-as-coverage-target degrades.
