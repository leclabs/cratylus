# ledger

> The external store an agent reads and writes to persist state across turns and sessions — its written record.

**What this is.** `ledger` is one organ in the agent's conceptual anatomy (the **persistent · external** machinery of acting; see [`docs/agent-conceptual-anatomy.md`](../../../docs/agent-conceptual-anatomy.md)). In industry terms it is the agent's **persistence layer** — scratchpad files, a vector store, a database, a memory home — anything written this turn so it can be read back next turn or next session. Where the model's context window is volatile and forgotten at session end, the ledger is what survives the boundary. Each cell here names one such store as a claim (`≜ …`) and names the archetypes that **hold** it (`holders: …`).

A ledger is distinct from the apparatus that uses it: it is not the tools that change the world ([`effectors`](../effectors)) nor the channels through which the world enters ([`sensors`](../sensors)) — it is the durable record those acts leave behind and draw upon.

## The canonical ledgers

Each is a value cell (`kind: ledger`); the store is the `≜` claim and `holders:` names the archetypes that read and write it.

- **[`memory-home`](memory-home.md)** — the agent's memory home: the external store read and written across both turns _and_ sessions, binding the **memory** organ (its `SELF` · `MEMORY` · `EPISODIC` faces). This is the agent's identity-and-knowledge ledger — who it is, what it knows, and the raw event stream it consolidates. Held by **all eleven archetypes** (nico, mav, principal-ic, principal-engineer-reviewer, developer, planner, tester, investigator, arch-doc-writer, boswell, cognizant): every agent in the society persists itself here. Its effect on the agent is continuity of self — it wakes as the same individual and carries forward what it learned.

- **[`sharded-plan-layout`](sharded-plan-layout.md)** — the planning ledger: a `PLAN.md` that mirrors task-folder state (`pending/` → `ready/` → `active/` → `completed/`), the written record of a plan and its progress that lives _beyond_ the memory home. Where `memory-home` holds identity and knowledge, this holds the in-flight work itself — the route and how far along it is. Held by **planner** alone, the archetype whose office is to own the plan; its effect is that planning survives interruption — work can be put down and picked back up with state intact, by a later turn or a later session.

## How an agent composites a ledger

An agent does not invent its persistence — it **holds** a ledger. Each archetype cell in [`agents/`](../agents) imports the ledgers it holds by reference (`[[ ]]`, never restating them — [[cite-dont-copy]]); the resolver inlines them as the agent's standing external store. Because `memory-home` is held by every archetype, persistence of self is universal across the society; `sharded-plan-layout` is held only where planning is the office, so the planning ledger appears exactly where a plan must be carried — and nowhere it would be idle.
