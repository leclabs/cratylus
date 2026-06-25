# toolkit

Pipeline (run from `packages/mind`): `toolkit/resolve.py --reader strong-llm-lean` → `toolkit/glossary.py` → `toolkit/verify.py` (PASS gate) → `toolkit/deploy.py`. Deployed profile: strong-llm-lean.

## Founding (`init.py` — polis-instantiation C1)

`toolkit/init.py <target>` founds a **mind-society** in `<target>`: it projects the _whole_ corpus
(every agent + skill) into `<target>/.claude/{agents,skills}` via the proven claude-code render, then
lays the founding scaffold — `<target>/AGENTS.md` (cites the `[[politeia]]` + `[[founder-charter]]`,
names the founders nico+mav born into it, states the subject) and a minimal `plans/founding/`
sharded-plan-layout. The founders are among the projected agents ("agents born as founders").

- **Composes resolve's pure `emit()`, not its `main()`.** `resolve.main()` deliberately keeps a custom
  out-dir _agents-only_ (preview) so the repo's own default render can't be broken; `init` is a distinct
  operation that renders the FULL agents+skills set at an arbitrary root. The corpus is read from the
  mind package (`cells.ROOT` anchored to file location), independent of cwd.
- **Lays the SOUL, not the individual.** init writes the generated defs/skills (regenerated substance,
  overwritten freely); it does NOT seed SELF/MEMORY/EPISODIC — those are the running host's `deploy.py`
  concern. A host adopts the founded society by deploying, which seeds the sidecars if-absent.
- **Clobber-guarded:** refuses an existing `<target>/AGENTS.md` unless `--force` (idempotent re-found).
- Flags: `--reader R` (default strong-llm-lean), `--subject TEXT`, `--force`. Test: `test_init.py`.

## Stages

- **compose** — markdown-it-py AST; fence-immune substitution; FENCE gate rejects `[[ ]]` inside fences.
- **render** — provenance header + content-hash; the hash covers substance, not decoration.
- **place** — defs/skills overwritten freely; SELF/MEMORY/EPISODIC seeded only-if-absent; **never prunes** — agent deletion = manual per-host def rm + sidecar archive.
- **skill projection** — `[[x]]` → `/trigger` (kind×harness); trigger read verbatim from cell front-matter.

## Dual-deploy: `deploy: skill-dir` (memory-home-dual-deploy)

Deployment is a projection axis **orthogonal to `kind`** (a cell has one kind; how it deploys is a
separate accident). The `memory` organ (`kind: structure`, `render: verbatim`) must do BOTH: project its
`## Protocol` verbatim into every agent SOUL **and** deploy as a host `skills/memory/` dir carrying the
bundled `episodic` tool ("one cell, two deploy fates"). Resolved by two front-matter flags:

