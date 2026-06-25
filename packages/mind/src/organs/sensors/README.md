# sensors

> The channels by which the world enters an agent: the percept-sources it reads — diffs, codebases, corpora, operator directives, tool results — each organ-holder's specialized eyes onto its domain.

## What this organ is

In the conceptual anatomy ([`docs/agent-conceptual-anatomy.md`](../../../docs/agent-conceptual-anatomy.md)), **Sensors** is the CONATUS-side, persistent, external facet of the agent's standing apparatus — _the channels by which the world enters_. Industry calls these the input/perception surface: tool results, retrieved documents, observations, user input taken up as percept. They are the agent's **eyes**.

The pairing to keep in mind is with **Effectors**, the agent's hands. Effectors _change_ the world; sensors _take it in_. A reviewer's effector emits a fenced review; its sensor is the diff under review. The two are mirror organs: most agents that act on a thing also sense that thing.

Here, each value cell binds one **percept-source** — a named bundle of what a given kind of agent senses — to the agent(s) that hold it. A sensor is deliberately scoped to its holder's work: the investigator senses defect reports and runtime logs; the technical writer senses ADRs and existing docs. The sensor is what _opens the cycle_ for that agent — the raw material its construal and deliberation work on.

## The canonical percept-sources

Each value below is one sensor. An agent binds a value by citing it (`organ [[value]]`) in its `agent/<name>.md` selection vector — the vector is the source of truth.

| Sensor                  | What enters through it                                                                                                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **operator-directive**  | Operator / interlocutor directives — _intent_ entering as percept. The most widely shared sensor: nearly every agent reads the operator's instruction as its opening input.                        |
| **tool-result**         | Tool / build / run / suite results — _the world's reply_ entering as percept. The other near-universal sensor: whatever an agent did, the toolchain's response comes back through here.            |
| **corpus**              | The exemplar-corpus & commit-history — the primary evidence sensed. The eye onto canonical culture and its record of change.                                                                       |
| **codebase**            | The codebase & running-system behavior — the primary object sensed for delivery and documentation.                                                                                                 |
| **system-structure**    | The artifact under construction & the existing system's structure — the maker's primary percept.                                                                                                   |
| **change-under-review** | The change under review (diff · code · plan · architecture), the reviewee's intent, and the CWE / OWASP / CAPEC frame-sets the review is read against.                                             |
| **change-under-test**   | The change-under-test, its diff & claimed behavior, suite output, oracle results, and the reference golden-master.                                                                                 |
| **plan-frame-feedback** | The decided plan, the architectural frame, the codebase, and reviewer / tester feedback plus test results — the full surround the implementer realizes against.                                    |
| **goal-frame-emergent** | The agreed goal, the set architectural frame, the file-tree under plan, and the results the work _uncovers_ — Mintzberg's emergent strategy: the plan stays responsive to what surfaces.           |
| **defect-and-source**   | The defect-report or surprise, the source under investigation, and runtime / log / test output — the diagnostic surround.                                                                          |
| **adrs-and-docs**       | ADRs & existing docs — the prior documentation record, sensed for drift against the system.                                                                                                        |
| **anatomy-ref**         | The agent-conceptual-anatomy reference (the MECE organ-set) — _the self-model entering as percept_. The reflexive sensor: an agent perceiving its own anatomy.                                     |
| **subagent-context**    | The subagent's inputs, system / developer instructions, tool-manifest, readable / writable state, and active constraints; introspection requests; and the canon to diff observed behavior against. |

## How an agent composites its sensors

An agent does not sense the whole world — it composites a **scoped bundle** of percept-sources fit to its work. Three moves:

1. **Hold the universal channels.** Almost every agent reads **operator-directive** (intent in) and **tool-result** (the world's reply in). These two open and close the typical cycle: the directive starts the turn, the tool result lands the consequence.
2. **Add a domain eye.** Each agent picks up the sensor for its primary object — the maker senses **system-structure**, the reviewer senses **change-under-review**, the investigator senses **defect-and-source**. This is the specialized perception that makes the agent's construal possible at all.
3. **Pair with effectors.** A sensor is the input-mirror of an effector: the tester senses **change-under-test** and effects oracle-verdicts; the writer senses **adrs-and-docs** and effects arch-docs. Sense the thing, then act on the thing.

The split to keep in mind: a sensor is purely the _intake_ channel — what enters and becomes percept. It is not the action that follows (that is an **Effector**), not the working interpretation formed from it (that is **Construal**), and not the store the agent reads to recover its own state (that is **Ledger**). Sensors are the eyes only.

---

_This README is the human projection of the value cells in this directory — it composes them, it does not copy them. To change a percept-source, edit the value cell, not this gloss._
