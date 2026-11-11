# A protected path is guarded in the extension

A path an action scope reserves, such as `design/model/` for `write-domain-model`, is protected: the canon declares it on each agent holding that action scope, and cratylus's omp extension refuses, through a `tool_call` handler, a write to it by any other agent's session. omp's agent `tools` grants whole tools, and `tools.restrictedFolders` gates reads and refuses in headless subagents, so neither carries it.

A subagent session is guarded unless its agent writes the path, omp's own agents included; a main session is guarded only when launched as an agent of cratylus that does not write it, so the product owner's own session is not. The file tools that write, edit or delete are judged by the paths they resolve; a shell or eval call is judged by the text of its input and refused whether it reads or writes, so a path built at run time passes, and reads go through the read, grep and glob tools, which are never refused.
