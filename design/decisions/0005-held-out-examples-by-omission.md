# 0005 · Held-out examples by omission

Status: accepted · 2026-10-09

## Context

Builders that see every example can satisfy the visible proxy while missing the concept. Telling a builder not
to look for held-out examples announces that they exist, and a mechanism that prevents reading them guards
against a misbehaviour that does not occur: builders in practice stay within their work package. Kept outside
the repository, held-out examples would be unversioned, tied to one machine, and invisible to continuous
integration.

## Decision

Held-out examples are withheld **by omission**: kept in the repository with the rest of the conceptual design
(`design/judgment/`), outside every work package, and never named in any brief, role or example a builder is
given. Only judgment is pointed at them. No mechanism prevents reading them and no instruction forbids it,
because a prohibition would announce them. When one fails, builders learn the concept and the shortfall, never
the case; a case revealed to fix it becomes visible and is replaced.

## Consequences

Builder briefs and work packages never reference `design/judgment/`; that is the only discipline required.
