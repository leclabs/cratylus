---
kind: principle
delineation: The live runtime state is the source of truth; a written status doc is a mirror kept current, never the authority — keep them in sync, and when they diverge the runtime wins.
---

# Doc Mirrors Runtime Truth

`[[projection-is-not-the-source]]` at the state-tracking grain: a written status doc (a plan's PLAN.md, a status table) is the mirror, the runtime is the source. Update the mirror as work lands; never reason from a stale doc, never promote the mirror to truth.

## See also

- [[sharded-plan-layout]] — PLAN.md is the mirror of the runtime task system.
