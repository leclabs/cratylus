---
"@cratylus/runtime": minor
---

The runtime gains the pin: a unit's reference to the concept version it realizes

`take` pins a concept's one head, which must be a version: it refuses a diverged concept, a
withdrawn one and an unknown one, since none has a single version to pin. The pin also records
the head, at that moment, of every concept the pinned one stands on. `drifted` reads a pin whose
version is no longer a head, because a later version or a retraction now names it. `suspect`
reads a pin whose concept, or any concept it stands on, has diverged or has a version newer than
the one current when the pin was taken. Both are computed from the design domain's fold at the
moment of the read. Which concepts a concept stands on is supplied by the caller through a port,
so the pin imports nothing from the design domain. The pin is internal to the runtime and is
exported through neither the `.` barrel nor a subpath.
