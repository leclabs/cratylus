# T5 — integrate (pending · wave 2 · deps T1, T2, T3, T4)

## Objective

Prove E1 end-to-end on a clean worktree, and deploy the reshaped skills — establishing the
runtime-companion pattern E2 (event-tap) will follow.

## Dep-fed inputs

- **T1** dir-shape · **T2** deploy-recurse · **T3** port+adapter · **T4** compose-build.

## Static inputs (pinned)

- `packages/agent-canon/package.json` (`test`,`typecheck`,`project`,`build`[new]) + root `package.json` (`lint`, `canon:deploy`, deploy script L22).
- `packages/agent-forge/src/cli/commands/deploy.ts` (`deploy --kind skill … --fleet`).
- `.agent-factory.config` — 7-host fleet.

## Constraints

- **Gate a CLEAN worktree of the commit(s)**, never the shared dirty tree (a live sibling's edits mask state) — commit E1's files (scoped, explicit staging; verify `git show --stat`), then run `test + tsc + biome + project` against a fresh `git worktree` at the commit.
- **End-to-end smoke** (the pattern proof): a THROWAWAY sample runtime-companion skill → `project` (composes its `scripts/*.mjs`) → `deploy` LOCAL (T2 recursion carries `scripts/`) → run the composed `.mjs` → it installs a tap in a real session → `readCapture` shows an event → `removeTap` restores. Then remove the sample.
- **Projection-stability**: the reshaped 15 cells emit a byte-identical SKILL.md tree vs the E1 baseline.
- **Deploy discipline**: LOCAL (`~/.claude`) in-remit — deploy the reshaped skills, prove recursion+SKILL.md intact. **FLEET (`--fleet`) + `git push` RESERVED** for Operator sign-off (dry-run reach reported, held).
- Non-vacuous verify (`grep-false-green`) on every "green"/"present" claim.

## Outputs

Scoped commit(s); clean-worktree gate transcript; the end-to-end smoke result; verified LOCAL deploy; fleet dry-run reach held for sign-off.

## Accept (blind falsifier)

REJECTED if: gates ran on the dirty shared tree (not a clean commit/worktree); OR the sample skill's
composed `.mjs` fails to install/read/remove a tap after deploy; OR the reshaped SKILL.md tree drifts from
baseline; OR fleet-deploy/push executed without sign-off; OR any "green" is a vacuous grep. ACCEPTED when:
clean-worktree gates green, the project→deploy→run→install→read→remove smoke passes for a runtime-companion
skill, reshaped skills deploy intact locally, and FLEET+push are demonstrably staged-and-held.
