# agent-anatomy

> A corpus of composable semantic fragments, each routed to the exemplar it projects from.

**What this is.** `agent-anatomy` is an exemplar corpus (`agent-anatomy ≜ the exemplar corpus`); its cells are the canonical, productive forms from which every particular artifact projects (`ideas/ ≜ the exemplars`). The frame is stated in [`AGENTS.md`](AGENTS.md) and [`ideas/AGENTS.md`](ideas/AGENTS.md); the concept in [`CONCEPT.md`](CONCEPT.md).

**How it works.** Raw information is run through [[exemplar-resolution]]: decomposed into fragments, each routed to the anchor whose latent priors most precisely circumscribe the exemplar it projects from (or, one scope-binding down, a scope-bound particular), composed by reference, residue pruned — and verified by round-trip. The result is a corpus organized by anchor: the best prior-resolved reconstruction of the source.

## The commons and its species

`agent-anatomy` is also a **shareable commons** ([[commons-distribution]]) for standing up agents. Eleven archetypes live here as `kind: agent` cells — the reducer [[bona]] and the engineer [[mav]], plus a builder team ([[principal-ic]], [[developer]], [[planner]], [[tester]], [[investigator]], [[principal-engineer-reviewer]], [[boswell]], [[cognizant]], [[arch-doc-writer]]). Each is an **archetype** — an agent's substantial form ([[substance-over-accident]]); a project-scope **species** is stood up by [[archetype-instantiation]] from that archetype plus scope grants ([[scope-grant]]). The aim: an agent inherits _how to do things right_ from strong anchors that load its priors, instead of a human over-explaining per project.

**agent-forge** makes it runnable: each archetype is a typed TS module (`src/agents/<name>.ts`) composed by ESM `import` + object-spread over the anatomy types (`@leclabs/agent-forge/anatomy`); the agent-forge claude adapter projects it to a deployable agent def carrying its provenance (under a content-hash drift guard), and `agent-forge deploy` ships it (`pnpm anatomy:project` / `pnpm anatomy:deploy`). markdown is the projection, the `.ts` modules are the source.

## The foundations

Three cells generate the rest; everything else is a consequence of running the method against new input.

- [[precise-circumscription]] — the routing/compression criterion: best fit = the anchor of minimal symmetric difference with the exemplar's true extension; scale-invariant — one operation at every grain, token to corpus.
- [[projection-is-not-the-source]] — every typology (a four-modality grid included) is a lossy index, never the generator; structure is by anchor only.
- [[self-application-is-mandatory]] — the keystone: `agent-anatomy` is built and judged by running its method on itself; round-trip equivalent-or-better; no anchor grandfathered.

## Structure

Organized **by anchor, and nothing else.** `ideas/<slug>.md` — one exemplar per cell, flat namespace, globally-unique slugs; the slug _is_ the anchor and the `[[ ]]` graph _is_ the structure. Front-matter is minimal — `kind` (the ontological primitive that governs composition; closed set in `ideas/AGENTS.md`) and `delineation` (the Socratic bound); operator-facing glosses carry `gloss: true` instead. `kind` governs composition, never directory structure — no stored altitude, no projection promoted to a directory.

_This README is the human projection of the cells above — it composes them, it does not copy them._
