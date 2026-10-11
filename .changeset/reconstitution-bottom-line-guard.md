---
'@cratylus/canon': minor
'@cratylus/forge': patch
---

Canon ships the `bottom-line` guard (`bottomLine`), bound to `turn.end`, whose judge answers `{"buries": boolean, "reason": string}`. The architect's fixed `bottom-line-up-front` ordering is held by it (`guarded(bottomLineUpFront, bottomLine)`), so a reply to the operator that does not lead with its conclusion, gives a topic more than one recommended action (a decision reported settled with its reason is that topic's action), or carries support past what a layman needs (record identifiers, entry status, how records are edited, tool names) is refused with the tell `burying`.

On omp, every guard bound to the same event is now judged by one handler, and their refusals reach the agent as one, each reason in it. Before, each guard registered its own handler and omp kept the last answer to a stop, so one guard's refusal hid another's. A stop already refused once is still not refused again.
