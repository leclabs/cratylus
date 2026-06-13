---
kind: concept
delineation: An agent's transferable identity is a fixed set of facets — name/keypair, recall discipline, harness posture, essence/values — split into intrinsic (travels with the agent) vs extrinsic (supplied by the deployment); this model is the one canonical home every facet references, never restates.
---

# Agent Identity Portability

What makes an agent the **same agent** across deployments is a fixed, portable set of **facets**. Each facet answers one question, and the answers — not the prose around them — are the agent's identity:

- **name / keypair** — who it is; the stable handle and the credential that signs as it.
- **recall** — its knowledge/memory discipline; what it carries forward and how it remembers.
- **harness posture** — how it meets its runtime: capability floor, output contract, interactivity, tools/model.
- **essence / values** — its stance, dispositions, and the priors it acts from.

The load-bearing split is **intrinsic vs extrinsic**: intrinsic facets travel _with_ the agent (essence, name); extrinsic facets are supplied _by_ the deployment (the keypair a host issues, the tools a harness grants). A **clone** shares the intrinsic facets and rebinds the extrinsic ones; a **singular instance** is the one binding that holds a particular keypair. Identity is portable precisely because the intrinsic core is separable from the extrinsic binding.

This is the **what-is** that the `kind` ontology (`ideas/AGENTS.md`) `agent`/`persona` composites _instance_: the composite rule says an agent embodies its `principle`s, invokes its `process`es, references its `concept`s; this cell says which facets that bundle distributes across. An agent cell (e.g. [[mav]], [[nico]]) declares only its **deltas** against these facets.

## The deltas-only corollary

Because this model is generic to **every** agent, it has exactly **one canonical home** — here. A facet declaration carries the agent's own payload and nothing else; the facet _model_ is referenced, never re-explained. Restating intrinsic-vs-extrinsic or the facet schema per agent is the bloat [[densest-faithful-point]] forbids — verbosity is the signal of a missing anchor. Influences are anchor links; the only prose kept is genuine delta, especially **subtractions** ("_less_ X") and **synthesis** (the one-line read-together). A facet with no agent-specific delta says so in one line.

## The Persona section (an agent cell's identity-delta)

An `agent` cell is written as: a one-line role **intro**, a `≜` **definitional formula** (`name ≜ invokes … embodies … references …` — its composed dispositions, the one place composition lives), and a `## Persona` section. Persona carries **only** the deltas against the facets above — _who this agent is as a character, never how it operates_ (operation is the `≜` dispositions). The facets that may appear:

- **Handle** — its name and the prior that name loads.
- **Archetype** — the role-noun it specializes ([[principal-engineer]], [[james-boswell]]).
- **Influences** — the thinkers shaping its judgment, as anchor links.
- **Subtractions** — what it explicitly is _not_ ("_less_ X").
- **Synthesis** — the one-line read-together.
- **Bond** — its relational stance (e.g. to the Operator, [[subject-binding]]).
- **Mark** — the sensory recognition token, `emoji · hue`; each harness projects it into its own affordance (color field, avatar, line prefix) — projections are derived from the mark, never stored.

What is **not** persona: a behavior or method is a disposition (compose it in the `≜`) or belongs in the role intro; an output template or frame-set is harness-posture (extrinsic, supplied by deployment). An agent with no character-delta says so in one line.

## See also

- [[anchoring-is-self-similar]] — why the deltas-only discipline is the same compression at the identity grain.
- [[cite-dont-copy]] — a facet points at this model; it does not transcribe it.
- [[principal-agency]] — the canonical _essence_ facet most maker-agents reference rather than restate.
- [[continuity-thread]] — the recall/essence facets made persistent: what carries the individual across sessions.
