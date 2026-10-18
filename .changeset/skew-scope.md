---
"cratylus": minor
"@cratylus/runtime": minor
"@cratylus/forge": minor
---

Version skew names the installation in use. The warning at every omp session start says whether the skewed installation is the user's or a project's, and its root, with the remedy for that scope: `cratylus install --harness omp` for the user's, `cratylus install --harness omp --scope project`, run in that project, for a project's. `versionSkew report` and the `version_skew` tool report `scope` beside the root. The scope is read from the installation's `installation.json`; a record without one is a user installation. Run inside a project with a project installation, the operator's own `cratylus` reads that installation, as omp does; `$CRATYLUS_INSTALLATION` still wins, and a `.cratylus/` tree without an installation record is never one.
