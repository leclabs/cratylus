# Capabilities explain themselves

The runtime explains its own interface: `cratylus <capability> --explain` gives the whole capability and `cratylus <capability> <verb> --explain` one verb, as data: name, purpose, when to reach for it, and what the verb does to what it reads. The command's help is drawn from the same declarations. A capability's self-description is a few lines per verb. A verb takes no arguments; any token after it but `--help`, `-h` or `--explain` is refused.

The cratylus omp extension registers each capability as one tool, named from its explained name and taking the verb, composing the runtime's explanation into omp's tool contract without adding to it, and calls the runtime for every act. Every capability tool only reads, and is declared at omp's read tier.
