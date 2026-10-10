# 0008 · Roles by permission not prose

Status: accepted · 2026-10-09

## Context

Prose rules in role definitions made agents literal and made evals measure obedience to that prose; role text that restated the examples primed the evals.

## Decision

What a role can see, reach and change is enforced by the harness's own permissions and by the freeze. What a role decides is checked by behavioral examples. A role's text holds the concepts it carries, in the design's own words, never a scenario's procedure: no example may be readable off a role definition.

## Consequences

Recorded in `roles`. Example: the reviewer has only read tools in omp.
