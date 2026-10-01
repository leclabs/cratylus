---
'@cratylus/runtime': patch
---

`cratylus eventTap install` no longer says Claude Code fires no native event for an act event when the host's claude stanza merely predates act bindings. On a stanza that carries no act bindings at all (one written by a deploy before `claude-act-natives`), an event with no native name is skipped, and refused when nothing else can be tapped, with a reason that says the stanza may lack its binding and names the commands that write it, `cratylus install --harness claude` or `cratylus deploy --harness claude`, besides the case that Claude Code has no native peer for it. A stanza that does carry act bindings, but not the requested event's, keeps the reason 'Claude Code fires no native event for it'. Exit codes and what is written are unchanged.
