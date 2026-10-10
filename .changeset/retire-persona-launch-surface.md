---
'@cratylus/forge': major
'cratylus': major
---

Install no longer places a persona launch surface: no `omp-agent` launcher, no per-persona `omp.yml` `--config` overlay, no `cratylus-persona-badge.ts` module, and no persona command in `~/.local/bin`. A session is started as an agent only through the harness itself, `omp --agent <name>` (or `claude --agent <name>`). The install options `--link-persona-commands` and `--no-link-persona-commands`, and the question they answered, are removed; passing either is now an unknown-option error.

An earlier install's launch surface is taken away: the next `cratylus install` prunes the launcher, overlays and badge modules its deploy manifest records, and unlinks each persona command recorded under `personaLinks` while it still points into the harness's home (one since pointed elsewhere is left and reported); `cratylus uninstall` removes them too.

The modules composed for one agent (its guardrails and its copies of the session and isolation modules) are still placed under `~/.omp/agent/personas/<name>/extensions/`, which nothing loads without the retired overlay, so a per-agent guard does not judge an `omp --agent` session yet.

**Breaking for `@cratylus/forge` consumers.** Removed: `HarnessAdapter.launcherFile`, `HarnessProjection.executable`, `SCOPE_DIR_TOKEN`, the omp adapter's `OMP_LAUNCHER_FILE`, `OMP_LAUNCHER_SCRIPT`, `OMP_OVERLAY_FILE`, `OMP_PERSONA_BADGE_MODULE`, `ompLaunchSurface`, `ompOverlayYaml` and `ompPersonaBadgeExtensions`, and from `deploy` `planPersonaCommands`, `placePersonaCommands`, `describePersonaCommands`, `describePersonaRemoval`, `personaLauncherOf`, `PERSONA_BIN_REL` and their types. `removePersonaCommands({ home, harnessDir, dry })` now takes only the recorded links. `InstallCmdOpts.linkPersonaCommands` and `pathEnv`, and `InstallPrompts.linkCommands`, are removed.
