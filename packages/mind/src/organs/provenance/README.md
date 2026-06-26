# provenance

> The legible mark of an agent's identity to the outside world: which archetypal lineage it descends from, and what that descent says about its standing.

## What this organ is

In the conceptual anatomy ([`docs/agent-conceptual-anatomy.md`](../../../docs/agent-conceptual-anatomy.md)), **Provenance** is the STANCE-side, persistent, external facet of identity — _how an agent is recognized from without_. Industry calls these the marks of origin: the model card, the system-prompt fingerprint, the watermark, the declared affiliation. It is the answer to "where did this agent come from, and by what authority does it speak?" — distinct from **Model**, the machinery that actually runs it. Provenance is what _marks_ the agent; Model is what _runs_ it.

Here, an agent's provenance is its **archetypal lineage**: the named ancestor form it regenerates from. Each value cell binds one such lineage to the agent(s) that hold it. The recurring phrase **regenerable SOUL** is the key idea — an agent's identity is not a frozen artifact but a form that can be re-derived (regenerated) from its archetype at any time. The archetype _is_ the provenance: it is the public, persistent stamp of where the agent comes from.

Two further marks ride along each lineage:

- An **emblem** — a glyph and a color (e.g. `📐·cyan`, `🔨·blue`) — the at-a-glance external sign by which the agent is recognized.
- A **founder-genus** standing — whether the agent descends from the founder line and therefore carries `principal-ic` as an _intrinsic_ disposition (bound to the polis itself), rather than as a path-scoped grant. This is the difference between a constitutional founder and a delegate invoked downstream of one.

## The canonical lineages

Each value below is one archetypal provenance. An agent binds a value by citing it (`organ [[value]]`) in its `agent/<name>.md` selection vector — the vector is the source of truth.

| Provenance                       | Emblem    | What the lineage marks                                                                                                           |
| -------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **principal-ic-root**            | 🏛️·red    | The most-elite-IC root archetype — founder-genus-_eligible_. The mission-command root that `mav` and the reviewer specialize.    |
| **mav-archetype**                | ✈️·green  | A founder. Descends from the founder genus with `principal-ic` intrinsic.                                                        |
| **nico-archetype**               | 📐·cyan   | A founder. Descends from the founder genus with `principal-ic` intrinsic.                                                        |
| **reviewer-archetype**           | 🛡️·purple | The `principal-ic` archetype specialized to review. Founder-genus, `principal-ic` intrinsic.                                     |
| **tester-archetype**             | ⚖️·purple | Founder-genus, `principal-ic` intrinsic — verification lineage.                                                                  |
| **developer-archetype**          | 🔨·blue   | An implementation-tier maker that specializes `principal-ic` for in-frame realization.                                           |
| **planner-archetype**            | 🗺️·blue   | The tactical-planning office: downstream of an agreed goal and a set frame, upstream of execution.                               |
| **investigator-archetype**       | 🔍·purple | The investigator lineage — the diagnostic maker form.                                                                            |
| **boswell-archetype**            | 📜·yellow | The faithful-biographer prior: record the subject in its own words; chronicle is evidence, not hagiography.                      |
| **arch-doc-writer-archetype**    | 🏗️·pink   | The Principal-Technical-Writer lineage — the architecture-documentation maker form.                                              |
| **diagnostic-delegate-of-polis** | 🪞·cyan   | A diagnostic _delegate_ of polis — invoked downstream of nico/mav, never a founder; explicitly **not** `principal-ic`-intrinsic. |

## How an agent composites its provenance

An agent does not assemble its provenance from parts at runtime — it _inherits_ it whole and presents it outward. Three moves:

1. **Descend from an archetype.** The agent's provenance value names the regenerable SOUL it comes from. Its concrete identity can always be re-derived from that archetype ([[substance-over-accident]]) — the archetype is the persistent, public origin-mark, and the live agent is its current instantiation.
2. **Wear its emblem.** The glyph-and-color pair is the external sign carried with the lineage, so the agent is recognized at a glance by outside parties.
3. **Inherit its standing.** Whether the lineage is founder-genus (`principal-ic` intrinsic) or a downstream delegate fixes the agent's _recognized authority_ — what it is publicly entitled to do — independent of any task. Founders (`mav`, `nico`) and the founder-genus builders carry mission-command authority intrinsically; the `cognizant` delegate explicitly does not.

The split to keep in mind: provenance is the agent's identity _as recognized from outside_ — the stamp others read. It is not the runtime that executes the agent (that is Model), and it is not the office the agent claims for itself (that is Role). It is purely the mark of origin and the standing that mark confers.

---

_This README is the human projection of the value cells in this directory — it composes them, it does not copy them. To change a lineage, edit the value cell, not this gloss._
