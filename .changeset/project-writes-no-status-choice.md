---
"cratylus": minor
"@cratylus/forge": minor
---

A project installation writes no operator's own setting. Besides binding no models, `cratylus install --scope project` no longer asks whether the status line shows the session's agent and writes nothing about the status line, in the project's `.omp/config.yml` or anywhere else, and `--agent-status` with `--scope project` is refused, naming `cratylus install --scope user --agent-status <show|hide>` instead. It reads, without writing, the project's settings over your own (a key set to null counting as unset), and where they hide the session's agent names how to show it as your next step: the project's own `statusLine` keys that hide it, to change in the project's `.omp/config.yml`, or, where your settings alone hide it, `cratylus install --scope user --agent-status show` (or, where your user installation already recorded that answer, which a user install never applies again, the keys in your own `~/.omp/agent/config.yml` to change there). A user installation asks and writes the status line choice as before.
