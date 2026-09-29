---
'@cratylus/forge': minor
'cratylus': minor
---

`cratylus install` can make each installed persona a command. `--link-personas` links `~/.local/bin/<persona>` to the harness's launcher, so `planner -p 'hi'` starts a session as the planner persona: on omp through the generated `omp-agent`, and on Claude Code through a new `claude-agent` launcher that starts `claude --agent <persona>` and refuses a name that is no persona with one stderr line and exit 2. Without the flag, install prints one `would place` line per persona and says how to add them; on a terminal it asks first and answers no by default. It says when `~/.local/bin` is not on `PATH`.

It never overwrites. A name taken by a regular file, by another program's link, or by a link to the launcher that nothing recorded is left as it is and reported as blocked with what is there. A persona has one command across harnesses: whichever install links a name first owns it, and the other harness's install reports it as blocked by the first harness's launcher without suffixing a name.

`@cratylus/forge` adds `HarnessAdapter.launcherFile`, the claude adapter's `launchSurface` (one session-scoped `claude-agent`, staged and deployed like omp's launcher), and `deploy/persona-commands.ts` with `planPersonaCommands`, `placePersonaCommands`, `removePersonaCommands` and `personaLauncherOf`. The links an install placed are recorded as `personaLinks` in the deploy manifest, and removal takes exactly the recorded links that still resolve to the launcher. There is no `cratylus uninstall` verb yet.
