---
'@cratylus/runtime': minor
'cratylus': minor
---

The runtime holds what is frozen. A cut is frozen from its `workPackage open` until its new `workPackage integrate`: for each of its contexts its examples, its judgment and its judgment folder, the checks frozen with it by the new `workPackage freeze --cut <cut> --check <path>` (a file, or a folder ending in `/`), and each concept its examples name, in its own context. `workPackage frozen` answers every cut opened and not integrated, with its architects, examples, checks and concepts: the one account of what is frozen, exported in process as `frozenCuts`.

The agent making a capability call is named in `CRATYLUS_AGENT` (`ACTING_AGENT_ENV`, `actingAgent`); absent or empty it is unknown and never an architect. `integrate` is refused unless that agent is the architect the cut records for each of its contexts; it ends that cut's freeze only, keeping its history, and another cut not integrated still freezes what the two share. `concepts supersede` and `concepts retire` of a frozen concept are refused in one line, before anything is appended, naming the concept, the cuts and their architect, unless the agent is the architect of every cut freezing it; the same name in another context is untouched. `workPackage state` tells whether the cut is integrated.
