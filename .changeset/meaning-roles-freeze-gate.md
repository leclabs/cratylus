---
'@cratylus/forge': minor
'cratylus': minor
---

The omp extension names the acting agent on every capability call, in `CRATYLUS_AGENT`: the declaration a main session was launched as, the agent a dispatched session runs as, and no one otherwise. It drops any value the environment carries in, so no shell command inherits one. A capability's refusal is now returned as a tool error (`isError: true`) carrying the command's own message, never thrown.

The extension gates what is frozen, in every session, before a call takes effect. A `write`, `edit` or `ast_edit` of a path a frozen cut freezes (its examples, judgment and judgment folder, and its frozen checks, as `cratylus workPackage frozen` answers) is refused, naming the cut and its architect, unless the acting agent is that cut's architect. A `bash` or `eval` call that names a frozen path, or names `CRATYLUS_AGENT`, is refused the same way. Outside a repository nothing is frozen. When what is frozen cannot be read, the call goes through and the session is warned.
