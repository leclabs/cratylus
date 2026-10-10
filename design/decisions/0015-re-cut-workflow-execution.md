# 0015 · Re cut workflow execution

Status: accepted · 2026-10-09

## Context

Cut 2 (workflow execution) was green at whole-check run 22, but its re-judgment was not accepted. Held-out cases for no-progress diagnosis, an empty cut, and a partial re-run failed; these, and examples 6, 7 and 9, are bookkeeping that code does reliably and an agent does not.

## Decision

Examples 6, 7 and 9 and held-out cases 2, 5 and 7 move out of cut 2, to be re-illustrated as structural examples of the execution bookkeeping capability. Cut 2 keeps the structural examples 1 to 4 and the behavioral examples 5, 8, 10, 11 and 12. Its remaining round: a canonical example inventory the work package capability reads, a commit guard that knows which builder is committing, role text reduced to concepts, and example 8's check requiring exactly one confirmation; then one whole check and re-judgment under decision 0007.

## Consequences

Cut 2 is paused until the concept journal lands.
