# 0016 · Project conventions outside the workflow

Status: accepted · 2026-10-09

## Context

Where a cut's branch starts from and returns to is a project's branching convention, not a concept of the workflow cratylus ships.

## Decision

Branching and commit hygiene are project rules in `AGENTS.md`: GitHub flow is the baseline; commit only your own paths, by name, and never amend or rewrite shared history. For this effort, a temporary `dev` integration branch sits ahead of `main`: when the work ends, `dev` merges to `main` and is deleted, or is archived if the work is abandoned.

## Consequences

Disjoint work packages may share a checkout; isolation is not prescribed, and a dispatcher applies an isolated task's result.