- **`deploy: skill-dir`** — adds a NON-skill cell to the skill deploy set (`cells.slugs_deploying_as_skill()`
  = `kind:skill` ∪ `deploy:skill-dir`, used by `resolve.main` and `deploy.py --kind skill`). Such a cell
  renders SKILL.md via `resolve.emit_skill_dir` — its **ref-free `## Tool` section** emitted verbatim
  (heading dropped), NOT the skill composer (which assumes a skill's H1 + `≜` shape). The `## Tool` body
  ships to a host where `[[ ]]` can't resolve, so it must be ref-free + operative (like `## Protocol`).
- **`bundle: <relpath>`** — a BUILD-ARTIFACT companion (distinct from `assets:`, which are committed
  cell-dir files). Sourced relative to `cells.ROOT` (= `packages/mind`); staged by basename beside
  SKILL.md by `resolve._stage_bundle`. memory → `bundle: ../episodic/dist/episodic.mjs`.
- **`skill_description:`** (optional) — host-side **discovery** copy for the SKILL.md `description` (a
  one-line "what is this, when do I reach for it"), distinct from the cell's reconstruction-grade
  `delineation`. `emit_skill_dir` prefers it; falls back to `delineation`.

**Build before deploy.** `bundle:` reads a build OUTPUT (`dist/`, gitignored). Run the toolsource build
first — `pnpm --filter episodic build` (or `pnpm build` / `turbo build`, which CI/pre-commit run) — else
`resolve.py` **hard-errors** (never silently ships a tool-less home). Pipeline becomes: `pnpm --filter
episodic build` → `resolve.py` → `glossary.py` → `verify.py` → `deploy.py`. Host invocation of the landed
tool: `node ~/.claude/skills/memory/episodic.mjs encode --home ~/.claude/agents/<name> --scope user --body
'…'`. Test: `test_place.py §5`.

**Coupling law (rollout).** A SOUL whose ENCODE bullet names `~/.claude/skills/memory/episodic.mjs` breaks
if that host has no memory skill — so deploying the new agent SOULs and the `memory` skill dir to a live
host must be **atomic** (`--kind agent` + `--kind skill` together, per host). The fleet rollout itself is
the `wake-trigger-and-cutover` task.

## Gotchas (composer, `skill.py`)

- Requires an H1: all body before the first H1 is **silently dropped** (known bug — contradicts degrade-visibly; fix pending).
- The first prose `≜` line is consumed as the composition formula — boundary-bind dependencies with "binds" prose, never `X ≜ [[cell]]` in prose. A skill whose only `≜` is fenced math composes **empty provenance**; this no longer regresses silently — `verify.py` `gate_skill_provenance` surfaces it as a `NOTE PROVENANCE` warning (B9).

## Verify gaps (open)

- Requires an H1: all body before the first H1 is **silently dropped** (composer gotcha above) — not yet a verify gate.

### R3 routing-manifest consumer (B8 — consumer half)

`gate_reconstruct()`'s R3 now mechanizes against a **routing manifest** when one is present. Manifests
live in `packages/mind/.manifests/<source>.json` (dotted sibling of the `.claude/` deploy outputs; a
pipeline artifact, not a corpus cell — outside `ideas/`, so the corpus-slug glob never sees it). Schema
(Nico's, firm): `{source, exemplified_at, reader, routes[]: {fragment_digest, idea_gloss, home_slug,
disposition, rank}, delta[]: {fragment_digest, idea_gloss}}`; `disposition ∈ {reuse, mint, delta}`.

- **Consumer only** (this half): `_load_manifest()` parses + shape-validates (a malformed manifest is a
  **hard error**, never a silent skip); the R3 gate asserts every `routes[].home_slug` resolves to
  exactly one live cell and no fragment is double-listed (routes XOR delta). The **producer** (resolve/
  exemplify emit) and the **digest values** are Nico's follow-on — the toolkit only _reads_ digests.
- **Degrade-visibly:** no manifest present (current state) ⇒ R3 stays the audit-line NOTE and the PASS
  line reads `reconstruct (R1+R2; R3 manual)`; ≥1 manifest present + passing ⇒ `(R1+R2+R3)`. On the
  current corpus (no manifests) the gate is a **no-op** — built, fixture-tested, dormant until producers
  arrive (`test_reconstruct.py` R3 cases).

### Closed (B9)

- ~~Round-trip PASSes on an empty skill body~~ → `gate_skill_operative` (OPERATIVE): a `kind: skill` needs ≥1 operative element (step / fenced block / substantive prose) beyond heading + `≜` formula.
- ~~No symbol-coverage lint~~ → `gate_symbols` (SYMBOLS): every fence-interior glyph ∈ (table col-1 ∪ definienda-class ∪ exemptions), else FAIL with cell:line + codepoint. Exemptions = Greek (U+0391–03C9), subscripts (U+2080–2089, ᵢ, ⱼ), box-drawing (U+2500–257F diagram art), em-dash (prose-in-fence). (Ellipsis `…` is **declared** in the table — the "and so on" enumerator — not exempted.) Table: `references/formal-symbolic-notation.md`.
- ~~Fenced-`≜` empty-provenance composes silently~~ → `gate_skill_provenance` (PROVENANCE warning, above).

## Deploy — `koine deploy` (the canonical path, koine-absorbs-mind T6.1a)

`koine deploy` is the **sole, documented, runnable** deployer; it replaces `deploy.py` (deleted in
T6.1e). It ships an already-PROJECTED render tree (`agents/` + `skills/`) to a host `.claude/`, a
byte-identical TS port of `place/local.py` + `place/ssh.py` (proven by `packages/koine/test/deploy/
parity.test.ts` — both placers over the same render tree into scratch targets, asserted byte-for-byte;
it is the green oracle for this deploy's correctness, and `koine deploy --dry-run` enumerates exactly
the agents+skills that test pins).

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
  (warn if absent). `--bundle-base-root <dir>` — root `bundle:` specs resolve against. **Not needed by
  the convenience path**: the projector already stages `episodic.mjs` into the render tree, so deploy
  ships it as a present asset (`memory → … (+1 asset)`).
- `--dry-run` — print actions, change nothing (the blind-test: `pnpm mind:deploy:skill --dry-run
--scope user` lists all 16 skills + the memory asset; `:agent` lists all 11 agents).

**Seed-if-absent** (unchanged contract): defs/skills overwrite freely; SELF/MEMORY/EPISODIC are seeded
only-if-absent (never clobbered) and **never pruned** — agent deletion is a manual per-host def `rm` +
sidecar archive.

**Verify what LANDED, not what deploy printed** — confirm on-host at `~/.claude/{agents,skills}` (count

- a content check). A wrong target path prints "copied" while the live tree is untouched.

### Legacy: `deploy.py` (retired in T6.1e)

Per host, sequential explicit `deploy.py` invocations — no shell-loop cleverness.

- **`--home` is the user's HOME dir** (e.g. `/Users/lex`, `/home/lex` on Linux, `/Users/lcaraccioli`);
  `deploy.py` resolves the `.claude/` root under it. **Omitting `--home` is correct everywhere** — it
  defaults to `~/.claude`, expanded server-side per host, so the macOS-vs-Linux path difference needs no
  flag. Passing a bare home dir self-corrects (a loud `NOTE` + `.claude` appended); a path already ending
  in `.claude` is used verbatim. (Hardening for a past footgun where `--home /Users/lex` was treated as
  the `.claude` dir itself and silently littered `<home>/{agents,skills}` beside the real `~/.claude`.)
- **Verify what LANDED, not what deploy printed** — `deploy.py` reports its intended copies; confirm
  on-host at `~/.claude/{agents,skills}` (count + a content check, e.g. a known new skill present). A
  wrong target path prints "copied" while the live tree is untouched.

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

## Fleet organ sync (memory-model-redesign — agent-global organs across hosts)

The per-_agent_ sidecar organs (`SELF`, `MEMORY`, `EPISODIC`) are **one logical store** synced to
every host ([[memory]] `## Portability`), so an agent wakes as the **same person** anywhere. Mechanism:
a dedicated git repo (the "organ store") holds `<agent>/{SELF,MEMORY,EPISODIC}.md`; a host **adopts**
it by symlinking each live organ file into the store — git then versions the real organ content (true
history, conflicts surfaced, never silently lost). The live path (`~/.claude/agents/<name>/SELF.md`)
keeps working, so the protocol and `deploy.py` seeder are unchanged (the if-absent guard follows the
symlink → sees PRESENT → never clobbers).

- **Portable:** the store's physical path is `$HOME`-derived per host (`/Users/lex` vs
  `/Users/lcaraccioli`); it tracks **relative** paths only — no host-absolute path is ever written.
  Host-specific facts go in MEMORY **content**, never per-host files.
- **Files:** `toolkit/continuity/fleet-organs.sh` (`init|adopt|sync|status|release`),
  `RUNBOOK-fleet-organs.md` (the procedure), `test-fleet-organs.sh` (hermetic two-host gate proof).
  Convenience: `pnpm run organs:{status,sync,test}`.
- **Reversible:** `release <agent>` turns the symlink back into a plain file (store untouched).
- **Out of scope (consent-gated):** migrating a **live** running agent's organs into the store is the
  `migrate-live-episodic` task — the mechanism is proven on a scratch agent / fixtures only.
