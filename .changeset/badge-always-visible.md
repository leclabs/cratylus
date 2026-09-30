---
'@cratylus/forge': minor
---

`cratylus install` now wraps a host's own Claude Code status line in the persona badge by default, so a persona's name and mark stay visible in the status line of its session wherever the host has one. The host's command becomes the badge worker's one argument: in a session that runs no persona its output reaches the status line byte for byte, and in a persona's session the badge and a space go in front of its first line. Every other `statusLine` key such as `padding` is kept, install prints what it changed and how the host's output is kept, and a second install changes no byte. The `--wrap-status-line` flag is removed; it no longer chooses anything.

The host's original command is recorded in the deploy manifest (`DeployManifest.statusLine`: the `command` install placed, and the host's own, `null` where the host had none), and a wrapped status line found on a host installed before the record is recorded on the next install, so an uninstall can restore the host's line exactly. A `statusLine` that is not a `command` one is left as it is and install says that Claude Code rejects such a settings file and runs no status line, so no badge can show there until it is fixed.

`ensureBadgeStatusLine` drops its `wrap` option and the `offer` state, and its result now carries `placed` and `host`.

On omp, a host on a named preset other than `custom`, or with a layout of its own and no preset, has no `status` segment in its line, so the row omp prints beneath the editor is where the badge shows. Where such a host had turned that row off (`statusLine.showHookStatus: false`), the badge showed nowhere while install said it rendered beneath the line; install now turns that one value to `true`, changes no other byte, and says so. The same holds for a `custom` list install cannot extend. `ensureStatusSegment`'s result carries `hookRowShown` for it.
