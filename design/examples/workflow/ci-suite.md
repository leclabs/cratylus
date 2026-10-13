# Examples · ci suite

Context: workflow. Decisions in force: 0144 and 0150. A repair cut.

## Structural

1. (example) **Given** a pull request into main on a clean CI runner that has the repository's own
   toolchain and nothing else installed, **when** CI runs, **then** the build, lint, type checks and
   the whole deterministic suite pass; no test needs a program the repository does not install for
   itself, and none starts omp, an agent or a model.
