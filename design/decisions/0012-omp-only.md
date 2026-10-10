# 0012 · Omp only

Status: accepted · 2026-10-09

## Context

Supporting several harnesses split attention before the substrate worked.

## Decision

omp is the only supported harness. The Claude Code adapter and its tests are deleted; forge's adapter seam stays, with omp as its one implementation. Parity is a later decision.

## Consequences

Capability port (decision 0009) keeps future parity cheap.
