# T1 — dir-shape (ready · wave 0 · deps ∅)

## Objective

Move the 15 flat skill cells `src/skills/<name>.ts` → self-contained dirs `src/skills/<name>/skill.ts`,
update the projectors' glob/import, and re-anchor every gate keyed to the flat shape — **projection-stable**
(the emitted `skills/<name>/SKILL.md` tree must be byte-identical before/after).

## Static inputs (pinned, path:line from census a013fad)

- `packages/canon/src/skills/*.ts` — the 15 cells (`export const <camel>: Skill = {...}`; count 15).
- `packages/canon/src/toolkit/project-cli.ts:57-65` (`moduleNames` glob `*.ts`), `:82` (`skillOf` import), `:116-141` (`projectSkills`, emits `skills/<name>/SKILL.md`); `project-cli-codex.ts:124-139` (identical).
- Gates: `test/cratylism.test.ts:117-133` (skills leg `glob('*.ts')` L121, `basename==declaredId` L127); `test/skill-shape.test.ts:90,99`; `test/symbols.test.ts:204-205`; `test/projection-stability.test.ts:18-19,65-66` (hardcoded `../src/skills/dream.js`+`wake.js` imports + glob); `test/formal-block-self-sufficiency.test.ts:55,91,114,137` (glob + `blockOf('skills/signify.ts')`/`probe.ts`); `test/symbol-probe-gate.test.ts:44`; `test/reader-density.test.ts:63,130,648` (hardcoded `signify.js` import + glob); `test/reader-reach.test.ts:26-27` (`exemplify.js`,`praxis.js`).
- `packages/canon/src/index.ts:26,33` (`dir('./skills')` — likely inert, verify no consumer breaks).

## Constraints

- `git mv` each cell into its dir as `skill.ts`; the cell's `export const … : Skill` body is UNCHANGED — only the file location moves (`rename-enumerates-every-dimension`: sweep EVERY ref via `rg -nw`).
- **Projectors**: `glob('*.ts')` → `glob('*/skill.ts')` (or dir-scan); import `join(dir,name,'skill.ts')`. BOTH `project-cli.ts` and `project-cli-codex.ts`.
- **cratylism skills leg re-anchors to `dirname==id`** (the standard's hard `name==parent-dir` rule; keep non-vacuous `checked>20`).
- Fix hardcoded per-skill import paths in tests (`.../<name>.js` → `.../<name>/skill.js`) and `blockOf` paths.
- Counts stay **15**. Do NOT touch the shared toolkit (E3). `irreversible-after-fallible`: `git add -A` after `git mv` + verify nonzero insertions before commit.

## Outputs

15 skill dirs `src/skills/<name>/skill.ts`; updated projectors + gates.

## Accept (blind falsifier)

REJECTED if: `pnpm --filter @leclabs/canon test` red on any gate; OR `tsc`/`biome` red; OR
`pnpm --filter @leclabs/canon project` produces a `skills/**/SKILL.md` tree that **differs** from
the pre-change output (projection-instability); OR cratylism still asserts `basename` (not `dirname`);
OR any count hardcoded wrong; OR a shared-toolkit file was moved. ACCEPTED when all gates green, tsc+biome
clean, and the projected SKILL.md tree is byte-identical to baseline (proven by diff).
