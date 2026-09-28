---
"@cratylus/runtime": minor
"@cratylus/forge": minor
---

Session scope belongs to the capability, not to every runtime shim

`@cratylus/runtime/capability` declares every capability once with whether its
state belongs to one agent session (`SESSION_SCOPED`); `CAPABILITIES` is derived
from it. Only `memory` is session-scoped today. A projected shim bridges or
demands a session id only for a session-scoped capability, so the `design`,
`plan` and `note` shims now forward from any harness, omp included, with no
session id. Every generated shim carries a signature line,
`// cratylus-shim: <capability>`, and the omp launcher states a route only for a
script that carries it. `omp-agent` now inlines no skills under `--no-skills`
and warns once when a `--skills` filter is passed.
