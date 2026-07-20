# plugin-cli — DESIGN BRIEF (recharacterized E1)

**Status: DESIGN, not execution.** This is exploratory convergent work — the plugin architecture's shape is
unknown until it converges. Per `design ≠ execution-spec`, it is authored as prose (census → north-star →
cold-review) and sharded ONLY after it settles. This brief frames the objective; it is not a blind-dispatchable
shard set.

## Supersedes

The north-star `E1` (deferred "aspirational composition-root project-to-dir") is **recharacterized** by this
brief. E1's real intent — a doctrine-agnostic engine any corpus can drive — is preserved and made concrete: a
user-facing CLI + a conventional ESM plugin architecture. The old "project-to-dir purity" framing is retired.

## Objective (Operator, 2026-07)

A user-friendly CLI usable out-of-band via `npx`, into which the current agent-anatomy design integrates as a
conventional ESM-based **plugin** (the vite/eslint/rollup plugin lineage). agent-anatomy becomes simultaneously:

- **2.a — the golden example** for plugin authors (the reference plugin others copy).
- **2.b — a baseline catalog** of context fragments + agent/skill composites.
- **2.c — intelligent defaults** for consumers who only want the pre-designed agents/skills, zero authoring.

## Requirements (Operator, 3.a/3.b)

- **3.a — one aesthetic across both surfaces.** CLI consumers (via shell) and extending plugin authors (via ESM)
  feel the SAME recommended composition patterns. The shell verb and the ESM API are two faces of one
  composition model, not two dialects.
- **3.b — cross-plugin composition.** A consumer composes context fragments + composites from OTHER plugins
  (including our baseline catalog) to extend/customize their own catalog and composites. Fragments and
  composites are the unit of sharing; a plugin is a distributable bundle of them.

## Absorbs (from vocab-depalimpsest Stream B)

The founding-CLI layer (`found.ts`, `cli/index.ts`, `founding-template.ts`, `found-cli.ts`, `plan-states.ts`)
is rebuilt here with clean vocabulary from the start (`MAPPING.md`) — `found`/`polis` → `init`/`create`/`scaffold`
over `project`/`catalog`/`fleet`. Do NOT sweep-then-redesign; redesign clean.

## Open design questions (converge before sharding)

1. **The plugin contract.** What does an ESM plugin EXPORT? (a `defineCatalog`/`definePlugin` factory returning
   fragments + composites + adapters?) What is the vite/eslint-analogue shape that reads idiomatic to JS authors?
2. **CLI ⇄ ESM parity (3.a).** The one composition model with two faces — what are the shared verbs
   (`init`/`add`/`compose`/`deploy`/`catalog`)? How does a shell invocation and an ESM call express the SAME
   composition?
3. **Cross-plugin resolution (3.b).** How does a consumer catalog reference + override fragments from another
   plugin? (npm dep + a resolution/merge order like eslint `extends`? shortlex/anchor collision rules across
   plugins?)
4. **Baseline-as-default (2.c).** `npx <tool>` with no config → the baseline catalog's agents/skills deploy.
   What is the zero-config entrypoint?
5. **Distribution.** npm package(s): is the engine (`agent-forge`) the CLI's core + the baseline
   (`agent-anatomy`) a peer plugin? What does `npx` resolve to?
6. **The type-only purity (old E1).** Does the plugin boundary finally make anatomy type-only w.r.t. forge, or is
   the composition-root value-import acceptable inside a plugin? (Resolve E1's original concern here.)

## Phase plan

- **DESIGN (next):** census the current CLI/entrypoint/adapter surface + survey the vite/eslint/rollup plugin
  conventions → author `NORTH-STAR.md` (the plugin architecture) → cold-review (isolated Ω\* on the contract
  names + a plugin-author walkthrough). Convergent prose, not shards.
- **EXECUTION (after convergence):** decompose into blind-dispatchable shards CITING the settled design; the
  founding-layer depalimpsest (Stream B) is folded in.
