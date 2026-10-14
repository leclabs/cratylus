---
'@cratylus/runtime': minor
'@cratylus/canon': minor
'cratylus': minor
---

A project's record states its purpose, read first, and the architect writes for the operator in plain words (decisions 0215, 0216).

- **The project's purpose.** `cratylus concepts purpose --statement '…'` records what the project is for, in plain words; `--reason '…'` with a new statement changes it, superseding the current one, the way a context's description changes. `concepts overview` and `concepts state` show it first, as `purpose`, before any context (`null` until one is recorded); purposes recorded differently on two branches are listed under `competingPurposes` until a later one with a reason settles them.
- **Plain words for the operator.** The architect's register is now `layman`: everything it writes for the operator, replies and documents alike, is in plain words for a layman, at the level of meaning. It explains in its own words rather than quoting the record, names a decision or concept by what it says and never by its number in the record, and leaves out history and mechanics unless asked.
