# 0020 · Efficiency

Status: accepted · 2026-10-09

## Context

This rework started from one observation: the workflow on `main` and both attempts to improve it were
grossly inefficient. They re-checked the same work over and over, never converged, and spent large amounts of
tokens while producing few work packages that realized the conceptual design. The rectified objective said the
method must be _effective_, _converge_, and be _proportionate_, but efficiency itself was nowhere in the
conceptual design, and no cut measured it. Cut 2 then repeated the pattern: twenty-two whole-check runs and
many rounds of re-dispatch before a green build, and a judgment that was still not accepted.

## Decision

Effective includes efficient. The root concept says so, and a new concept, **efficiency**, is the share of a
cut's effort (agent runs, tokens) that goes into work realizing its concepts. Every cut reports its efficiency
alongside its outcome: builder and assayer dispatches, rounds, whole-check runs, and live eval runs. A cut whose
numbers show it burning effort without converging is stopped and diagnosed, not pushed through more rounds.

The concepts that make the method efficient by construction are already in place or queued: checks proven
offline before the build (decision 0006), bookkeeping in capabilities (decision 0010), a non-bailing whole
check run once per round (decision 0011), proportionality, and the concept journal (decision 0014), so no
session spends effort reconstructing what the last one knew.

## Consequences

Cut 2's numbers are the baseline to beat. Each cut's report to the architect, and the architect's report to
the operator, states its efficiency figures. Recording them durably becomes part of the concept journal.
