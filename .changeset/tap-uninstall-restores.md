---
'@cratylus/runtime': patch
'cratylus': patch
---

`cratylus eventTap uninstall` now removes what `install` placed on Claude Code and nothing the host placed: a `settings.json` that install created, and the directories it made to hold it (the `.claude` directory in the usual case), are removed once the tap's entries are gone and nothing else is in them. Before, the file stayed holding `{}` and the directory stayed. A settings file or directory that existed before install keeps exactly what it held, and one the host has since added to is kept with what the host added.

Install and uninstall run as separate processes, so an install that creates the settings file stamps `createdDirectories` (the number of directories it made) on the tap's own hook entries, which uninstall reads back.
