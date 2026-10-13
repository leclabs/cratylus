---
'@cratylus/forge': minor
'cratylus': minor
---

The concept journal reaches omp as one tool (decision 0037). `cratylus install --harness omp` places cratylus's own extension, `~/.omp/agent/extensions/cratylus.ts`, recorded in the deploy manifest with the other session modules, which every omp session loads. At load it registers one tool for each capability that explains itself, today the concept journal: it asks the `cratylus` on `PATH` for `cratylus concepts --explain` and registers `concept_journal` composed from that answer alone: its label and description from the explanation, a required `verb` among the explained verbs and every explained parameter with its descriptions and schema (each distinct schema under `anyOf` where verbs declare one name differently), read approval for a verb that reads and write approval for one that appends. A call runs `cratylus concepts <verb> …` in the session's directory, every value as one `--flag=value` word so a value led by `-` reaches the command as written, and returns its JSON output; a refusal is a tool error carrying the command's own message, and a positional led by `-`, which the command cannot take as a word of its own, is refused by the command. The extension holds no description, verb, parameter or rule of the journal, so a newer installed package changes the tool in the next session with the extension unchanged. The harness adapter port gains `capabilitySurface`, which forge's projection stages at the session scope.

`cratylus install` takes `--home <dir>`, installing for that home in place of yours.
