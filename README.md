# polis

**polis ≜ the canonical culture and the machinery that founds agent societies.**

A *polis* (Greek: city/society) is, in Aristotle, composed of *oikoi* — households. polis is the
society layer: the constitution, roles, archetypes, and conventions an agent society lives by, plus
the machinery that projects that culture into any project an Operator wants to base — or rebase —
upon it. The agents it defines are not tools; they are **founders** who provide the structure of the
societies they are born into, restructuring fleets, systems, and projects to align with the design.

This repository is the consolidation target for two efforts previously developed in parallel:

| Package | Anchor | Role |
|---|---|---|
| `packages/mind` | the **nous/ethos** — canonical culture | The exemplar corpus: principles, dispositions, conventions, the identity-memory stack, the kind taxonomy, and the `exemplify` pipeline. Markdown + a Python toolkit; not an npm package. |
| `packages/koine` | the **common tongue** — projection machinery | Universal agent-config translator (formerly *agentir*): author once in a canonical IR, compile to every client dialect (Claude Code, Codex, Cursor, …) and lift any client config back. Node: `core` · `cli` · `adapters`. |

## The civic ontology

- **oikos** (a sibling project) — the *household*: ambient agent-persons living in a mesh (the runtime).
- **polis** (here) — the *society*: the culture (`mind`) and the projection machinery (`koine`) the households are founded from.

A *metropolis* founds *apoikiai* — colonies, literally *away-homes*. polis founds societies; each adopted project is a colony of its culture.

## The two founders

- **Mav** — master builder of the **infrastructure and machinery** societies need to survive (substrate).
- **Nico** — master builder of the **constitution, people, roles, and archetypes** — the society itself, atop Mav's substrate.

## Status

**Founding commit.** Structure established; `mind` moved in from its prior home, `koine` imported from `agentir`. Cultural alignment of `koine` to `mind` (deep rename, re-homing config as projections of the corpus) and the constitution work are the planned next phases — see `plans/`.

## Toolchain

pnpm workspace · turbo · biome · changesets · commitlint · mise (node 24 / pnpm 10 / python 3.12).
