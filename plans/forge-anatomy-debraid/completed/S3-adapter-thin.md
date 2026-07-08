# S3 · ADAPTER-THIN — strip the braided courier to a generic-IR→harness map

**Objective.** Collapse the claude adapter's skill path to a THIN generator (frontmatter + fenced formalBlock +
composed-from), delete the dead palimpsest, fix the agent persona→description leak, and unify the two
disconnected skill renderers into the one generator.

## Ground state (READ FIRST — deliberately-broken checkpoint)

- Branch `tmp-illustrate-conceptual-architecture`. HEAD `00d19f5` is **intentionally broken**; realize the
  direction, don't revert. Green reference = `7fd1c43`. push/deploy **Operator-reserved**.
- Census pinned this session (RE-GREP at dispatch — counts rot): `[[ref]]`=**0** and `## Harness:`=**0** across
  all 15 live skills ⇒ the ref-projection and harness-selection code is **dead**. `densityRef`/`bodyHash`/
  `provenanceHeader` are exported-but-uninjected (a self-admitting comment at `anatomy.ts:168` confirms "agent
  never consumes … not injected"). **Delete dead code, do not relocate it.**

## Inputs

- `packages/agent-forge/src/adapters/claude/anatomy.ts` — the braided adapter. Key sites: `skillBody` (:241,
  drops the `≜` line :280, projects `[[ref]]` :253, selects `## Harness:` :296); `agentFrontMatter` (:157,
  `description = emoji + a.persona` — the leak); `agentBody` (:134, the CLEAN template to mirror);
  `ReaderDensity`/`densityRef` (:46-79), `bodyHash` (:110), `provenanceHeader` (:115) — the dead exports;
  `skillToClaudeMd` (:362).
- `packages/agent-forge/src/core/exemplify/skill-cell.ts` — `renderSkillCellBody` (:72), the OTHER skill
  renderer (verb + fenced block + self-sufficiency-enforced); imported by `core/exemplify/index.ts`. **Unify
  target.**
- `packages/agent-anatomy/src/toolkit/project-cli.ts` — the driver; `:150 body: cell.body` builds the
  `ResolvedSkill` from the (now-gone) `body`. Rewire to feed `formalBlock`.
- S1's reshaped `Skill` (`formalBlock`, no `body`) ⊳dep. S2's migrated cells (author `formalBlock`) ⊳dep.

## Constraints (design decisions)

1. **One thin skill generator.** Replace `skillBody`'s transformer with a pure map:
   `frontmatter{ name · description · trigger=/name } + generated body{ #verb · fenced ${formalBlock} · "Composed
from <composition names>" }`. NO `[[ref]]` scan, NO `## Harness` selection, NO density/banner. Mirror how
   `agentBody` generates a SOUL from a structured vector.
2. **Unify the two renderers.** The anatomy `skillBody` and exemplify `renderSkillCellBody` must become ONE
   generator function with a single home (choose the home; both call sites consume it). No second skill-md
   renderer survives.
3. **Fix `agentFrontMatter`.** Map the new `Agent.description` (σ_human*) → SOUL frontmatter `description:`;
   route `persona` (σ*) → SOUL body only; **DELETE the `description = emoji + a.persona` map.** `color` = mark→
   color unchanged.
4. **Delete dead palimpsest**: `ReaderDensity`, `READER_DENSITIES`, `isReaderDensity`, `densityRef`, `bodyHash`,
   `provenanceHeader`, the `[[ref]]` `refProject` machinery, the `## Harness:` selector, and the `≜`-line strip.
   Verify each is uninjected on the live corpus before deleting (the census says so; confirm by grep).
5. **KEEP the `deploy: skill-dir` bypass** (the memory-style cell that ships a verbatim body + bundled
   `episodic.mjs`). That path is legitimate, not palimpsest — do not fold it into the generator.
6. Rewire `project-cli.ts` (`ResolvedSkill.body`) to source the generated body from `formalBlock`, not the
   dropped `cell.body`. (`project-cli.ts` is yours; the OTHER local-toolkit importers — hooks, codex-cli,
   targets, codegen — belong to S5.)
7. **Fix forge's own type-test (S1 fallout).** `packages/agent-forge/src/anatomy/anatomy.test-d.ts` has 3
   errors from the S1 reshape: an `Agent` literal missing the new `description` (:53, TS2741) and two `Skill`
   literals still carrying the removed `body` (:143,:150, TS2353). Update the fixtures to the new shape so
   agent-forge `src` type-checks green.
8. **Composition → lazy thunk (S2 recon).** Forge's `Skill.composition: readonly Skill[]` is EAGER and rejects
   string anchors (`@ts-expect-error` at `anatomy.test-d.ts:159`), but the real skill graph is CYCLIC
   (conceptualize↔exemplify↔signify↔materialize, elicit↔probe) — eager sibling imports TDZ-crash at ESM load.
   This is the pre-flagged deferred concern (old `toolkit/skill-cell.ts:14-15`). **Change `Skill.composition` to
   a lazy thunk: `readonly composition: () => readonly Skill[]`** in `agent-forge/src/anatomy/index.ts`; update
   the generator/`skillBody` to CALL it (`skill.composition()`) when emitting "Composed from …"; drop the
   `@ts-expect-error` and fix the test-d fixture to the thunk form. (Cell-side wiring of the real thunks from
   the preserved anchor-comments is S5's — you only make the IR + generator lazy-ready.)
9. Rebuild forge dist (`pnpm --filter @leclabs/agent-forge build`) as your LAST step (by S3 you are the sole
   forge-territory writer this wave — no dist race).

## Dependencies

- S1 (IR-RESHAPE) ⊳dep. S2 (CELLS-MIGRATE) ⊳dep — the generator consumes migrated `formalBlock` cells.

## Outputs

- Thinned `adapters/claude/anatomy.ts`; unified single generator; rewired `project-cli.ts`; deleted dead
  exports. A return listing each deleted symbol + the grep proving it was uninjected, and the unified
  generator's home + both call sites.

## Acceptance (falsifier)

- FAIL if `grep -nE 'densityRef|ReaderDensity|bodyHash|provenanceHeader|## Harness|\[\[' packages/agent-forge/src/adapters/claude/anatomy.ts`
  matches (dead code survived).
- FAIL if `grep -n 'description = .*persona' packages/agent-forge/src/adapters/claude/anatomy.ts` matches (the
  leak survived).
- FAIL if two distinct skill-md renderer functions still exist (renderers not unified).
- FAIL if the generated SKILL.md for a sample migrated cell (e.g. carry-on) is not `frontmatter + fenced
formalBlock + composed-from` — i.e. any parsing/ref/harness transform remains in the path.
- FAIL if the `deploy: skill-dir` (memory) path was altered/removed.
- FAIL if the return is human-register prose, not a dense structured list.
