---
'@cratylus/forge': minor
'@cratylus/canon': patch
'cratylus': minor
---

The codex adapter is removed: cratylus projects to Claude Code and omp only.

`@cratylus/forge` drops `adapters/codex` (the `./adapters/codex` subpath and `codexHarnessAdapter`), and the registry's `HarnessName` is `'claude' | 'omp'`, so `--harness codex` on `project` and `deploy` is refused with the known harnesses named. The port op `HarnessAdapter.scopeOrientation`, which only codex implemented, is removed along with its projection branch. The degrade-and-warn members `preloadsSkills`, `scopes`, `unnarrowed` and `agentExt` stay on the port.

`@cratylus/canon` rewords the one codex reference left in the stance-judge worker's comment; the regenerated `stance-judge.sh` differs in that comment alone.
