# Capabilities explain themselves

The runtime explains its own interface: `cratylus <capability> --explain` gives the whole capability and `cratylus <capability> <verb> --explain` one verb, as data: name, purpose, when to reach for it, each parameter with its schema and description, and whether the verb only reads or appends. The command's help is drawn from the same declarations. A capability's self-description is a few lines per verb.

The cratylus omp extension registers each capability as one tool, named from its explained name, composing the runtime's explanation into omp's tool contract without adding to it, and calls the runtime for every act. Read-only verbs are declared read, appending verbs write.
