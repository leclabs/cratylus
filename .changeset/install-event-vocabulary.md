---
'cratylus': patch
---

`install` no longer leaves a host without an event vocabulary

The zero-config `install` path placed agents, skills and hooks and then warned that
no `cratylus.config.ts` was found, so the host config was not emitted and runtime
capabilities on that host could not validate an event name — leaving `carry-on` and
`event-tap` inert. `install` IS the zero-config path; there is no config file by
definition, and deploy was being sent to read the vocabulary back off disk from a
file that cannot exist. It already resolves its plugins in memory, so it now hands
the vocabulary to deploy as a parameter.

Fixed in `d4a01b7c` and released here. The repair has been on `main` since
2026-08-07 and shipped to nobody: the commit carried no changeset, so the release
workflow ran, found no version to bump, published nothing, and reported success.
Every host installed from `cratylus@0.2.0` carries the bug.
