---
"@cratylus/canon": minor
"@cratylus/runtime": minor
"@cratylus/forge": minor
"cratylus": minor
---

The documents describe intent-based delegation. The repository's working conventions (`AGENTS.md`, the `repo-preamble` rule) follow Git flow's `dev`/`main` split, without release or hotfix branches: each change is made on a short-lived branch from `dev` and merged locally into `dev` once `pnpm check` passes on the merged result, and release, a pull request from `dev` into `main`, is the operator's. The runtime's README names its two capabilities, `concepts` and `versionSkew`; forge's README tells the omp extension's handover forms, warned when incomplete and never refused; the `cratylus` README's practice example is `intent-based-delegation`.
