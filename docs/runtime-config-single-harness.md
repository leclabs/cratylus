# Defect — `~/.cratylus.json` holds one harness's native event map, and the last deploy wins

Status: **FILED 2026-09-25, not fixed.** Observed beside the commit-durability change
(`9cb0e3b5`), outside its path.

`cratylus deploy` writes the runtime config to one harness-independent file
(`packages/forge/src/deploy/runtime-config.ts`: `$AGENT_RUNTIME_CONFIG`, else
`~/.cratylus.json`). Its `events.native` field is harness-specific: the runtime reads it as
"this harness's peer name for each event it can actually fire"
(`packages/runtime/src/runtime-config.ts:52-60`). Deploying for Claude and then for omp on one
host therefore overwrites the first harness's map with the second's. On 2026-09-25,
`deploy --harness claude` reported "31 event(s), 19 with a native peer", and a following
`deploy --harness omp` reported "31 event(s), 9 with a native peer" into the same file.

The consequence is [INFERENCE, not exercised]: a runtime capability invoked from the harness
that deployed first resolves native event names against the other harness's map. Events that
harness can fire may then be refused as unrealizable, and names may be mistranslated.

The file's own header gives the fix's shape: `vocabulary` is harness-independent and `native`
is not, so `native` should be keyed by harness (or the harness should pass its identity to the
runtime, which then selects the map), and every deploy should merge its own entry instead of
replacing the file. Acceptance: deploying claude then omp leaves both native maps intact, and
the runtime, invoked under each harness, resolves that harness's map.
