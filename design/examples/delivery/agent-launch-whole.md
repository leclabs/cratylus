# Examples · agent launch, the whole declaration

Context: delivery. Concept: agent launch ("with the identity it has when dispatched"). Decisions in force: 0047, 0037. Confirmed by the architect on 2026-10-10, under the operator's direction to close the gaps. All
structural: start a session, inspect what it holds.

1. (agent launch) **Given** a declaration that asks for two skills to be loaded at start, **when** a session is
   started as it, **then** both skills are already loaded, their instructions present, not merely available.
2. (agent launch) **Given** a declaration that permits dispatching two named agents and not a third, and an
   operator who grants dispatch, **when** a session is started as it, **then** it can dispatch the two and not
   the third.
3. (agent launch) **Given** a declaration that enables summarised file reads, **when** a session is started as
   it, **then** summarised reads are on; and with the declaration changed to disable them, the next session has
   them off.
4. (agent launch) **Given** a declaration that sets an advisor and enables pre-planning, **when** a session is
   started as it, **then** it holds that advisor and pre-planning; and with the declaration changed to disable
   both, the next session has neither.
5. (agent launch) **Given** a declaration with its own text, **when** a session is started as it, **then** its
   instructions carry the declaration's text and not the harness's default personality.
6. (agent launch) **Given** a declaration that sets a model, an effort and dispatch targets, **when** the
   operator starts a session as it with their own model, effort and tools but no dispatch tool, **then** the
   session holds the operator's model, effort and tools, cannot dispatch, and keeps the declaration's name,
   mark, text and other settings.
7. (agent launch) **Given** a discoverable declaration, **when** a session is started without naming an agent,
   **then** its instructions, identity, skills, model, effort, tools, dispatch, read-summary, advisor,
   pre-planning and personality match a plain session's.
8. (agent launch) **Given** one declaration and the same tool grant, **when** a session is started as it and it
   is also dispatched, **then** both hold the same text, model, effort, loaded skills, dispatch targets,
   read-summary, advisor and pre-planning, and neither carries the harness's default personality.
