---
'@cratylus/forge': patch
'cratylus': minor
---

`cratylus --help` lists the consumer's commands first, `install` then `uninstall`, then the capabilities, then the corpus author's commands (`init`, `add`, `compose`, `project`, `optimize`, `deploy`, `explain`, `catalog`) in a group of their own, `Corpus authoring:`. The README follows the same order. `@cratylus/forge/cli`'s `projectorCommands` returns `{ consumer, author }` — the commands each audience uses — in place of one list.
