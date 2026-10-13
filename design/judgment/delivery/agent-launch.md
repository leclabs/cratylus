# Held-out · agent launch

Used only in judgment.

1. (agent launch) **Given** a session started as an agent, **when** it is compacted, **then** its system prompt
   still carries the declaration's body afterwards, and the status line still shows the agent.
2. (agent launch) **Given** a declaration that is changed after a session was started as it, **when** the next
   session is started as it, **then** that session carries the changed body.
3. (agent launch) **Given** a declaration in a project's own agent directory, **when** omp is started in that
   project with `--agent` naming it, **then** the session is started as that project's agent.
