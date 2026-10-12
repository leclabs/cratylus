---
'@cratylus/runtime': minor
'cratylus': minor
---

The runtime records what is frozen. A cut is frozen from its `workPackage open` until its new `workPackage integrate`. From its opening, for each of its contexts, it freezes its examples, its held-out example text `design/judgment/<context>/<cut>.md` and each concept its examples name, in its own context. The new `workPackage freeze --cut <cut> --check <path>` (a file, or a folder ending in `/`) freezes the checks it names, a held-out check under `design/judgment/<context>/<cut>/` only once a freeze names it. `workPackage frozen` answers every cut opened and not integrated, with its architects, examples, checks, concepts and unchecked examples.

The agent making a capability call is named in `CRATYLUS_AGENT` (`ACTING_AGENT_ENV`, `actingAgent`). `integrate` is refused unless that agent is the architect the cut records for each of its contexts. `workPackage state` tells whether the cut is integrated.
