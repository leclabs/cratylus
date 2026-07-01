# ideas

**`ideas` ≜ the exemplar corpus** — the canonical forms that **project into deployed agents and skills**.
`agent-anatomy` exists ONLY to be the lean, canonical context-source for a mind-society; it is **not an encyclopedia
of ideas**. A fragment earns its place by being an **organ value**, a **skill substance**, or a
constitution-scaffold an agent/skill composes — otherwise it is dead context and drops.

Each cell is one exemplar. A cell's **slug is its anchor**: the densest name (the reader-relative fittest
sign, σ\*\_R) whose latent priors most precisely circumscribe the idea. The toolkit is **storage-polymorphic**
— `cells.parse_cell(slug)` returns the same `{slug, fm, body}` regardless of home, so `[[anchor]]` resolves
identically and the projection is byte-identical.

## Where cells live — by the agent anatomy

The corpus is organized by the **conceptual anatomy of an agent** (the MECE organ set), not by an
idea-typology:

- **Organ value-cells** — `packages/agent-anatomy/<organ>/<value>.md`, `kind: <organ>`. Each organ is a directory
  holding its enumerated values (e.g. `address/human-on-the-loop.md`, `persona/sage.md`); the organ's
  `README.md` is the human projection composing them. An **enum-organ**'s values are members of the model's
  own native enum — sourced by **blind model introspection** (the recognized industry-standard term, the
  σ\*\_LLM that fires), never a coinage. An **open-organ**'s values are named per agent (mandate · telos ·
  competence · construal · persona · provenance — where identity lives). A **coined catalog**
  (charter · heuristics · instructions) is a closed, corpus-authored set of canonical directives —
  neither per-agent-open nor model-native-enum; `instructions` is the methodology organ (working
  principles), **not** a fallback or catch-all. **Authoring precedence:** pick the correct organ → bind a
  canonical value from its catalog/enum → author bespoke prose only when none fits.
- **Agents** — `packages/agent-anatomy/agent/<name>.md`, `kind: agent`. An **organ-selection vector**:
  `<name> ≜ ⊕{organ ↦ value}`, then one `organ [[value]]` line per organ it fills.
- **Skills** — `packages/agent-anatomy/skill/<name>.md`, `kind: skill`. A **self-sufficient set-builder**: a formal
  block that absorbs its own concepts; a prose `Bindings:` region names live sibling skills. `trigger:` and
  `delineation:` ride the front-matter.
- **Special organ-home cells** — `packages/agent-anatomy/ideas/<name>.md`: cells that are neither an organ value nor a
  composite. Today only `memory.md` — the memory organ-home (a `render: verbatim` protocol, a `deploy: skill-dir`
  directive, and the bundled `episodic` runtime), whose `## Protocol` the composer projects into every SOUL as genus.

## Front-matter — minimal

- `kind` — the **anatomy slot**: an organ name (the cell is a value in that organ), or `agent` / `skill`
  (a composite). It governs how the cell projects. (`memory.md` carries a legacy `kind: structure` as the one
  special organ-home cell.)
- `delineation` — the one-line bound; the dense summary that resolves into composites.
- **Projection directives** (optional) — `trigger` (a skill's invocation token), or the trio `render: verbatim`,
  `deploy`, and `bundle` (an organ cell whose operative body must ship whole and density-immune). These declare
  _how_ a cell projects, never an abstraction level — the carrier never promotes a projection to the Source.

## `kind` — the anatomy IS the taxonomy

There is no idea-typology. The former 7-primitive set (`principle · concept · process · utility · structure ·
classification · gloss`) and its `lexicon/<kind>.md` + `GLOSSARY.md` carriers were **demolished** in the
2026-06-22 rebuild. A cell's `kind` is now the **role it plays composing an agent or skill**: an **organ value**
(`kind: <organ>`), an **`agent`**, or a **`skill`**. The organ set is the MECE anatomy
(`docs/agent-conceptual-anatomy.md`); a candidate that is none of these is dead context and drops — the tell of
the rebuild was that ~100 of 141 old blocks were referenced by nothing.

## Agent cells — the organ-selection vector

An `agent` cell is a **selection over the anatomy**: a `# <name>` heading, the formula
`<name> ≜ ⊕{organ ↦ value}`, then one `organ [[value]]` line per organ it fills (e.g. `persona [[sage]]`,
`address [[human-on-the-loop]]`). The composer inlines each selected value's body — plus the `memory`
`## Protocol` as genus — to project the deployed SOUL. **Composition reads from the `organ [[value]]` lines
alone.** The ENUM organs select a model-native member; the OPEN organs carry the agent's named identity.

## Skill cells — the self-sufficient set-builder

A `skill` cell is a self-sufficient **set-builder block** that declares its own entities/operations/laws, so it
needs no external `[[refs]]` to project (Claude-Code progressive-disclosure ships only name + `delineation` at
selection — the name must carry the trigger-weight, never hide meaning in the body). Live sibling skills are
named in a prose `Bindings:` region, from which the composer derives composition; a used fence symbol is
β-bound in adjacent prose, never `[[cited]]`.
