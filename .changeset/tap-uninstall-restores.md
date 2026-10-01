---
'@cratylus/runtime': patch
'cratylus': patch
---

`cratylus eventTap uninstall` now puts a Claude Code host back as it was before `install`, removing what `install` placed and nothing the host placed, and says what it left. A `settings.json` that install created, and the directories it made to hold it (the `.claude` directory in the usual case), are removed once the tap's entries are gone and nothing else is in them; before, the file stayed holding `{}` and the directory stayed. A settings file that existed before install comes back byte for byte when the host has changed nothing in it since (an empty file comes back empty; the host's indent, line endings, spacing and one-line hooks are kept) where it used to be rewritten in two-space JSON; where the host has changed it, only the tap's entries are taken out.

Where the host has since put something in a file or directory that install created, uninstall takes out only the tap's entries, keeps what the host put there, and names it: the result gains `left`, a list of `{ path, why }`, absent when nothing was left. The `EventTapHost` port's `remove` returns that list (`EventTapLeft[]`) where it returned nothing.

Install and uninstall run as separate processes, so an install stamps `restore` on the tap's own hook entries: that it created the file and how many directories, or the text of the file it found. Uninstall reads it back. A second install over a first leaves the first's stamp as the record of what the host held.
