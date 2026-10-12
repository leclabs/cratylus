---
'@cratylus/forge': minor
'cratylus': minor
---

The omp extension names the acting agent on every capability call, in `CRATYLUS_AGENT`: the declaration a main session was launched as, the agent a dispatched session runs as, and no one otherwise. It drops any value the environment carries in. A capability's refusal is now returned as a tool error (`isError: true`) carrying the command's own message, never thrown.

Every `bash` call of a session launched as an agent, main or dispatched, runs with that agent named in `CRATYLUS_AGENT`, through the call's own `env`, so a commit or journal append made from the architect's session carries the architect and a lead's carries the lead. A session that is no agent names no one.

The freeze holds at the record (decisions 0128, 0129): the journal refuses before appending, and the project's history at its `reference-transaction` hook, `cratylus freeze-gate`. The extension no longer refuses any tool call for the files it would change, by any route; its attempt-time freeze gate, including its refusal of shell calls naming `CRATYLUS_AGENT`, is removed. A builder's dispatch is refused while a visible example its work package owns is among the cut's `unchecked` in `cratylus workPackage frozen`, naming the package and those examples.
