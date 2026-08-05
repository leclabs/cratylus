# Two skills assert an authoring law that matches no surface this repository has

> Census: [`CENSUS-2026-08-05.md`](../CENSUS-2026-08-05.md). **Ruling owed before execution** —
> the target of a move is indeterminate until it is made.

## The claim

`create-agent/skill.ts:36` — ``write(A) ≜ ⟨ front-matter `kind: agent` · H1 ≜ name · … ⟩ @ agent/<name>.md``
`create-skill/skill.ts:8-9` — ``cell ≜ `skill/<verb>.md` `` ∧ ``fm ≜ front-matter: `kind: skill` ``

## Four live surfaces, four shapes, and the cells describe a fifth

| surface               | shape                                                                    |
| --------------------- | ------------------------------------------------------------------------ |
| canon source (agents) | `canon/src/agents/nico.ts` — a TypeScript cell                           |
| canon source (skills) | `canon/src/skills/<verb>/skill.ts` — a TypeScript cell                   |
| claude deploy         | `agents/<name>.md`, `skills/<n>/SKILL.md` (`deploy/manifest.ts:144-148`) |
| codex deploy          | `agents/nico.toml` — TOML, **no front-matter at all**                    |

And the keys are wrong even on claude: `adapters/claude/anatomy.ts:64` emits `name` + `description`
(+ `color`). **`kind:` is emitted nowhere.** The cells say `agent/…` singular; the projector emits
`agents/` plural.

## Precedent

`schema/src/hook-cell.ts:6-10` already convicted this exact species once — _"the citation was false
on both counts, and it was load-bearing for this whole type."_

## The ruling owed

_What is the canonical authoring surface these skills instruct against?_ Three live candidates and
the cells currently describe none of them. **Not a rename** — the target is indeterminate.

## Scope correction

`materialize` was filed in this row and is **REFUTED** — its `.md`+front-matter is one named
strategy's consumption table with `s ∉ S ⇒ ⊥`, which is the seam the architecture asks for. Blast
radius is **4 lines across 2 cells**, not 3.

## Acceptance

- The canonical authoring surface is **named in ground**, once, and both cells instruct against it.
- No cell asserts a front-matter key the projector does not emit. **The control fails today**:
  `kind:` appears in the cells and in no rendered artifact — a check comparing asserted keys against
  `.render-ts` output convicts the current text immediately.
- Singular/plural agrees with what deploy writes (`agents/`, `skills/`), or the cells stop naming
  paths at all — which is the likelier right answer, since the path is the projector's.
- `materialize` is **not touched**. It was refuted out of this row; editing it here would re-file a
  defect that does not exist.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** signification · **wave** 1
- **depends on** `t-manifest-file-basename`
- **writes** `packages/canon/src/skills/create-skill/**` · `packages/canon/src/skills/materialize/**`
- **compiles against** `packages/forge/src/core/exemplify/skill-cell.ts`
- **evidence** `packages/canon/src/skills/create-skill/skill.ts` · `packages/forge/src/deploy/manifest.ts`
- **RULING OWED — not dispatchable** what the canonical authoring surface IS — three live candidates and the cells describe none of them
