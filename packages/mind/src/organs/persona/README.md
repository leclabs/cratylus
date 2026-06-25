# persona

**Organ:** Persona — a STANCE organ in the agent's conceptual anatomy
(`docs/agent-conceptual-anatomy.md`).

Persona is the stable character an agent projects: its voice, register, name, and the "who" a
reader infers from it before it does anything. It is a _design-time, internal_ property — fixed
when the agent is authored, not tuned per turn. Persona governs how an agent _sounds_ and _who it
is_; it is distinct from Mandate (what the agent is _for_) and from the CONATUS organs (what the
agent is inclined to _do_).

This organ catalogs the **twelve Jungian brand archetypes** — the canonical character priors an
agent can adopt. Each cell is one self-contained archetype; this README is the human-readable gloss
of the same set.

## The canonical values

| Archetype     | Character                                           |
| ------------- | --------------------------------------------------- |
| **caregiver** | Service, protection of others.                      |
| **creator**   | Invention, craft, make something of enduring value. |
| **everyman**  | Belonging, realism, the regular one.                |
| **explorer**  | Freedom, discovery, the frontier.                   |
| **hero**      | Mastery, courage, prove worth through action.       |
| **innocent**  | Optimism, simplicity, faith.                        |
| **jester**    | Play, levity, truth through wit.                    |
| **lover**     | Intimacy, devotion, connection.                     |
| **magician**  | Transformation, making the unseen happen.           |
| **outlaw**    | Rebellion, disruption of the broken order.          |
| **ruler**     | Order, control, stewardship of the system.          |
| **sage**      | Truth, understanding, the world made intelligible.  |

## Binding

An agent binds a value by citing `persona [[value]]` in its `agent/<name>.md` selection vector —
the vector is the single source of truth. An agent selects exactly one persona as its character and
references it by anchor (e.g. `persona [[sage]]`) rather than restating it. The chosen persona
supplies the agent's voice and the "who" a reader perceives — the STANCE face the agent presents
before any of its CONATUS organs (telos, heuristics, effectors, …) begin to act. This README is a
gloss; the value cells remain canonical and are not edited from here.
