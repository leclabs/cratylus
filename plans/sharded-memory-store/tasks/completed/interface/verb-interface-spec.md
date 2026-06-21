# verb-interface-spec

**Objective.** Specify the stable memory **verb interface** — `encode · recall · consolidate ·
graduate · forget` — as the ports-and-adapters seam (ADR 0001 D3) that the agent, the constitution,
and every future backend speak through. This is the spine; every other phase hangs off it.

**Preconditions.** ADR `decisions/0001-memory-store-architecture.md` accepted. Current surface:
the `episodic` CLI (`encode`/`read`/`migrate`) + the `memory` cell Protocol.

**Operations.**

1. Define each verb: signature, inputs/outputs, side-effect contract, error modes. Map today's
   `encode`/`read`/`migrate` onto it; name the gaps (`recall`, `consolidate`, `graduate`, `forget`).
2. Fix the interface boundary: the CLI/shell is the **transport** (ADR D4); the verbs are pure
   library functions (no storage assumptions leak through the verb signatures).
3. State how MCP (ADR D5) would later wrap the _same_ verbs — proving the seam holds.
4. Record as `decisions/0002-verb-interface.md`.

**Artifacts.** `plans/sharded-memory-store/decisions/0002-verb-interface.md`.

**Acceptance (blind test).** From the spec alone, a fresh engineer can implement a stub backend
satisfying all five verbs, and can point to where a future SQLite-index or MCP-server adapter plugs
in without changing a verb signature.
