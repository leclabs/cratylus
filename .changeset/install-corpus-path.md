---
'@cratylus/forge': patch
'cratylus': patch
---

`cratylus install` no longer lists or accepts `--plugin <pkg>`, a flag the command took and never acted on; it now refuses it as an option install does not take. Another corpus is installed by naming it in a `cratylus.config.ts`. In a directory whose `cratylus.config.ts` cannot be loaded (the file `cratylus init` writes, before its package is installed, or one that does not parse), install ends with one `cratylus install: <what is wrong>; <what to do>` line, exit 1 and nothing written, where it used to end in a stack trace.
