---
kind: principle
delineation: Before a generator overwrites its own output, hash what it last emitted; a mismatch means a human hand-edited the generated file, so reconcile via three-way merge (recorded hash = common ancestor) instead of silently destroying the edit.
---

# Regenerate Without Clobbering

A generator that re-emits files it previously produced will **silently destroy hand-edits** unless it can tell its own last output from a human's change. The safety net is **content hashing of every emitted artifact**: record the hash at emit time; on the next run, compare. A match means the file is still pristine generator output (safe to overwrite); a **mismatch means someone hand-edited it** — stop and surface drift (warn / error / ignore, by policy).

Drift detection is the **prerequisite** that makes a bidirectional import/regenerate cycle safe at all. With the recorded hash in hand you also get the **reconciliation primitive for free**: when both sides changed (the user edited downstream _and_ the canonical source moved), the recorded hash is the **common ancestor for a three-way merge** — the same answer version control gives to concurrent edits.

## See also

- [[bidirectional-round-trip-fidelity]] — regeneration is the write half; drift detection makes it safe to run repeatedly.
- [[doc-mirrors-runtime-truth]] — the generated file is a mirror; when it diverges from intent, detect it rather than overwrite blindly.
