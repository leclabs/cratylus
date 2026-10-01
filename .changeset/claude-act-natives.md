---
'@cratylus/forge': patch
'@cratylus/runtime': patch
---

`cratylus eventTap install` now taps Claude Code's act events. The claude stanza of the host runtime config carries each act's native binding beside its names, `harnesses.claude.acts`: `operator.consult.pre` is `PreToolUse` matching `AskUserQuestion`, and `subagent.dispatch.pre` is `PreToolUse` matching `Agent|SendMessage`, taken from the claude adapter as the projection binds them. Deploy emits them from a new optional `HarnessAdapter.nativeActs`. The runtime reads them with `nativeActsOf`, installs a matcher-narrowed `PreToolUse` entry for such an event, keeps foreign entries, and reads a capture back as the act it was. Before, the tap refused both events as ones Claude Code fires no event for. A stanza an earlier deploy wrote, names only, still reads, and its act events are skipped as before; deploy again to tap them.
