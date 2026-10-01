---
'@cratylus/runtime': patch
'cratylus': patch
---

`cratylus eventTap uninstall` now puts a Claude Code host back as it was before `install`, removing what `install` placed and nothing the host placed. A `settings.json` that install created, and the directories it made to hold it (the `.claude` directory in the usual case), are removed once the tap's entries are gone and nothing else is in them; before, the file stayed holding `{}` and the directory stayed. A settings file that existed before install comes back in the layout the host had it in (its indent, or one line, and its trailing whitespace; an empty file comes back empty) where it used to be rewritten in two-space JSON, and a file or directory the host has since added to is kept with what the host added.

Install and uninstall run as separate processes, so an install stamps `restore` on the tap's own hook entries: that it created the file and how many directories, or the layout of the file it found. Uninstall reads it back. A second install over a first leaves the first's stamp as the record of what the host held.
