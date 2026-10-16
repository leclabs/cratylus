---
"@cratylus/runtime": minor
"cratylus": minor
---

The concept journal states and serves only the live workflow.

`concepts decide` no longer takes `--cut`: a decision stands until a later decision supersedes it or a later `deprecate` entry deprecates it. `concepts leakage` reads every example file present, with or without `--history`.

Entries already recorded are read as they were written: a decision whose entry names a cut is read by its own status alone, and the recorded `cut` is shown only with `--history`. The `efficiency` entries recorded for cuts are past effort, shown by `concepts state` only with `--history`; no verb writes them.

Every verb's purpose, when and parameter text, and the `state` reading's legend, name the live workflow only.
