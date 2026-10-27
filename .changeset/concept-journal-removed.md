---
'cratylus': minor
'@cratylus/runtime': minor
'@cratylus/forge': minor
'@cratylus/canon': minor
---

The domain model is plain files in `design/model/`, checked by the model check: `cratylus model check`, in omp the tool `model_check`. The command offers `install`, `uninstall` and exactly two capabilities, `model` and `versionSkew`; the runtime's `CAPABILITIES` and canon's `RUNTIME_CAPABILITIES` are `model` and `versionSkew`, and every capability tool only reads.

- `@cratylus/runtime` exports from `.` the capabilities' explanations (`MODEL_CHECK`, `VERSION_SKEW`), `explain` and the command's self-description; `./runtime-config` holds the runtime configuration and the installation's root and scope. Its subpaths are `.`, `./main`, `./bin-name`, `./capability`, `./runtime-config` and `./package.json`.
- A build projects the agents, skills and rules, and install places them, the extension and the installation record in the owned root, and nothing else.
- The cratylus omp extension is emitted whenever the harness adapter has one (`HarnessAdapter.capabilitySurface`), and it alone carries the capabilities to the harness.

BREAKING CHANGE: a script or import using a command, tool, export, subpath or installed file not listed above must drop it.
