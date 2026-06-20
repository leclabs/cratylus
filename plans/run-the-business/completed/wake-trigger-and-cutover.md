# wake-trigger-and-cutover

**Owner.** Mav (machinery) + Nico (wake cell edit). **Deps.** memory-home-dual-deploy.
**State: PENDING.**

**What.** Make per-host migration self-triggering at wake, then cut the fleet over to the
bundled tool and remove the last package remnants. This is the step that **dissolves the
original problem** ("trigger episodic migration on another device"): the tool is already on
the host (bundled with the memory skill), and wake runs it.

**Nico (constitution).** Edit `wake.md`: a migrate-if-needed step — "if `EPISODIC.md` exists
and `EPISODIC.jsonl` does not, run `episodic migrate` (no-loss gated) before loading". wake is
the first ritual to touch the store on a new host, so it's the natural trigger site. The
encode/dream steps already resolve to the bundled tool via the Protocol (prior task).

**Mav (machinery).**

- Deploy the new culture (skill dir + bundled artifact + updated cells) to the fleet — this
  host already JSONL-migrated; other hosts self-migrate at next wake via the new wake step,
  or drive via `ssh.py` if convergence is wanted now (Operator's call).
- Remove final remnants: any lingering `tsconfig` project-ref, stale `packages/episodic`
  package identity, doc references to `@leclabs/koine-episodic`.

**Exit criteria.**

- A **fresh host** (no repo checkout) with only `~/.claude/`, on first wake, self-migrates its
  EPISODIC and has the `episodic` tool locally — proven on a scratch host fixture or a real
  fleet host.
- Fleet deploy: all hosts carry `skills/memory/episodic`; SOUL Protocols name the affordance;
  sidecars untouched (sha256 spot-check).
- No `@leclabs/koine-episodic` identity remains anywhere; repo build/lint/test green;
  `verify.py` PASS.
- PLAN done → praxis sync; also sync the parent `memory-model-redesign / migrate-live-episodic`
  (its live-rollout tail completed 2026-06-19).

---

## Outcome — DONE 2026-06-20

**Corpus (Nico).** `wake.md` gained a _migrate-if-needed_ precondition: on a fresh host, if
`EPISODIC.md` exists and `EPISODIC.jsonl` does not, wake runs `episodic migrate` (no-loss gated)
before loading. `feat(corpus)` `b37323c`; `verify.py` PASS (incl. `verbatim-ref-free`).

**Machinery (Mav).** Scrubbed the retired `@leclabs/koine-episodic` library identity: removed the
dead `src/index.ts` barrel (orphan, treeshaken — nothing imported it), rewrote
`packages/episodic/{README,AGENTS,CLAUDE}.md` + the `packages/koine/AGENTS.md` reference as a
private build-only toolsource. `docs(episodic)` `f3dc5eb`. No live `koine-episodic` identity remains
(only retirement-provenance prose). Repo build + test + typecheck + lint green.

**Fleet cutover — deployed & verified live (the tree, not deploy stdout) on all 6 hosts.** Each
carries `~/.claude/skills/memory/episodic.mjs` (15357 B) + the updated SOULs (Protocol names the
`episodic.mjs encode` affordance, home-substituted) + the wake migrate step; sidecars sha256-untouched
(`layers present, untouched (33)` every host). Canary-first on **fire** (local): encode through the
_landed_ tool mints a ULID + appends; migrate of a scratch `.md`→`.jsonl` is 2-leg no-loss (2 items,
continuation preserved, source kept), then proven again on remote **ash** (macOS) and **forge** (Linux).

**Runtime confirmed on every host.** Each leclabs host provisions `node` v24.16.0 and `claude` via
**mise** (`~/.local/share/mise`, shimmed onto PATH in `~/.zshrc`). The tool runs end-to-end on all 6
(macOS + Linux) — encode + migrate verified on ash and forge directly. (An earlier probe wrongly read
node as absent: `bash -lc`/`zsh -lc` are _login_ shells and don't source `~/.zshrc`, where mise lives;
a real agent session sources the interactive profile, so `node` resolves. Lesson: probe runtime with
an interactive shell, not a login shell.) Legacy `EPISODIC.md` lingers beside `.jsonl` on the remotes —
harmless (wake-migrate no-ops when `.jsonl` present); a later hygiene sweep can remove it.
