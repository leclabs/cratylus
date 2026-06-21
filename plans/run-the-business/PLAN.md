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

_No `ready`/`active`/`pending` task — the fresh baseline._

> **Promoted out 2026-06-20:** `sharded-memory-store` grew from an RTB seed into its own
> initiative (RTB charter's promotion rule) — now `plans/sharded-memory-store/`, seeded by
> `decisions/0001-memory-store-architecture.md` (portable sharded files + swappable index behind a
> stable verb interface; CLI-over-shell, not MCP).

> **Done 2026-06-20:** `vault-reference-home` (→ `completed/`). The Obsidian vault as the cold 5th memory
> home. **Spec check (Operator's question):** the type→home routing — with the vault row and the
> hot-index/cold-corpus split — is **intact** in `structure.md` + `dream.md` (Nico re-verified; nothing
> lost in minimization). The concrete Obsidian binding was never in the corpus by design
> (substance-over-accident); wired as a directive in polis `AGENTS.md` (`## Memory vault`) + agent MEMORY.
> Graduation proven: two voluminous craft clusters → one sharded vault note
> (`leclabs/obsidian` `bc56ad1`), MEMORY keeps only the pointer. **RTB now has no `ready`/`active` task —
> the fresh baseline; next pick is the `sharded-memory-store` design.**

> **Done 2026-06-20:** `wake-trigger-and-cutover` (→ `completed/`). Closes the memory-tool-bundling tail
> and the `memory-model-redesign` live-rollout tail. Nico added the wake-cell migrate-if-needed step
> (`feat(corpus)` `b37323c`, verify PASS); Mav scrubbed the retired `@leclabs/koine-episodic` library
> identity (`docs(episodic)` `f3dc5eb`). **Fleet cutover deployed & verified live on all 6 hosts** —
> `skills/memory/episodic.mjs`, SOULs name the affordance, wake carries the migrate step, sidecars
> untouched. Tool runs end-to-end on every host via mise `node` v24.16.0.

> **Done 2026-06-20:** `memory-home-dual-deploy` (→ `completed/`). The `memory` organ deploys as the host
> `skills/memory/` home carrying the bundled `episodic` tool, via a `deploy: skill-dir` + `bundle:` axis
> orthogonal to `kind`. `verify.py` PASS; 17/17 tests; live rollout was deferred to the cutover.
>
> **Done 2026-06-20:** `fleet-redeploy-lcaraccioli-catchup` (→ `completed/`). Brought upmav/upgoose to
> σ\*\_R; fixed a `--home` footgun that had silently mis-deployed the _whole_ remote fleet. Hardened
> `place/ssh.py`.

## See also

- `CLAUDE.md` — the standing-initiative context (founder split + acceptance discipline) the migrated
  memory tasks carry.
