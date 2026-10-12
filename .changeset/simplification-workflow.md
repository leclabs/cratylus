---
'@cratylus/runtime': minor
'cratylus': minor
---

The freeze is a rule held by review and the record, never a gate (decision 0143). Removed: the `freeze-gate` command and its reference-transaction hook, the tracking of the files a frozen check uses (`uses` in `workPackage frozen`, and the refusal to widen a package's outputs onto them), the offline proof (`proveOffline`, `judgeBatch`) and the `agent-behavior` and `behavioral` example checks.

Who makes an append to the record is the acting agent (`CRATYLUS_AGENT`), else git's `user.name` (`makerAt`). Every concept journal entry records it as `by`, and `workPackage integrate` records it as `agent`. A change to a frozen concept, or an integration, by anyone but the cut's architect is recorded with a warning naming the cut and its architect instead of being refused.

These now warn instead of refusing (decision 0142(2)): a cut opened across contexts held by different architects; a work package whose outputs overlap another's, or that needs an output of a package it does not depend on (the package is recorded); and a `workPackage commit` outside the package's outputs or for a package no builder was dispatched for. The immutability gate still refuses a change to a recorded entry, now naming the harm and the way past.

An example's mechanical check is optional: an example with none is valid, judged by reading, and `checkExample` answers `{ status: 'unchecked' }` for it.

This repository tests only its own deterministic code (decision 0144): every suite that started omp, an agent or a model, and every recorded-run proof, is removed, and CI no longer installs omp.
