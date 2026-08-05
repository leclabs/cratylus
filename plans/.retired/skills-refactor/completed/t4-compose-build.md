# T4 — compose-build (SUPERSEDED · was pending · wave 1 · deps T1, T3)

> **⛔ SUPERSEDED-BY `runtime/S6` (forge-build-integration) + `runtime/S8` (skills-rewire) — do NOT execute.**
> The dep-free-bundle composition specified below is the DEAD design. `runtime` decomplects a
> **runtime host** from the build host: a projected skill script becomes a **thin shim →
> `runtime <capability> <verb>`**, not a dependency-free `.mjs` composed at projection. S6
> reverses this slice (forge projects thin shims against runtime ports); the capability logic lives in
> a runtime plugin, installed per-host by `runtime/S7`. Retained for the reasoning trail only —
> see `plans/runtime/SUPERSESSION.md`. Historical spec follows.

---

## Objective

Give canon a build that **composes** a skill's TS **domain module** ⊕ a forge **adapter impl**
into a **dependency-free standalone `.mjs`**, and wire `projectSkills` to emit it into `skills/<name>/scripts/`.

## Dep-fed inputs

- **T1** — the reshaped `projectSkills` (glob `skills/*/skill.ts`) this composition hooks into.
- **T3** — the `EventTapHost` port + `EventTapHostClaude` impl to compose against/with.

## Static inputs (pinned, path:line from census a013fad)

- `packages/memory/tsup.config.ts` — the bundling precedent (`bundle:true, treeshake:true, format:['esm'], outExtension .mjs, dts:false`) producing `dist/memory.mjs`.
- `packages/canon/package.json:14-23` — scripts today (NO `build`; a tsup build must be added).
- `packages/canon/src/toolkit/project-cli.ts:116-141` — `projectSkills` (where composition emits).

## Constraints

- Add a tsup build to canon (mirror `memory`) that bundles domain⊕adapter → ONE `.mjs` with **no external imports** (runs under bare `node` on any host, no `node_modules`).
- A skill DECLARES its runtime companion (e.g. a `runtime?: { entry, port }` field on the `Skill` cell, or a convention `skills/<name>/scripts/<x>.ts`); `projectSkills` selects the **target adapter's** port impl (via `adapterByName`) and composes it in at projection → `skills/<name>/scripts/<x>.mjs`.
- Composition selects the impl by the **projection target** (claude), keeping SOURCE harness-agnostic — same discipline as cells→SKILL.md.
- Skills with NO runtime companion emit no `scripts/` (unchanged). Do not perturb the SKILL.md emission (T1's projection-stability must still hold for cells).

## Outputs

An canon tsup build; `projectSkills` composing runtime companions; a SAMPLE domain module proving the pipeline.

## Accept (blind falsifier)

REJECTED if: the bundled `.mjs` has any external `import`/`require` of a non-bundled module (not dep-free);
OR composition leaks the adapter selection into the domain source; OR `project` stops emitting a valid
SKILL.md for cells; OR a companion-less skill gains a spurious `scripts/`. ACCEPTED when: a sample domain
module (coding to `EventTapHost`) ⊕ `EventTapHostClaude` compose+bundle → a standalone `.mjs` (grep-proven
no external imports) that, run, installs a tap; and `project` emits it under `skills/<sample>/scripts/`.

---

**DISPOSITION (mav, 2026-07-26) — ABSORBED BY REVERSAL. Design dead, goal met.**

The dep-free-bundle design is correctly dead and the goal — a projected executable companion —
shipped by the opposite mechanism. `runtime-shim.ts` names this shard directly: forge projects
a **thin shim** against the runtime contract, "NOT a bundle of the capability impl".

A ~15-line `spawnSync` shim strictly dominates bundling for the same acceptance ("runs under
bare node, no node_modules"), so no tsup build was added and none is wanted. Nothing remains.
