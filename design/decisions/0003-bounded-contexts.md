# 0003 · Bounded contexts

Status: accepted · 2026-10-09

## Context

One design spanning several subjects let words drift between meanings. A consumer such as cinematiclab has its own subjects (a platform, and each film's production), and one architect may need to hold several of them.

## Decision

Every concept belongs to exactly one bounded context. Cratylus's own contexts are workflow, delivery and corpus. A cut lies within one context; intent spanning contexts becomes one cut per context, joined by contract examples the consuming context writes. One architect may hold several contexts, but never merges their models. The workflow is context-agnostic: consumers bring their own contexts.

## Consequences

Recorded as `bounded context`, `context map`, `contract` and `cut` in `design/workflow.md`.
