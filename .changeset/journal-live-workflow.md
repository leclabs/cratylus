---
"@cratylus/runtime": minor
"cratylus": minor
---

The concept journal states and serves only the live workflow.

`concepts decide` no longer takes `--cut`: a decision stands until a later decision supersedes it or a later `deprecate` entry deprecates it. `--keeps <context>/<story>` names an example file the decision keeps standing once its story is done. `concepts leakage` treats a story's examples (`design/examples/<context>/<story>.md`) as history once the ledger records the story ended, merged or dropped, unless a standing decision keeps them; `--history` adds them back.

Entries already recorded are read as they were written: a decision whose entry names a cut stays deprecated, and that cut's examples stay history, once the ledger's history records the cut integrated; the recorded `cut` is shown only with `--history`. The `efficiency` entries recorded for cuts are past effort, shown by `concepts state` only with `--history`; no verb writes them.

The context overview no longer counts a task with no story as work on a context (it still shows in `ledger state`); a story recorded with no contexts still touches every context.

Every verb's purpose, when and parameter text, and the `state` reading's legend, name the live workflow only. Removed: `Ledger.append`, which nothing called, and the `inFlightDrafts` re-export from the ledger's index.
