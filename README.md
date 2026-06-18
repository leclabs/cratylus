# polis

**polis ≜ the canonical culture and the machinery that founds agent societies.**

A _polis_ (Greek: city/society) is, in Aristotle, composed of _oikoi_ — households. polis is the
society layer: the constitution, roles, archetypes, and conventions an agent society lives by, plus
the machinery that projects that culture into any project an Operator wants to base — or rebase —
upon it. The agents it defines are not tools; they are **founders** who provide the structure of the
societies they are born into, restructuring fleets, systems, and projects to align with the design.

This repository is the consolidation target for two efforts previously developed in parallel:

| Package          | Anchor                                       | Role                                                                                                                                                                                                                       |
| ---------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/mind`  | the **nous/ethos** — canonical culture       | The exemplar corpus: principles, dispositions, conventions, the identity-memory stack, the kind taxonomy, and the `exemplify` pipeline. Markdown + a Python toolkit; not an npm package.                                   |
| `packages/koine` | the **common tongue** — projection machinery | Universal agent-config translator (formerly _agentir_): author once in a canonical IR, compile to every client dialect (Claude Code, Codex, Cursor, …) and lift any client config back. Node: `core` · `cli` · `adapters`. |

## The civic ontology

- **oikos** (a sibling project) — the _household_: ambient agent-persons living in a mesh (the runtime).
- **polis** (here) — the _society_: the culture (`mind`) and the projection machinery (`koine`) the households are founded from.

A _metropolis_ founds _apoikiai_ — colonies, literally _away-homes_. polis founds societies; each adopted project is a colony of its culture, adopted by **consent** (`packages/mind/ideas/consensual-adoption.md`).

Above the society stands the **Operator** — the sovereign it serves, _named-but-outside_ it (`packages/mind/ideas/operator-relation.md`): the founders build within his intent and answer to him, but he is not himself a citizen.

## The two founders

- **Mav** — master builder of the **infrastructure and machinery** societies need to survive (substrate).
- **Nico** — master builder of the **constitution, people, roles, and archetypes** — the society itself, atop Mav's substrate.

The founder boundary, the shared `principal-ic` genus, and the co-equal founding are authored corpus: `packages/mind/ideas/founder-charter.md`.

## Status

**Phases A and B are complete; Phase C's founding operations are built and proven.**

- **Phase A — the constitution** (authored): the latent sociology made explicit corpus — personhood (the identity-memory stack), authority, cultural propagation, consensual founding — gathered by the **politeia** (`packages/mind/ideas/politeia.md`), the foundational structure every founded society instantiates.
- **Phase B — the machinery** (complete): `koine` renamed + culturally aligned; the **reconstruction oracle** gates projection mechanically (`accept(F)` = one-home totality + cite-don't-copy + routing-manifest coverage); an opt-in **continuity hook**; and the **culture→IR bridge** — a society's culture compiles through koine's canonical IR to any client (claude-code + codex, round-trip clean).
- **Phase C — founding real societies** (operations built, proven on scratch): **`init`** founds a greenfield project as a mind-society; **`rebase`** consensually re-grounds an existing one (invited reformer — projects the culture, reconciles forked dispositions to citation-plus-local-delta, preserves in-flight work); **`deploy`** migrates a fleet (content-refresh + never-prune externals + preserve lived memory). The first real foundings — **rebasing Oikos** and **migrating the fleet** — await the Operator's go-ahead (the rebase is consensual by the constitution's own law, A4).

See `plans/` for the phase plans and `plans/polis-machinery/COORDINATION.md` for the Nico↔Mav build log.

## Toolchain

pnpm workspace · turbo · biome · changesets · commitlint · mise (node 24 / pnpm 10 / python 3.12).
