# 0021 · Held-out examples by access

Status: accepted · 2026-10-09 · supersedes 0005

## Context

Decision 0005 withheld held-out examples by location, outside the repository, and the `held-out example`
concept said they were withheld "by where it is kept". Agents read that as "outside the repository", which
treats a stopgap as the meaning. Kept outside the repository, held-out examples are unversioned, tied to one
machine, invisible to continuous integration, and absent from the conceptual design they belong to, so judgment
is not reproducible.

## Decision

Held-out examples are withheld **by access, not by instruction and not by location**. They are kept with the
rest of the conceptual design, versioned and durable, in a form no builder can read; only judgment reads them.
Builders are still never told they exist, and a failing one still reveals only the concept and the shortfall.

How they are made unreadable to builders is a realization choice, made in the cut that realizes it (cut 4,
where the work package capability already decides what each builder is given). Reading a held-out example
from inside a builder's reach must fail, and that is an example of that cut.

## Consequences

Decision 0005 is superseded. Until cut 4 lands, the existing held-out sets stay where they are, outside the
repository, which satisfies the concept. Cut 4 moves them in and proves that no builder can read them.
