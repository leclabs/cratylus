---
'@cratylus/forge': patch
'@cratylus/canon': patch
---

omp launcher resolves its own path through symlinks

`omp-launch` computed `dirname "$0"` and passed `--config <that dir>/omp.yml`.
Linked into a `PATH` dir - the one way an operator runs a persona by name - `$0`
is the link, and omp refused to start: `Config overlay not found:
~/.local/bin/omp.yml`. The script now walks `readlink` to the real file before
resolving its directory, with hops capped so a link cycle fails instead of
hanging.
