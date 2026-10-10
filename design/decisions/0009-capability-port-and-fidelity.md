# 0009 · Capability port and fidelity

Status: accepted · 2026-10-09

## Context

Skills that re-implement capabilities in prose are unreliable, and per-harness re-implementations multiply work.

## Decision

Each capability has one implementation in cratylus, in the runtime, reached through the cratylus command line. A harness reaches it through a thin adapter that adds no behavior, at the highest fidelity the harness offers: its native facility, then a cratylus extension, then prose only as a last resort. On omp, that is an extension tool over the command. A skill says only when to reach for a capability.

## Consequences

Recorded in `design/delivery.md` as `capability port` and `capability fidelity`.
