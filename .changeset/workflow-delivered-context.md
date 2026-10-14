---
'cratylus': minor
'@cratylus/runtime': minor
'@cratylus/forge': minor
---

cratylus delivers its own workflow context to every project (decision 0207).

The `cratylus` package's build projects the repository's `workflow` context from its concept journal — the current subject and relation and every live concept at its current meaning, with no history, decisions or retired concepts — with origin `cratylus` and the package's version. `install` and `deploy` place it read-only in the owned root as `delivered/cratylus/workflow.json`; upgrading replaces it and uninstalling removes it with the root.

`@cratylus/runtime` exports `deliverContext({ from, context, origin, version })`, the projection. `cratylus concepts overview`, `state` and `design` show each delivered context of the installation the command reaches beside the project's own, as `cratylus:workflow`, carrying `delivered: { origin, version, context, identity }` and `readOnly: true`, unless the project's journal holds a context entry with that identity. Its history has no versions, only its current meaning; it has no decisions. Recording into it is refused as read-only and nothing is written; reading never creates the journal. `dispatchConcepts` called as a library sees delivered contexts only when handed them.
