# Agent launch through the cratylus extension

The cratylus omp extension registers `omp --agent <name>`. It resolves the name through omp's own agent discovery, the same declarations dispatch uses; appends the declaration to the session's system prompt, its front matter removed or rendered as prose and its body kept; applies the declaration's model and effort; and shows the agent's name and mark on the status line. An unknown name stops startup with an error. No launcher exists outside the harness.
