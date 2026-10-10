# 0004 · Work and work package

Status: accepted · 2026-10-09

## Context

"Artifact" carried three meanings: what a cut produces, the unit one builder owns, and what deploy projects (the corpus context's meaning). "Unit" partitioned work by concept, so several units shared one file and collided.

## Decision

In the workflow context, **work** is what a cut produces, and a **work package** is the smallest part of a cut's work given to one builder: a set of output files no other builder changes, a vertical slice where possible, with a shared output as its own work package. Always "work package", never bare "package", which in this repository means a pnpm package. "Artifact" keeps only its corpus-context meaning.

## Consequences

Illustration now flags every term in a gloss that is neither a concept nor plain industry usage.
