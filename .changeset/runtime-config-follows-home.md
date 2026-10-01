---
'@cratylus/forge': patch
---

The runtime config now follows the home a run is given. `cratylus deploy --scope user --home <dir>` writes `<dir>/.cratylus.json` and no longer writes the operator's own `~/.cratylus.json`. `cratylus install` writes it under its home, and `cratylus uninstall` takes the harness's stanza from its home's file and leaves the operator's `~/.cratylus.json` alone; before, uninstall edited or deleted the process home's file whatever home it was given. `$AGENT_RUNTIME_CONFIG` still wins wherever it is set. A project-scope deploy, and a run given no home, keep the process's home. The runtime's own reading is unchanged. `runtimeConfigTarget` takes the home as a second argument, and `emitRuntimeConfig` takes it as `home`.
