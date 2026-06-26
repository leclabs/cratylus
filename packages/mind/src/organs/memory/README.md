# memory

> The external store an agent reads and writes to persist state across turns and sessions — its written record.

**What this is.** `memory` is one organ in the agent's conceptual anatomy (the **persistent · external** machinery of acting; see [`docs/agent-conceptual-anatomy.md`](../../../docs/agent-conceptual-anatomy.md)). In industry terms it is the agent's **persistence layer** — scratchpad files, a vector store, a database, a memory home — anything written this turn so it can be read back next turn or next session. Where the model's context window is volatile and forgotten at session end, the memory is what survives the boundary.

A memory is distinct from the apparatus that uses it: it is not the tools that change the world ([`actions`](../actions)) nor the channels through which the world enters ([`modalities`](../modalities)) — it is the durable record those acts leave behind and draw upon.

## The canonical ledgers

Each is a value cell (`kind: memory`); the store is the `≜` claim. An agent binds a memory by citing it (`memory [[value]]`) in its `agent/<name>.md` selection vector — the vector is the source of truth for who reads and writes it.

- **[`memory-home`](memory-home.md)** — the agent's memory home: the external store read and written across both turns _and_ sessions, binding the **memory** organ (its `SELF` · `MEMORY` · `EPISODIC` faces). This is the agent's identity-and-knowledge memory — who it is, what it knows, and the raw event stream it consolidates. Held across the society — every agent persists itself here. Its effect on the agent is continuity of self — it wakes as the same individual and carries forward what it learned.

- **[`sharded-plan-layout`](sharded-plan-layout.md)** — the planning memory: a `PLAN.md` that mirrors task-folder state (`pending/` → `ready/` → `active/` → `completed/`), the written record of a plan and its progress that lives _beyond_ the memory home. Where `memory-home` holds identity and knowledge, this holds the in-flight work itself — the route and how far along it is. Held where planning is the office; its effect is that planning survives interruption — work can be put down and picked back up with state intact, by a later turn or a later session.

## How an agent composites a memory

An agent does not invent its persistence — it **holds** a memory. Each archetype cell in [`agents/`](../agents) imports the ledgers it holds by reference (`[[ ]]`, never restating them — [[cite-dont-copy]]); the resolver inlines them as the agent's standing external store. Because `memory-home` is held by every archetype, persistence of self is universal across the society; `sharded-plan-layout` is held only where planning is the office, so the planning memory appears exactly where a plan must be carried — and nowhere it would be idle.
