---
kind: principle
delineation: Before a generator overwrites its own output, hash what it last emitted; a mismatch means a human hand-edited the generated file, so reconcile via three-way merge (recorded hash = common ancestor) instead of silently destroying the edit.
---

# Regenerate Without Clobbering

Drift detection gates [[bidirectional-round-trip-fidelity]]: regeneration is safe to run repeatedly only once a recorded emit-hash can distinguish pristine generator output from a hand-edit. On mismatch, surface drift by policy (warn / error / ignore). The recorded hash is also the common-ancestor primitive — when both sides moved, three-way merge resolves it.

## See also

- [[bidirectional-round-trip-fidelity]] — regeneration is the write half; drift detection makes it safe to run repeatedly.
- [[doc-mirrors-runtime-truth]] — the generated file is a mirror; when it diverges from intent, detect it rather than overwrite blindly.
