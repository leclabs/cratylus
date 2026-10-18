---
"cratylus": minor
"@cratylus/forge": minor
---

A project installation writes no operator's own setting. Besides binding no models, `cratylus install --scope project` no longer asks whether the status line shows the session's agent and writes nothing about the status line, in the project's `.omp/config.yml` or anywhere else, and `--agent-status` with `--scope project` is refused, naming `cratylus install --scope user --agent-status <show|hide>` instead. It reads, without writing, the project's settings over your own, and where they hide the session's agent names showing it, with `cratylus install --scope user --agent-status show`, as your next step. A user installation asks and writes the status line choice as before.
