---
"@cratylus/runtime": minor
"@cratylus/forge": minor
"cratylus": minor
---

The host runtime config keeps one stanza of native event names per harness

`~/.cratylus.json` (or `$AGENT_RUNTIME_CONFIG`) held one flat map of native event names, so the last deploy won: deploying for Claude and then for omp left Claude reading omp's names. Native names now live in one stanza per harness, `harnesses.<harness>.native`. A deploy writes the corpus's parts (`events.vocabulary`, `configuration`) and its own harness's stanza, and leaves the operator's `capabilities` and `resolveFrom` and every other harness's stanza as it found them. The deploy log names the stanza it wrote.

`@cratylus/runtime`: `nativeEventsOf(config, harness)` is the one reader of native names. It returns that harness's stanza, or throws a refusal naming `cratylus install --harness <harness>` and `cratylus deploy --harness <harness>`. `RuntimeConfig` gains `harnesses`, and `RuntimeEvents` loses `native`. `cratylus eventTap` asks for `claude`'s names through it.

`@cratylus/forge`: `emitRuntimeConfig` and `runtimeConfigDocument` take the harness's name (`harness`, the adapter's `name`) with its `nativeEvents`, and the result carries the `stanza` written. `EmittedEvents` loses `native`, and `EmittedRuntimeConfig` gains `harnesses`.

**Breaking.** The old flat shape is not read. On a host deployed before this change, `cratylus eventTap` refuses until you run `cratylus install --harness claude` or `cratylus deploy --harness claude` once.
