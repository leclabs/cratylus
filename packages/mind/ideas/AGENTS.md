# ideas

**`ideas` ≜ the exemplars** — the canonical, _productive_ forms after which artifacts are made and against which they are judged.

Each cell is one exemplar. A cell's **slug is its anchor**: the densest name whose latent priors most precisely circumscribe the idea. The slug addresses the cell wherever it lives — the toolkit is **storage-polymorphic**: `cells.parse_cell(slug)` returns the identical `{slug, fm, body}` dict regardless of home, so `[[anchor]]` resolves the same and the projection is byte-identical.

## Where cells live

A cell's home is fixed by its `kind` — two carriers, one resolver:

- **Primitives** (`principle · concept · process · utility · structure · classification`, plus `gloss` cells) are **blocks** in `packages/mind/lexicon/<kind>.md` — every `principle` a block in `lexicon/principle.md`, every gloss a block in `lexicon/gloss.md`. A block opens with a `<!-- ^<anchor> -->` marker on its own line and runs to the next marker; its body is the verbatim cell text (front-matter included). The **anchor is still the address** — only the carrier changed (one-file-per-cell → one-block-per-cell), so `[[anchor]]` resolves unchanged; a block is also addressable cross-file as `[[<file>#^<anchor>]]` (Obsidian block-ref). `ideas/` no longer holds primitive cells.
- **Composites** (`agent · skill`) live **flat**, one file per cell — `packages/mind/agents/<slug>.md` and `packages/mind/skills/<slug>.md` (e.g. `agents/nico.md`, `skills/exemplify.md`). There is **no `<organ>` directory level**: an agent embodies **many** organs at once, so filing it under one organ-directory is a category error (the anatomy _decomposes_ each agent; it does not _partition the set of agents_). The agent anatomy lives **inside** the archetype as named **sections** that composite each organ **by reference** ([[cite-dont-copy]]) — see the anatomy-section model under _Agent cells_.
- Legacy flat (`ideas/<slug>.md`) and dir-form (`ideas/<slug>/<slug>.md`, for a cell carrying companion assets) homes still resolve — a file home wins over a lexicon block (migration back-compat).

## Front-matter

- `kind` — the ontological primitive (closed set below). It **governs composition** and selects a cell's carrier: a primitive's `kind` selects its `lexicon/<kind>.md` block-file; a composite (`agent · skill`) lives flat under `agents/` or `skills/` by its kind. See the structure doctrine below.
- `delineation` — the one-line bound; the dense summary that resolves into composites (e.g. agent defs).
- `gloss: true` — marks an operator-facing glossary cell (a human-readable explanation of a dense anchor). Excluded from the compiled particulars; its slug is the anchor it explains.
- `render: verbatim` — _(projection directive, optional)_ marks an **organ** cell whose operative body must reach every composing agent **whole and density-immune** — load-bearing runtime instruction, not a density-collapsible disposition pointer. The composer emits the cell's `## Protocol` section **verbatim** at any reader profile, `{name}`-parameterized to the agent's sidecar directory. Like a skill's `trigger`, it governs _how the cell projects_, not where it lives. Such an organ is discovered by **anatomy-section composition**: an archetype declares it as a named `## ` section (other than `## Persona`) that references the organ — e.g. `## Memory` → `- binds [[memory]]` — and the composer renders the `render: verbatim` ones it finds; a non-verbatim organ-section ref is byte-neutral source-structure. There is **no hardcoded genus-organ list** (the former `GENUS_ORGANS`/`_identity_block()` is retired).

> **Structure doctrine.** Altitude is still unstored — one operation at every grain ([[precise-circumscription]]); front-matter stays minimal: `kind` + `delineation` (+ `gloss`), plus optional **projection directives** (`trigger` for skills, `render` for organs) — these declare _how a cell projects_, never an abstraction level. The carrier never promotes a projection to the Source ([[projection-is-not-the-source]]):
>
> - **Primitives — structure is by anchor.** A primitive is a `lexicon` _block_ addressed by its anchor; the anchor **is** the address. No typology became its home.
> - **Composites — flat; the anatomy is section-structure, not a directory coordinate.** An `agent`/`skill` lives flat by `kind` (`agents/<slug>.md`, `skills/<slug>.md`); the organ axis is **not** a path level. `organ` names a **role in the decomposition of one agent** ([[substance-over-accident]]) — a named anatomy **section** inside the archetype that composites its organ **by reference** ([[cite-dont-copy]]), never a directory the archetype is filed under. No `kind: organ` exists: a composable organ's _meaning_ is a `kind: concept` glossary cell (hover-legible); its _content_ for a given agent is that agent's section. (Ruling: `plans/mind-structure-flatten/decisions/0001-organ-taxonomy.md`.)
>
> The remaining genuine accident, **scope**, is still applied by an `AGENTS.md` grant ([[scope-grant]] · [[substance-over-accident]]), never a cell field.

## `kind` — the closed value set

**Primitives** (every fragment is exactly one — [[one-cell-one-type]]):

- `principle` — a normative ought: rule, stance, disposition, doctrine, preference, policy. Embodied as a prior.
- `concept` — a declarative what-is: definition, model, fact. Referenced/known.
- `process` — an ordered operation: steps, workflow. Invoked.
- `utility` — a reusable instrument a process invokes: template, rubric, tool.
- `structure` — a relational arrangement: roster, schema, index, layout.
- `classification` — a kind plus the test that decides membership.

**Composites** (a bundle of primitives bound for a purpose; imports constituents by `[[ ]]`, never restates):

- `agent` · `skill`.

These are the two composition kinds — each home is a flat carrier (`agents/`, `skills/`). Earlier drafts listed `persona · task · pattern · runbook · troubleshooting` as composite kinds; those are **organs**, not kinds — `persona` and `ledger` are anatomy roles an agent (and, for `ledger`, a skill) _embodies_, so they partition _within_ a single agent, they do not name a composition kind. `kind` is the composition rule (an `agent` embodies its `principle`s as priors, invokes its `process`es, references its `concept`s); `organ` is the MECE anatomy slot, carried as a named **section by reference** inside the archetype — never a `kind`, never a directory. The closure is the point — a candidate new "kind" resolves to one of the primitives, to `agent`, or to `skill`; no eighth primitive appears.

## Agent cells — the definitional form

An `agent` cell is written as a **definition**, not a bulleted list: a one-line role intro, then a formula `<name> ≜ invokes [[…]], embodies [[…]], references [[…]]` (its composed dispositions — the **one** place composition lives), then a `## Persona` section carrying only its identity-deltas (handle · archetype · influences · subtractions · synthesis · bond; defined in [[agent-identity-facets]]). `≜` ("is defined as") is the package's own notation (`mind ≜ the exemplar corpus`). Composition reads from that line **alone** — refs in the intro or persona are not dispositions. To this the resolver adds a small set of **genus dispositions** every agent embodies _qua_ agent (e.g. `semantic-whole-over-syntactic-substrate`), emitted for all rather than copied into each formula ([[cite-dont-copy]]) — like the identity-memory protocol.

Beyond `## Persona`, an archetype may carry **anatomy sections** — one named `## ` section per organ it embodies, each compositing its organ **by reference** ([[cite-dont-copy]]): `## Memory` → `- binds [[memory]]`. The composer renders the `render: verbatim` organs it discovers in these sections (replacing the old hardcoded genus-organ list); other organ-section refs are byte-neutral source-structure, so the fuller anatomy can be authored without changing what projects. The organ _concepts_ named here are glossed in `lexicon/concept.md` (the 8 composable organs) or `docs/agent-conceptual-anatomy.md` (the runtime/apparatus organs).
