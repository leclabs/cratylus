---
kind: principle
delineation: The live runtime state is the source of truth; a written status doc is a mirror kept current, never the authority — keep them in sync, and when they diverge the runtime wins.
---

# Doc Mirrors Runtime Truth

For anything tracked at runtime, the **live runtime state is the source of truth**; a written status doc (a plan's PLAN.md, a status table) is a **human-readable mirror** kept current — never the authority. Update the mirror as work lands; when the two diverge, the runtime wins and the doc is corrected.

Don't reason from a stale doc, and don't promote the mirror to the truth — that is the same `[[projection-is-not-the-source]]` error at the state-tracking grain.

## See also

- [[sharded-plan-layout]] — PLAN.md is the mirror of the runtime task system.
