---
'@cratylus/forge': patch
'cratylus': patch
---

A runtime config cratylus cannot read is no longer replaced unread. `cratylus install` (its `--dry-run` too) and `cratylus deploy`, when the runtime config they would write (`$AGENT_RUNTIME_CONFIG`, else `~/.cratylus.json`) exists and is not valid JSON or not a JSON object, used to read it as empty and rewrite it whole, losing the host's bytes without a word. They now refuse before anything is placed, with one line, `cratylus install: <file> <what is wrong>; repair the file or move it away, then run cratylus install again` (`deploy` in its own name), exit 1 and nothing written anywhere. `cratylus uninstall`, which already left such a file unread, now names it among what it left, and why. A missing config and a readable one behave as before.
