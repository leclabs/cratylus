---
"@cratylus/runtime": minor
---

The runtime gains the pin: a unit's reference to the concept version it realizes

`take` pins a concept only when the concept and its whole closure are settled and live. It holds
the concept's one head, a version, together with the one head of every other concept in the
closure at that moment. It refuses when the concept or any concept in its closure is unknown,
diverged or withdrawn, since there is then no single version to pin. `drifted` reads a pin whose
version is no longer a head, because a later version or a retraction now names it. A pin that has
not drifted is `suspect` when any other concept in the closure has diverged, been withdrawn or
gained a newer version since the pin was taken, so the two readings are disjoint. Both are
computed from the design domain's fold at the moment of the read. The caller supplies the closure
through a port, so the pin imports nothing from the design domain. The pin is internal to the
runtime and is exported through neither the `.` barrel nor a subpath.
