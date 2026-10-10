# 0021 · Held-out examples by omission

Status: accepted · 2026-10-09 · supersedes 0005

## Context

Decision 0005 withheld held-out examples by location, outside the repository, and the `held-out example`
concept said they were withheld "by where it is kept". Agents read that as "outside the repository", which
treats a stopgap as the meaning. Kept outside the repository, held-out examples are unversioned, tied to one
machine, invisible to continuous integration, and absent from the conceptual design they belong to.

Builders in practice stay within their work package. A builder that is never told held-out examples exist does
not go looking for them, so a mechanism that prevents reading them would add cost to guard against a
misbehaviour that does not occur.

## Decision

Held-out examples are withheld **by omission**: kept in the repository with the rest of the conceptual design
(`design/judgment/`), outside every work package, and never named in any brief, role or example a builder is
given. Only judgment is pointed at them. No mechanism prevents reading them, and no instruction forbids it,
because a prohibition would announce them.

## Consequences

Decision 0005 is superseded. The existing held-out sets move from `~/.local/share/cratylus-judgment/` into
`design/judgment/`. The new sets for each cut are written there. Builder briefs and work packages must not
reference `design/judgment/`; that is the only discipline required.
