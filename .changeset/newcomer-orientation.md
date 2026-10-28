---
'cratylus': minor
'@cratylus/runtime': minor
'@cratylus/forge': minor
---

The command describes itself, and every omp session knows from its start what cratylus is for and how using it starts. `@cratylus/runtime` holds the one text, `ORIENTATION` (of `PURPOSE`, `START` and `THEORY`): what cratylus is for, that using it starts by launching the business analyst with `omp --agent business-analyst` and saying what you want, and that its theory is cratylic context design, whose domain model is in cratylus's repository at `design/model/cratylic-context-design`.

`cratylus --help` opens with what the command is for. `cratylus` with no arguments prints the three-line orientation and a line naming `cratylus --help` for everything else, on stdout, exit 0 (it printed the help on stderr and exited 1). `cratylus --explain` prints `{name, purpose, orientation}` as JSON.

The cratylus omp extension runs the reached command's `--explain` once at load and appends its orientation, verbatim, right after omp's own system prompt in every session, launched or not, main or dispatched; a command that cannot explain itself adds nothing. The READMEs name the business analyst, by its command, as the way in.
