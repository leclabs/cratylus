---
"@cratylus/forge": minor
---

`install`, `uninstall` and `deploy` now speak in one register, and two of them are quiet by default.

- A result goes to stdout. A failure is one stderr line, `cratylus <command>: <what went wrong>; <what to do>`, and exits non-zero. A warning is one stderr line, `cratylus <command>: warning: <message>`. The `✓`, `✗` and `!` markers, the `===` banners and the blank spacer lines are gone.
- Colour marks only the prefix of a failure or warning, and is decided per stream: only when that stream is a terminal and `NO_COLOR` is unset. `CI` and `FORCE_COLOR` no longer put escape bytes into a pipe or a redirected stderr. The colour comes from `chalk`, imported by one module, `src/cli/style.ts`.
- `deploy` and `uninstall` print a short summary with counts and the next step. The per-file lines are behind a new `--verbose`. What `uninstall` leaves because the host placed or changed it is still named by default.
- A bare `--home` is noted once, not once per kind.
- `install`'s preview and summary now name the runtime config it writes (`~/.cratylus.json`, or `$AGENT_RUNTIME_CONFIG`), and any other directory outside the harness's own it places files in.
- A deploy refused because a placed shim cannot run is reported as the failure it is, on the failure line, not as a warning.
- `uninstall` names, by default, what it takes back outside the harness directory: persona commands, the shared files under `~/.agents`, and the runtime config.
- `deploy` refuses a render directory it reads that does not exist (the dirs its `--kind` reads, no others), instead of reading it as an empty tree and pruning what an earlier deploy placed. It also refuses an unknown `--kind`. `install` refuses an unknown `--harness` on one line.
