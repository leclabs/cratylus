# omp's system prompt is changed at run time, by removal

The persona opens the system prompt of a cratylus agent's session, launched with `omp --agent` or dispatched. The cratylus omp extension makes it in `before_agent_start`, on every turn, from the blocks omp built that turn: the agent's definition first, then omp's blocks without the passages cratylus judged contrary to the persona or bloat, every other section kept, a newer omp's included. A cratylus agent is a declaration whose file lies in the installation's `agents/` directory, by real path; omp's bundled declarations and a user's own are not, and a session of any other agent keeps omp's prompt whole.

Three standing choices:

- omp's prompt is changed by removal alone, at run time. Cratylus ships no copy of omp's prompt or template, adds no counter-instruction and restates nothing the persona carries.
- Cratylus changes no omp setting for it: todo, personality, memory and tools stay as omp configures them. The launch's own `personality: none` hold, which mirrors a dispatched child, is as before.
- Each removal applies only in its own block of the prompt (the template, the project-context footer, a dispatched child's per-spawn block), so a context file quoting a passage keeps it. What a section says of how a result is handed back stays.

The removals are judged against one omp release, named once in the extension. A removal whose passage the installed omp's prompt no longer holds is named in one warning at session start, and nothing fails: the session runs on what omp builds.
