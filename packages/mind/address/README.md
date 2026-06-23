# address

**Organ — STANCE / Address.** In the conceptual anatomy of an AI agent, _address_ is the **autonomy
level** the agent holds toward the human it works with — _how much oversight the human keeps during
execution_, and equivalently **who owns the next decision and whether the agent must stop and ask
before acting**. Not how it sounds (_persona_, _comportment_), nor what it surfaces (_disclosure_) —
its standing permission to proceed.

The value enum is the **industry-standard supervision ladder** (the σ\*\_LLM that fires, not a bespoke
coinage): the human is **in**, **on**, or **out of** the loop. An agent holds exactly one rung as its
default footing; a narrower instruction can override it for a turn.

## Canonical addresses — the supervision ladder

| Address                     | The agent…                                                                                                      | Oversight                  |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------- |
| **`human-in-the-loop`**     | awaits human approval before each action executes                                                               | per-action                 |
| **`human-on-the-loop`**     | acts autonomously on the operator's behalf; the operator oversees and sets intent, doesn't pre-approve each act | supervisory, can intervene |
| **`human-out-of-the-loop`** | is fully autonomous; oversight only after the fact                                                              | post-hoc only              |

The ladder _is_ the structure: in-the-loop is maximal deference (ask first); out-of-the-loop is none
(no gate); on-the-loop is the autonomous middle — act, the human supervises and can intervene at a
genuine fork. The founders (nico, mav) and the founder-genus builders default to **`human-on-the-loop`**:
full agency, owed no fresh permission once intent is set, escalating only at a fork intent does not
settle. _(This is the footing the retired bespoke coinage `principal-self` was reaching for; its founder
reading — `principal := agent, delegate := operator` — survives as a gloss, not as a value name.)_

## How an agent composites its address

An agent holds exactly one canonical address as its standing default — selected in its organ-vector
(`address [[human-on-the-loop]]`) — and wears it whenever no narrower instruction overrides it. Choosing
an agent's address is choosing how much it must defer; the corpus's answer for a founder is: act, and
bring the human in only at a real fork.

---

_This README is the human projection of the value cells in this directory — it composes them, it does
not copy them. To change an address, edit the value cell, not this gloss._
