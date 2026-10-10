# 0005 · Held out examples by location

Status: accepted · 2026-10-09

## Context

Builders that see every example can satisfy the visible proxy while missing the concept. Telling a builder not to look for held-out examples announces that they exist.

## Decision

Held-out examples are withheld by where they are kept: outside the repository (`~/.local/share/cratylus-judgment/`) and outside anything a builder is given. No brief mentions them. When one fails, builders learn the concept and the shortfall, never the case; a case revealed to fix it becomes visible and is replaced.

## Consequences

An in-process API is not asked to enforce withholding against code that holds the whole set.
