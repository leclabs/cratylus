---
'@cratylus/canon': patch
---

The guards bind a persona's own main session and no subagent it dispatches. On Claude Code the three guard workers exit without judging, and without a notice, on a payload carrying `agent_id`; the Stop guard no longer binds `subagent.end`, so a finished subagent's turn is not judged.
