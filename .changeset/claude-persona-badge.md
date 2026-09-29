---
'@cratylus/forge': minor
'cratylus': minor
---

The persona badge now shows on Claude Code, and on omp it lands in the status line instead of beneath it. On Claude Code the badge is `<mark emoji> <name>` (the name alone for a persona with no mark, no color), in the status line of a session started with `--agent`, and never in a subagent's or a bare session's. `cratylus install` sets it as the status line where the host has none, through one worker that reads the running persona from the status line's own input (`agent.name`) and prints that persona's badge file, or nothing where none was placed. It needs `jq` and fails open without it.

A status line the host already has is never replaced. Install leaves it byte-identical and prints one line offering `--wrap-status-line`; with that flag the command becomes the worker with the host's command as its one argument, the host's output keeps every byte and gains the badge in front of its first line, every other `statusLine` key such as `padding` is kept, and a second run wraps nothing twice. `--dry-run` writes nothing.

On omp an extension's status renders inside the status line only where the host lists the `status` segment, and omp reads a segment list only under `statusLine.preset: custom`. Install now edits the config file omp reads (`config.yml`, else `config.yaml`) by the preset the host is on. With no preset set (a file with no `statusLine` included) it writes `preset: custom` with the default preset's own left segments plus `status`, its right segments and its segment options, so the line looks as before with the badge added, and keeps any layout key the host already wrote. On `preset: custom` it appends `status` after the last item of the host's `leftSegments` with no other byte changed, or writes omp's custom left list plus `status` where the host lists none. A host on any other named preset is left byte-identical and told the one addition that would show the badge. A shape it cannot extend is reported and left as it is.

The persona-command prompt now says how many commands it will link and how many it will adopt, rather than counting both as one number.

`@cratylus/forge` adds `HarnessAdapter.statusLine` (the Claude worker's file and the command that runs it) and `HarnessAdapter.statusSegment` (omp's config files, status segment, default layout and custom left list), the claude adapter's badge files and status-line worker in `launchSurface`, `deploy/status-line.ts` with `ensureBadgeStatusLine` and `ensureStatusSegment`, and `deploy/yaml-lines.ts`, the line helpers `model-roles.ts` and `status-line.ts` now share. `cratylus` adds the `install --wrap-status-line` flag.
