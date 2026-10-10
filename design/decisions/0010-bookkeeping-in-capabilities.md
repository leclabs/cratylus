# 0010 · Bookkeeping in capabilities

Status: accepted · 2026-10-09

## Context

Agents counting re-runs, dispatching an empty plan, ordering levels by hand, or noticing that a round made no progress did so unreliably; code does it trivially.

## Decision

Sequencing and bookkeeping live in capabilities; agents keep the judgment. Work packages form a dependency graph whose topological levels are computed, never declared, using @dagrejs/graphlib behind the work package capability. The lead judges how to slice the work and what is a meaning question.

## Consequences

The execution bookkeeping cut (decision 0015) completes this.
