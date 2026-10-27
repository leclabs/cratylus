---
'cratylus': minor
---

`cratylus install` installs every agent and skill of the canon, and offers the rulesets, whole or rule by rule. Run with no terminal and naming only the harness, it installs everything and is never refused for want of a choice. Its options are `--harness`, `--scope`, `--rules`, `--model-roles`, `--agent-status`, `--yes`, `--verbose`, `--dry-run` and `--home`.

BREAKING CHANGE: `cratylus install` refuses any option not listed above; a script passing one must drop it.
