---
'cratylus': minor
'@cratylus/runtime': minor
'@cratylus/forge': minor
'@cratylus/canon': minor
---

The concept journal is removed, and the model check replaces it: the domain model is plain files in `design/model/`, checked by `cratylus model check`, in omp the tool `model_check`. `cratylus concepts` is gone and is refused as an unknown command, and the omp extension no longer offers the `concept_journal` tool. The runtime's capabilities (`CAPABILITIES`) and canon's `RUNTIME_CAPABILITIES` are `model` and `versionSkew`, and every capability tool only reads. Also gone:

- `@cratylus/runtime`: `JOURNAL`, `deliverContext`, `DeliveredContext`, `ACTING_AGENT_ENV` and `actingAgent` from `.`; `DELIVERED_DIR` and `deliveredContexts` from `./runtime-config`; the `./ulid` subpath; the record store; and the `closes` effect.
- Delivered contexts: a build no longer projects cratylus's own contexts into `dist/delivered/`, and install no longer places `delivered/<origin>/<context>.json` in the owned root; `@cratylus/forge/cli` no longer takes `delivered` or exports `DeliveredDocument`.
- The acting agent: the omp extension no longer names the session's agent in `CRATYLUS_AGENT` on capability or shell calls.
- Capability prose: `HarnessAdapter.nativeCapabilities`, the projection report's `capabilities` and the `capabilities/<capability>.md` prose form are gone; the cratylus omp extension is emitted whenever the harness adapter has one (`HarnessAdapter.capabilitySurface`).
