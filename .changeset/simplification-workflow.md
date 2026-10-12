---
'@cratylus/runtime': minor
'cratylus': minor
---

The freeze is a rule held by review and the record, never a gate (decision 0143). Removed: the `freeze-gate` command and its reference-transaction hook, the tracking of the files a frozen check uses (`uses` in `workPackage frozen`, and the refusal to widen a package's outputs onto them), the offline proof (`proveOffline`, `judgeBatch`) and the `agent-behavior` and `behavioral` example checks. Every concept journal entry now records who appended it (`by`), and a change to a frozen concept by anyone but the cut's architect is recorded with a warning naming the cut instead of being refused. A cut opened across contexts held by different architects, and a `workPackage commit` outside the package's outputs or for a package no builder was dispatched for, now warn instead of refusing. This repository tests only its own deterministic code (decision 0144): every suite that started omp, an agent or a model, and every recorded-run proof, is removed, and CI no longer installs omp.
