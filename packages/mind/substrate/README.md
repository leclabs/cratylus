# substrate

**Organ:** Substrate (CONATUS — _persistent · external_) in the agent's conceptual anatomy
(`docs/agent-conceptual-anatomy.md`).

Substrate is the **inference engine and runtime that actually executes an agent** — the model
weights, the harness, and the loop. In industry terms it is the _body the agent runs on_: the LLM
plus its surrounding tool-execution harness. It is a _persistent, external_ organ — standing
machinery that exists outside the agent's reasoning, carried across turns rather than formed within
one.

The substrate is deliberately an **accident**, not the agent's substance ([[substance-over-accident]]).
Which model and harness run an agent can change — a swap to a newer model, a different harness — yet
the agent persists as the same individual across that swap, because its identity is anchored in its
archetype and its memory-stack, not in the body executing it. The substrate is _what runs_ the agent;
it is not _what the agent is_. (Compare the STANCE-side twin, _provenance_ — identity as recognized
from outside, what _marks_ the agent — versus substrate, identity as the machinery that _acts_.)

Each cell in this folder is one canonical substrate value. The cells are written in the corpus's
compressed notation (σ\*\_LLM); this README is the human-readable gloss of the same set.

## The canonical value

- **`llm-claude-codeaccident`** — the LLM together with the Claude Code harness, declared as an
  _accident_ rather than the agent's substance. This names the concrete body every agent in this
  society currently runs on: a large language model executed inside the Claude Code harness loop.
  **Effect on the agent:** it fixes the present runtime (model weights + harness + loop) while
  explicitly marking that runtime as swappable. Because the value is an accident, the agent survives
  a substrate swap — a new model or harness — and continues as the same individual, with continuity
  carried by the memory-stack rather than by the body. It is **held by all eleven agents** (nico, mav,
  principal-ic, principal-engineer-reviewer, developer, planner, tester, investigator, arch-doc-writer,
  boswell, cognizant): the whole society shares one substrate today.

## How an agent composites its substrate

An agent holds **exactly one** substrate value, named by its archetype. Today every one of the
eleven agents holds the same value, `llm-claude-codeaccident` — there is a single shared body for
the whole society. Because that value is declared an accident, holding it commits the agent to a
_current_ runtime without binding its identity to it: when the substrate is swapped, the agent reuses
its memory-stack and persists unchanged. The set is open — were a different runtime introduced, it
would be minted as a new substrate value and named by the archetypes that run on it.
