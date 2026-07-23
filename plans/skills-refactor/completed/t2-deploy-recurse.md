# T2 — deploy-recurse (ready · wave 0 · deps ∅)

## Objective

Make skill deployment recurse into a skill dir's subdirectories (`scripts/`, `references/`, `assets/`),
so co-located companions ride along. Today the copy is flat (top-level files only).

## Static inputs (pinned, path:line from census a013fad)

- `packages/agent-forge/src/deploy/local.ts:90-138` — `placeSkillsLocal`; flat copy at `:120-127` (`readdirSync` → `statSync(...).isFile()` filter → `copyFileSync` top-level only).
- `packages/agent-forge/src/deploy/ssh.ts` — `placeSkillsSsh` (the remote analog; make it recurse too).
- `packages/agent-forge/src/deploy/types.ts:10-22` — `RenderTree`/`skillsDir`/`companions` contract.
- `packages/agent-forge/src/deploy/deploy.ts:71-82` — `treeNames('skill')` enumerates dirs containing `SKILL.md` (already dir-granular; unaffected).

## Constraints

- Recurse the WHOLE skill dir (preserve subdir structure, exec bits on `scripts/*`), local + ssh.
- Existing flat skills (dir with only `SKILL.md`) must deploy identically (no regression).
- Keep the `stageAssets` (`deploy/bundle.ts`) pre-copy for elsewhere-sourced `assets:` intact; this shard fixes only the _co-located_ recursion.
- Forge change only; independent of the canon reshape (parallel with T1/T3).

## Outputs

`placeSkillsLocal` + `placeSkillsSsh` recurse; a forge deploy unit/integration test covering a nested `scripts/` file.

## Accept (blind falsifier)

REJECTED if: a skill dir containing `scripts/x.mjs` deploys WITHOUT `~/.claude/skills/<name>/scripts/x.mjs`
(local) or its ssh equivalent; OR exec bit lost on `scripts/*`; OR a flat SKILL.md-only skill regresses.
ACCEPTED when a fixture skill with a nested `scripts/x.mjs` (+ `references/y.md`) deploys with the subtree
intact + executable, local and ssh, and flat skills are unchanged.
