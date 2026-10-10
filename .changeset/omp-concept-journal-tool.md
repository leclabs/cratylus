---
'@cratylus/forge': minor
'cratylus': minor
---

The concept journal reaches omp as one tool (decision 0037). `cratylus install --harness omp` places one extension, `~/.omp/agent/extensions/cratylus-concepts.ts`, recorded in the deploy manifest with the other session modules, which every omp session loads. At load it asks the `cratylus` on `PATH` for `cratylus concepts --explain` and registers the tool `concept_journal` composed from that answer alone: its label and description from the explanation, a required `verb` among the explained verbs and every explained parameter with its schema and descriptions, read approval for a verb that reads and write approval for one that appends. A call runs `cratylus concepts <verb> …` in the session's directory and returns its JSON output; a refusal is a tool error carrying the command's own message. The extension holds no description, verb, parameter or rule of the journal, so a newer installed package changes the tool in the next session with the extension unchanged. The harness adapter port gains `capabilitySurface`, which forge's projection stages at the session scope.

`cratylus install` takes `--home <dir>`, installing for that home in place of yours.
