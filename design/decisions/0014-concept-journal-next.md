# 0014 · Concept journal next

Status: accepted · 2026-10-09

## Context

After a compaction, an agent could not reconstitute the conceptual design: the design files hold current state without reasons, approved decisions existed only in the conversation, rulings to the lead were never recorded, and several overlapping documents disagreed.

## Decision

Reconstitution is a query, not a recollection. The conceptual design and its decisions are kept as an event-sourced, append-only **concept journal** per bounded context: concept versions (define, supersede, retire, each with a reason) and decisions, with computed views of the current design per context, each concept's history, and open decisions. Agents reach it as `cratylus concepts`, and amend it by appending through named commands. It is the next cut, ahead of finishing cut 2. The old record store in the runtime is assayed for adoption; reading `main`'s legacy records is cut off.

## Consequences

`design/workflow.md`, `design/delivery.md` and these decision records are imported into the journal, with each concept's past versions and commit reasons. A session begins by querying the journal and reading it back.
