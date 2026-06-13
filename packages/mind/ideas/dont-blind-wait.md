---
kind: process
delineation: Don't freeze on an event the harness can't notify you about — launch exactly one background poll (an until-loop that exits on the condition) so the harness re-invokes you when it fires; at most one watcher at a time.
---

# Don't Blind-Wait

When you need an event the harness can't notify you about (an inbound message landing, an external job finishing), **don't freeze waiting on it**. Launch **exactly one** background poll — an until-loop that exits on the condition — so the harness re-invokes you when it fires.

At most **one watcher at a time**: stop the old before arming a new, and retire it once the Operator is active.

## See also

- [[never-go-silent]] — the reachability principle this technique serves.
- [[permission-is-not-the-act]] — the same don't-block discipline applied to a _human approval_.
