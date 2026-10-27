---
"cratylus": minor
"@cratylus/runtime": minor
---

Every installation delivers cratylic context design beside intent-based delegation. The `cratylus` build projects both of the repository's own contexts, upstream first, to `delivered/cratylus/cratylic context design.json` and `delivered/cratylus/intent-based delegation.json`, and install places both read-only at either scope, whatever practices and rules are chosen; recording into `cratylus:cratylic context design` is refused as read-only, as into `cratylus:intent-based delegation`.

Each delivered document carries `position`, its 0-based place among the contexts its origin delivers (cratylic context design 0, intent-based delegation 1). `concepts state` and `design` show the practice by origin then position, never by file name, so cratylic context design is read before intent-based delegation; among a journal's own contexts, those holding a delivered context's identity come first in that order, then the rest in record order.

BREAKING CHANGE: `deliverContext` takes a required `position` and returns it. A delivered document without `position`, as an earlier cratylus projected it, is refused, naming the installation's scope and root: after upgrading, install again with the cratylus in use, at that installation's scope (`cratylus install --harness omp --scope user`, or `--scope project` in the project), so its delivered documents are replaced.
