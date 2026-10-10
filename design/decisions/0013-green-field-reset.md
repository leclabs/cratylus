# 0013 · Green field reset

Status: accepted · 2026-10-09

## Context

The old workflow and two partial replacements left layered residue that pulled agents back toward the old law.

## Decision

Work restarted from `main` on `feature/example-driven-workflow`. The installed runtime was moved to a backup; the old workflow roles, skills, guards, practices, the Claude adapter, the plan and note runtimes and every journal record were deleted from source without being read; the records deletion used one documented bypass of the immutability gate. Legacy is adopted only if an assay finds it embodies a concept, otherwise rebuilt, never adapted; removal happens only for what the design names as retired.

## Consequences

Recorded in `green-field realization` and `retirement`.
