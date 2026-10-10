# 0007 · Judgment standard

Status: accepted · 2026-10-09

## Context

Asking whether a behavioral check "could pass while its example is false" has no fixed point for evals of a language model: some contrived way around it always exists.

## Decision

A check is adequate when it rejects the plausible failure modes its example and its negative recordings name. A contrived way around it is a hardening note, never a finding against the work.

## Consequences

Recorded in `judgment`.
