# ideas

**`ideas` ≜ the exemplars** — the canonical, _productive_ forms after which artifacts are made and against which they are judged.

Each cell is one exemplar. A cell's **slug is its anchor**: the densest name whose latent priors most precisely circumscribe the idea. The slug addresses the cell wherever it lives — the toolkit is **storage-polymorphic**: `cells.parse_cell(slug)` returns the identical `{slug, fm, body}` dict regardless of home, so `[[anchor]]` resolves the same and the projection is byte-identical.

## Where cells live

A cell's home is fixed by its `kind` — two carriers, one resolver:

- **Primitives** (`principle · concept · process · utility · structure · classification`, plus `gloss` cells) are **blocks** in `packages/mind/lexicon/<kind>.md` — every `principle` a block in `lexicon/principle.md`, every gloss a block in `lexicon/gloss.md`. A block opens with a `<!-- ^<anchor> -->` marker on its own line and runs to the next marker; its body is the verbatim cell text (front-matter included). The **anchor is still the address** — only the carrier changed (one-file-per-cell → one-block-per-cell), so `[[anchor]]` resolves unchanged; a block is also addressable cross-file as `[[<file>#^<anchor>]]` (Obsidian block-ref). `ideas/` no longer holds primitive cells.
- **Composites** (`agent · skill`) live at **`packages/mind/mind/<kind>/<organ>/<slug>.md`** — e.g. `mind/agent/persona/nico.md`, `mind/skill/competence/exemplify.md`. The `<organ>` is the cell's slot in the MECE agent-anatomy partition (organs in the tree: agent → `mandate · persona · deliberation · enaction · appraisal · disclosure · ledger`; skill → `construal · resolve · sensors · competence · enaction · ledger · disposition-memory`).
- Legacy flat (`ideas/<slug>.md`) and dir-form (`ideas/<slug>/<slug>.md`, for a cell carrying companion assets) homes still resolve — a file home wins over a lexicon block (migration back-compat).

## Front-matter

- `kind` — the ontological primitive (closed set below). It **governs composition** and is now a **coordinate of a composite's home** (`mind/<kind>/<organ>/`); a primitive's `kind` selects its `lexicon/<kind>.md` carrier. See the reconciled structure doctrine below.
- `delineation` — the one-line bound; the dense summary that resolves into composites (e.g. agent defs).
- `gloss: true` — marks an operator-facing glossary cell (a human-readable explanation of a dense anchor). Excluded from the compiled particulars; its slug is the anchor it explains.
- `render: verbatim` — _(projection directive, optional)_ marks an **organ** cell whose operative body must reach every composing agent **whole and density-immune** — load-bearing runtime instruction, not a density-collapsible disposition pointer. The composer emits the cell's `## Protocol` section **verbatim** at any reader profile, `{name}`-parameterized to the agent's sidecar directory. Like a skill's `trigger`, it governs _how the cell projects_, not where it lives. _(Composer support: polis-machinery B7; until it lands the genus identity block is still emitted from the hardcoded `_identity_block()`.)_

> **Structure doctrine (reconciled, γ2-B).** Altitude is still unstored — one operation at every grain ([[precise-circumscription]]); front-matter stays minimal: `kind` + `delineation` (+ `gloss`), plus optional **projection directives** (`trigger` for skills, `render` for organs) — these declare _how a cell projects_, never an abstraction level. What the migration changes is the carrier, not the rule against lossy projection ([[projection-is-not-the-source]]):
>
> - **Primitives — "structure is by anchor" is _strengthened_.** A primitive is a `lexicon` _block_ addressed by its anchor; the anchor still **is** the address, only the carrier moved file → block. No typology became its home.
> - **Composites — `{kind}/{organ}` is _load-bearing_.** Directory position is now a coordinate of a composite's identity, not a lossy index over it. This is the deliberate reversal authorized in A0 (charter §4.3), and it does **not** promote a projection to the Source: `kind` is the composition primitive (always load-bearing), and `organ` is the **MECE, exhaustive** agent-anatomy partition — substance for a composite-fragment ([[substance-over-accident]]), not a lossy typology that would grow a "ninth type." The home is a recast-as-scope-accident, not a repeal of [[projection-is-not-the-source]].
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

These are the two composition kinds with a home in the `mind/` tree. Earlier drafts listed `persona · task · pattern · runbook · troubleshooting` as composite kinds; the γ2-B migration shows those were **organs**, not kinds — `persona` and `ledger` appear under _both_ `agent/` and (for `ledger`) `skill/`, so they partition _within_ a kind, they do not name one. `kind` is the composition rule (an `agent` embodies its `principle`s as priors, invokes its `process`es, references its `concept`s); `organ` is the MECE anatomy slot under it. The closure is the point — a candidate new "kind" resolves to one of the primitives, to `agent`, or to `skill`; no eighth primitive appears.

## Agent cells — the definitional form

An `agent` cell is written as a **definition**, not a bulleted list: a one-line role intro, then a formula `<name> ≜ invokes [[…]], embodies [[…]], references [[…]]` (its composed dispositions — the **one** place composition lives), then a `## Persona` section carrying only its identity-deltas (handle · archetype · influences · subtractions · synthesis · bond; defined in [[agent-identity-facets]]). `≜` ("is defined as") is the package's own notation (`mind ≜ the exemplar corpus`). Composition reads from that line **alone** — refs in the intro or persona are not dispositions. To this the resolver adds a small set of **genus dispositions** every agent embodies _qua_ agent (e.g. `semantic-whole-over-syntactic-substrate`), emitted for all rather than copied into each formula ([[cite-dont-copy]]) — like the identity-memory protocol.
