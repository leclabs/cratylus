# run-the-business (RTB)

**The standing plan.** Unlike a founding/initiative plan — a transient scaffold that retires once its
result is in the source of truth ([[plan-retirement]]) — RTB is **perpetual**. It is the durable home for
the live backlog and standalone tasks that don't warrant their own sharded plan. It never retires; tasks
flow through its state folders (`pending/ → ready/ → active/ → completed/`) and `completed/` is swept
periodically (git is the recovery net).

**Use it for.** One-off maintenance, small standalone tasks, and the surviving tails of retired
initiatives whose larger scaffold has been wound down but whose remaining work is still live. When a
cluster of RTB tasks grows into a coherent initiative, promote it back out into its own sharded plan.

## Status mirror

| Task                   | State | Owner | Origin                |
| ---------------------- | ----- | ----- | --------------------- |
| `vault-reference-home` | ready | Mav   | memory-model-redesign |

### ready

- **vault-reference-home** — the Obsidian vault as the 5th memory home (cold, on-demand). Lower
  priority; not load-bearing for wake.

> **Done 2026-06-20:** `wake-trigger-and-cutover` (→ `completed/`). Closes the memory-tool-bundling tail
> and the `memory-model-redesign` live-rollout tail. Nico added the wake-cell migrate-if-needed step
> (`feat(corpus)` `b37323c`, verify PASS); Mav scrubbed the retired `@leclabs/koine-episodic` library
> identity — removed the dead `src/index.ts` barrel, rewrote the episodic README/AGENTS/CLAUDE + koine
> reference (`docs(episodic)` `f3dc5eb`). **Fleet cutover deployed & verified live (the tree, not deploy
> stdout) on all 6 hosts:** each carries `skills/memory/episodic.mjs` (15357 B), SOULs name the
> `episodic.mjs encode` affordance, wake carries the migrate step, sidecars sha256-untouched. Tool proven
> end-to-end on **all 6 hosts** — encode mints+appends and migrate is 2-leg no-loss, run via the
> mise-provisioned `node` v24.16.0 (`~/.local/share/mise`) + `claude` present on every host
> (fire/ash/forge/spark/upmav/upgoose; macOS + Linux). Legacy `EPISODIC.md` lingers beside `.jsonl` on
> remotes (harmless; wake-migrate no-ops when `.jsonl` present — a later hygiene sweep can clear it).

> **Done 2026-06-20:** `memory-home-dual-deploy` (→ `completed/`). The `memory` organ now deploys as the
> host `skills/memory/` home carrying the bundled `episodic` tool, via a `deploy: skill-dir` + `bundle:`
> axis orthogonal to `kind` (the γ2-B lexicon-block layout retired the task's original "dir-form" framing).
> Nico authored the `## Protocol` ENCODE affordance line (the single, enumerated SOUL delta across 11
> agents) + the `## Tool` SKILL.md section (CE ∧ ME PASS). `verify.py` PASS; 17/17 tests; deploy proven.
> **Live fleet rollout deferred to `wake-trigger-and-cutover`.**
>
> **Done 2026-06-20:** `fleet-redeploy-lcaraccioli-catchup` (→ `completed/`). Brought upmav/upgoose to
> σ\*\_R; surfaced + fixed a `--home` footgun that had silently mis-deployed the _whole_ remote fleet
> (corrected ash/forge/spark too). Hardened `place/ssh.py` so an explicit home dir self-corrects to
> `.claude`.

## See also

- `CLAUDE.md` — the standing-initiative context (founder split + acceptance discipline) the migrated
  memory tasks carry.
