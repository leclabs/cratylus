---
'cratylus': minor
'@cratylus/runtime': minor
'@cratylus/forge': minor
---

The command describes itself, and every omp session knows from its start what cratylus is for and how using it starts. `@cratylus/runtime` holds the one text: what cratylus is for, that using it starts by launching the architect with `omp --agent architect` and saying what you want, and that its theory is cratylic context design, read with `cratylus concepts design`.

`cratylus --help` opens with what the command is for. `cratylus` with no arguments prints the three-line orientation and a line naming `cratylus --help` for everything else, on stdout, exit 0 (it printed the help on stderr and exited 1). `cratylus --explain` prints `{name, purpose, orientation}` as JSON.

The cratylus omp extension runs the reached command's `--explain` once at load and appends its orientation, verbatim, right after omp's own system prompt in every session, launched or not, main or dispatched; a command that cannot explain itself adds nothing. A completed install whose agents include the architect ends with the start line. The READMEs name the architect as the way in.
