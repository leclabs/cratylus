# 0017 · Prefer established libraries

Status: accepted · 2026-10-09

## Context

Agents reason better about a small, familiar API than about bespoke machinery or a workflow engine.

## Decision

Where a well-known problem has an actively maintained, widely used library with a small API, use it, wrapped behind cratylus's own capability. Never adopt a workflow or orchestration engine.

## Consequences

Recorded in `AGENTS.md`. Example: @dagrejs/graphlib for the dependency graph.
