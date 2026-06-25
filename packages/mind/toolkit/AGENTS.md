# toolkit

`packages/mind/toolkit/` is **shell hooks only**. The Python projector/deployer was retired in
`koine-absorbs-mind` T6.1 — the typed modules under `src/` are the **sole source** and **koine** is the
only projection + deploy machinery. What remains here:

- **`continuity/`** — the repo-level praxis-advance post-commit hook (opt-in) + the fleet-organs shell.
- **`guardrail/`** — the stance-guardrail Stop/SubagentStop hook (opt-in).
- this doc — the **`koine deploy` runbook** (below) and the two hooks.

**Projection + composition are TS/koine.** Source = `src/organs/<organ>/<value>.ts`, `src/agents/<name>.ts`,
`src/skills/<name>.ts`, plus the `memory` home `ideas/memory.md`. Anatomy types = `@leclabs/koine/anatomy`
(wrong organ/arity = a compile error). Composition = ESM `import` + object-spread; projection = the koine
claude adapter (`pnpm mind:project`). The byte-identity round-trip oracle is **retired** (`.ts` is the
source — there is nothing to round-trip against); acceptance = `tsc` + `test/projection-stability.test.ts`

- the two ported gates `test/skill-shape.test.ts` (operative + cite-twice) and `test/symbols.test.ts`
  (fence-glyph coverage vs `references/formal-symbolic-notation.md`). Every other former `verify.py` gate
  dissolved into `tsc` or the module system (one module per fragment = one home; import = cite-don't-copy).

**Dual-deploy** (the `memory` cell projects its `## Protocol` into every SOUL **and** ships as a
`skills/memory/` dir carrying the bundled `episodic.mjs`) lives in the koine projector + deploy layer:
`pnpm mind:project` stages `episodic.mjs` into the render tree, and `koine deploy` ships it as a present
asset. The coupling law still holds — a host's agent SOULs + the `memory` skill dir deploy atomically.

## Deploy — `koine deploy` (the canonical path, koine-absorbs-mind T6.1a)

`koine deploy` is the **sole, documented, runnable** deployer. It ships an already-PROJECTED render tree
(`agents/` + `skills/`) to a host `.claude/`, a byte-identical TS port of the former `place/local.py` +
`place/ssh.py`. `koine deploy --dry-run` enumerates exactly the agents + skills it will place.

**The bin.** `pnpm build` emits the `koine` bin (`@leclabs/koine` `bin.koine` → `dist/cli/index.js`,
shebang'd + executable). When koine is on PATH the operator command is literally `koine deploy …`; the
host-independent invocation (no bin-symlink dependency) is `node packages/koine/dist/cli/index.js
deploy …`, which the convenience scripts use.

**Whole-corpus convenience (run from repo root):**

- `pnpm mind:project` — project the TS corpus (`@leclabs/mind project`, koine claude adapter) to the
  gitignored render tree `packages/mind/.render-ts/` (11 agents + 16 skills incl. the `memory` bundle;
  the projector stages `episodic.mjs` beside `skills/memory/SKILL.md`).
- `pnpm mind:deploy` — `build → project → deploy --kind agent → deploy --kind skill` in one go (the
  build prereq guarantees the bin + the `episodic` bundle exist). Two explicit `--kind` invocations,
  sequential — no shell-loop (the coupling law: a host's agent SOULs + the `memory` skill dir must land
  atomically, so both kinds deploy together per run).
- `pnpm mind:deploy:agent` / `pnpm mind:deploy:skill` — the single-kind halves; append target flags
  here (`--host …`, `--fleet`, `--dry-run`, …) since pass-through applies to the last command only.

**Flags** (`koine deploy --help` for the full set):

- `--kind agent|skill` (default `agent`) · `--scope user|project` (default `user`).
- `--agents-dir <dir>` / `--skills-dir <dir>` — the projected render tree (required; the convenience
  scripts pin them to `.render-ts/`).
- `--host <key>` — a `.polis.config` host; omit/`local` deploys in place. `--user <u>` ssh override.
  `--home <dir>` user-scope `.claude` parent (else config home, else `~/.claude`). `--project <dir>`
  for `--scope project`.
- `--fleet` — deploy every `fleet.hosts` minus `fleet.exclude` (needs `.polis.config`). `--exclude
<hosts>` adds to the fleet exclude. `--only <names>` — single-host: defs to deploy; `--fleet`: hosts
  to restrict to.
- `--bundle <skill>=<spec>[,…]` — a build-artifact companion (hard-errors if the build output is
  absent — never ships a tool-less `memory`). `--assets <skill>=<spec>[,…]` — committed companions
  (warn if absent). **Not needed by the convenience path**: the projector already stages `episodic.mjs`
  into the render tree, so deploy ships it as a present asset (`memory → … (+1 asset)`).
- `--dry-run` — print actions, change nothing (the blind-test: `pnpm mind:deploy:skill --dry-run`
  lists all 16 skills + the memory asset; `:agent` lists all 11 agents).

**Seed-if-absent** (unchanged contract): defs/skills overwrite freely; SELF/MEMORY/EPISODIC are seeded
only-if-absent (never clobbered) and **never pruned** — agent deletion is a manual per-host def `rm` +
sidecar archive.

**Verify what LANDED, not what deploy printed** — confirm on-host at `~/.claude/{agents,skills}` (count +
a content check). A wrong target path prints "copied" while the live tree is untouched.

> Legacy: the Python `deploy.py` was deleted in T6.1e; `koine deploy` is the only deployer (git history recovers it).

## Continuity hook (B5 — repo-level praxis-advance reminder)

The one **repo-level** continuity ritual is **praxis-advance**: when plan task-files move between
their state folders (`plans/**/{pending,ready,active,completed}/`), PLAN.md — the hand-authored
mirror — may go stale. `toolkit/continuity/` provides an **opt-in, off-by-default** post-commit hook
that _detects this and prints a reminder_ to re-mirror via `/praxis`. It **never edits PLAN.md**
(detect → remind, never edit): auto-rewriting hand-authored prose would need a PLAN.md generator that
doesn't exist (a future "mechanized mirror" task), and a commit-time edit wouldn't be in the commit.

- **encode / dream are out of scope** — those are per-_agent_ sidecar-memory ops
  (`~/.claude/agents/<name>/{EPISODIC,MEMORY,SELF}.md`), not repo state; a repo hook can't know which
  agent committed, so it can't meaningfully fire them. They are a separate agent-lifecycle mechanism.

- **Opt-in (per-repo, never checked in).** The flag is `git config --bool polis.continuity`, stored in
  `.git/config`. A fresh clone has it unset → the shipped `.husky/post-commit` dispatcher exits early →
  **default commit behavior is unchanged**. Toggle via:
  - `pnpm run continuity:install` — enable for this clone
  - `pnpm run continuity:uninstall` — back to default off
  - `pnpm run continuity:status` — show state
- **Fires when enabled:** a commit touching a plan state-folder prints which plan changed + the
  re-mirror reminder. A reminder must never fail a commit, so the worker always exits 0.
- **Composes, never clobbers** the existing husky `pre-commit` (biome) / `commit-msg` (commitlint) —
  `post-commit` is an additive third hook in `.husky/`. Files: `.husky/post-commit` (guarded
  dispatcher), `toolkit/continuity/praxis-advance-nudge.sh` (the detector/reminder),
  `toolkit/continuity/continuity-hook.sh` (the install/uninstall/status toggle).

## Stance guardrail (principal-stance P4 — the harness half)

Sibling to the continuity hook, but it **blocks** rather than reminds: a Claude Code **Stop +
SubagentStop** hook that judges the last assistant turn against the **intent-driven-expert
(fiduciary-agent) stance** and, on a **collapse** (permission-seeking for in-remit reversible work,
deferring the agent's own naming/design/how judgment, echoing the operator's literal words), returns
`{"decision":"block","reason":…}` to keep the agent going with corrective feedback. It **passes** the
reserved set — surfacing a genuine irreversible-outward act (deploy/push) for consent, routing a true
INTENT ambiguity to `/elicit` — and fails PASS on a toss-up. Why the harness and not the prompt:
prompt-level identity is **not** invariant (RLHF corrigibility erodes it under operator pushback); only a
structural refusal is. Same safety spine as the continuity hook — **off by default**
(`git config --bool polis.stanceGuard true`; the toggle also writes the hook into gitignored
`.claude/settings.local.json`, local-only), **agent-scoped** (`polis.stanceGuardAgents`, default
`nico mav`), **fails open**, **loop-safe** (`stop_hook_active`). Pluggable judge (`$STANCE_JUDGE_CMD`;
default `stance-judge.sh` → headless `claude -p` haiku). Files in `toolkit/guardrail/`; convenience
`pnpm run stanceguard:{install,uninstall,status,test}`. **Full mechanism + rubric:
`toolkit/guardrail/README.md`.**

## Fleet organ sync (memory-model-redesign — the dropped approach)

> Superseded — memory is **local-per-host** (Operator decision 2026-06-23); fleet-wide organ sync was
> declined (a shared store clobbers each host's local context). The `toolkit/continuity/fleet-organs.sh`
> shell + its runbook remain for reference; deploy seeds SELF/MEMORY/EPISODIC if-absent and never syncs.

The per-_agent_ sidecar organs (`SELF`, `MEMORY`, `EPISODIC`) were proposed as **one logical store** synced
to every host via a dedicated git "organ store" a host adopts by symlinking each live organ file into it.
Files: `toolkit/continuity/fleet-organs.sh` (`init|adopt|sync|status|release`), `RUNBOOK-fleet-organs.md`,
`test-fleet-organs.sh`. Convenience: `pnpm run organs:{status,sync,test}`.
