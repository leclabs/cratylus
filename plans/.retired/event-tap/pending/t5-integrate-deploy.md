# T5 — integrate-deploy (RE-CUT under `agent-runtime/S7`+`S10` · was pending · wave 2 · deps T2, T3, T4)

> **⛔ RE-CUT under `agent-runtime/S7` (deploy-runtime-install) + `agent-runtime/S10` (integrate-smoke) — do NOT execute as-is.**
> Integration/deploy of event-tap now flows through the runtime host: `agent-runtime/S7` guarantees the
> per-host `agent-runtime` + event-tap plugin install (dissolving the ship-the-`.sh` step), and
> `agent-runtime/S10` runs the e2e smoke (project → deploy+install → deployed thin-shim invokes
> `agent-runtime tap <verb>` on the host → verify). The clean-worktree gate + FLEET/push-reserved
> discipline below carry forward to those slices. See `plans/agent-runtime/SUPERSESSION.md`. Historical
> spec follows.

---

## Objective

Integrate the pieces, gate the whole on a clean worktree, project + verify the shipped skill dir, and
deploy — LOCAL freely, FLEET + push **reserved** for Operator sign-off.

## Dep-fed inputs

- **T2** (`content(t2-assets-bridge)`) — the live `assets:` staging.
- **T3** (`content(t3-mechanism)`) — `event-tap.sh` + green worker test.
- **T4** (`content(t4-skill-cell)`) — the gated `event-tap.ts` cell (declaring `assets: ['event-tap.sh']`).

## Static inputs (pinned)

- `packages/agent-canon/package.json` (`project`, `test`, `typecheck`) + root `package.json` (`canon:deploy`, `lint`, deploy script L22).
- `packages/agent-forge/src/cli/commands/deploy.ts` — `deploy --kind skill … [--assets]`.
- `.agent-factory.config` — the 7-host fleet topology (fire·forge·spark·ash·apps·upmav·upgoose).
- `packages/agent-canon/test/memory-nudge.test.ts` — confirms the worker test rides `pnpm test`.

## Constraints

- **Gate a CLEAN worktree of the commit**, never the shared dirty tree (a live sibling's edits mask
  the real state) — commit the event-tap files (scoped, explicit staging; verify `git show --stat`),
  then run `test + tsc + biome + project` against that commit (a fresh `git worktree` at the commit).
- Verify the projected `.render-ts/skills/event-tap/` contains **SKILL.md + event-tap.sh** (the T2
  bridge working end-to-end), byte-exact + executable.
- **Deploy discipline:** LOCAL (`~/.claude`) is in-remit — deploy + prove `~/.claude/skills/event-tap/`
  holds both files, and a smoke that the logger installs/logs/uninstalls in a real session.
  **FLEET (`--fleet`) + `git push` are RESERVED** — stage them, report the dry-run reach, and HOLD
  for Operator sign-off (`push-reserved`; a standing "push on completion" directive releases it).
- Non-vacuous verify (`grep-false-green`): every "present"/"green" claim proven by a control.

## Outputs

- The scoped commit; a clean-worktree gate transcript; the verified local deployment; a fleet
  dry-run reach report; the reserved fleet-deploy + push held for sign-off.

## Accept (blind falsifier)

REJECTED if: gates were run on the dirty shared tree (not a clean commit/worktree); OR the deployed
skill dir lacks `event-tap.sh`; OR fleet-deploy/push executed without the reserved sign-off; OR any
"green" claim is an empty/vacuous grep. ACCEPTED when: a clean-worktree gate run is green, LOCAL
deployment carries both files + a passing logger smoke, and FLEET+push are demonstrably STAGED-AND-HELD
pending sign-off with an accurate dry-run reach.
