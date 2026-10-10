# 0006 · How checks are written

Status: accepted · 2026-10-09

## Context

In cut 2, checks were written alongside the roles they judge. Many could pass while their example was false, or rejected correct behavior; most of the cut's red rounds were check bugs found slowly and noisily by live model runs.

## Decision

A check is written before the build by someone other than the work's builders, and frozen only once it has been seen to fail against work that does not satisfy it. Behavioral checks are first proven offline: golden recordings that must pass, negative recordings that each break the example one specific way and must fail, and wiring assertions that every tool and peer the check reads is offered with a declared parameter schema; real conforming runs become golden recordings. A check binds the example's meaning, never wording the scenario did not fix; where a capability already defines correctness, the check delegates to it.

## Consequences

Recorded in `freeze`. Offline proof becomes part of the concept in a later small cut.
