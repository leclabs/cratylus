# Examples · agent launch

Context: delivery. Concept: agent launch. Decision in force: 0047 (agent launch: omp --agent through the
cratylus extension). Confirmed by the meaning-holder on 2026-10-10, by direction: any agent declaration, its
name and mark on the status line.

**Structural** examples install, start or dispatch, and assert on what the session holds, deterministically.

## Structural

1. (agent launch) **Given** cratylus installed for omp and an agent declaration omp discovers, with a
   description, a model with an effort, and a body, **when** omp is started with `--agent` naming it, **then**
   the main session's system prompt carries the declaration's body, its front matter is either absent or
   rendered as prose (never as raw front matter), and the session runs on the declaration's model and effort.
2. (agent launch) **Given** the same declaration, **when** one session is started as it and it is dispatched
   from another session, **then** both carry the same body, model and effort, from the one declaration.
3. (agent launch) **Given** a session started as an agent whose declaration lists tools for dispatch, **when**
   the operator starts it with a tool selection of their own, **then** the session has the operator's
   selection; the declaration's list neither widens nor narrows a main session.
4. (agent launch) **Given** a declaration with a name and a mark, **when** a session is started as it, **then**
   omp's status line shows that name and mark; and given a declaration with no mark, the status line shows its
   name.
5. (agent launch) **Given** cratylus installed, **when** omp is started with `--agent` naming a declaration omp
   does not discover, **then** startup reports the name as unknown and no session starts; and **when** omp is
   started without `--agent`, **then** the session is plain: nothing of any declaration in its system prompt,
   no agent on its status line.
6. (agent launch) **Given** cratylus installed, **when** a session is started as an agent, **then** it is started
   by omp itself through the one cratylus extension, and nothing outside what install placed (no launcher,
   wrapper, second extension or copy of a declaration) takes part.
