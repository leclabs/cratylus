# Effectors

**Organ:** Effectors (APPARATUS — _persistent · external_).

Effectors are an agent's **hands** — the standing set of actuators it can invoke to change (or
observe) the world: read a source, call a tool, run code, edit a file, drive a GUI, dispatch a
subagent, send a message, command hardware. Where _sensors_ are the channels by which the world
enters an agent (its eyes), effectors are what it reaches out and does. They are _persistent_ (an
agent carries them across every turn, not just one) and _external_ (they act on the world outside
the agent, not on its own reasoning). This is the apparatus side of competence: where _competence_
is the know-how an agent carries, effectors are the concrete instruments through which that know-how
lands as action.

Each cell in this directory is one canonical effector — a named primitive of the **action
repertoire**, carved by the _kind of actuation_ it performs. The set is deliberately narrow and
disjoint so that what each role can and cannot do is legible from its hands alone: not holding an
effector is a real boundary.

## The canonical values

- **`retrieval`** — read-only information access: search/query/fetch over data sources (web, DB,
  vector index, docs, APIs) that observes without mutating external state.
- **`tool-call`** — structured invocation of an external API/function with arguments and typed
  return — the general mutating-or-querying capability call (REST, MCP tool, function), excluding
  the specialized effectors below.
- **`code-execution`** — run arbitrary code in an interpreter/sandbox (Python, shell, SQL) to
  compute, transform data, or script ad-hoc logic, returning stdout/values.
- **`file-ops`** — create/read/edit/move/delete files and manage a workspace or repository tree;
  persistent artifact mutation on a filesystem or VCS.
- **`computer-use`** — drive a GUI via screen pixels and synthetic input (click, type, scroll) to
  operate apps and sites that expose no API.
- **`delegation`** — dispatch sub-agents to do scoped work and integrate their returns; the agent
  acts through other agents it spawns and supervises.
- **`communication`** — send outbound messages to humans or systems (email, chat, notifications,
  tickets, posts), affecting the world via signaling rather than state mutation.
- **`physical-actuation`** — command physical-world actuators (robots, vehicles, IoT/embodied
  hardware), producing irreversible real-world motion or change.

## How an agent composites its effectors

Unlike organs that grant one value per agent, effectors are held as a **set**. An agent binds a
value by citing `effector [[value]]` in its `agent/<name>.md` selection vector — the vector is the
single source of truth. The narrowness is the point: an agent's reach is exactly the union of the
effectors it holds, and the boundaries between roles are drawn by which hands they were _not_ given.
