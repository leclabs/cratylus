# 0011 · The whole check

Status: accepted · 2026-10-09

## Context

A fail-fast whole check (`build && typecheck && lint && test`) revealed only its first failing stage per run, turning "fix everything a run revealed" into one fix per run.

## Decision

The whole check runs every stage (build, typecheck, lint, tests, and the behavioral evals of affected roles) without stopping at the first failure, using turbo's `--continue=always`. Each failing run is followed by one round that fixes everything it revealed, then one more run. While iterating, run targeted checks. In CI, which has no model credential, the eval stage degrades and warns, naming the roles not evaluated; it never fails on the missing credential and never reports an unearned pass.

## Consequences

Recorded in `whole check`.
