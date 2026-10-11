---
'@cratylus/canon': minor
'@cratylus/forge': minor
'@cratylus/schema': minor
---

Canon ships the `unrecorded` guard (`unrecorded`), bound to `turn.end`, whose judge answers `{"unrecorded": boolean, "reason": string}`. The architect's `decisions-with-reasons` deliverable is held by it (`guarded(decisionsWithReasons, unrecorded)`), so a reply that reports an owned meaning question settled in its turn, while no decision recorded that turn carries it, is refused with the tell `holding open`: a decision is taken when it is recorded.

`@cratylus/schema`'s `GuardJudge` gains the optional `recorded`: a judge that sets it also reads the decisions the agent recorded this turn. On omp the cratylus module, which knows the `concepts` capability's tool and appending verbs, lends the session module a reader of the session branch: each append through that tool, or its `xd://` device, whose call took effect since the operator's last message (or the last compaction), as its verb and arguments. The session module gives them to the judge ahead of the reply, and, with no reader, judges nothing and says so.
