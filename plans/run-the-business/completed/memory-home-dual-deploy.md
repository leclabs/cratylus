# memory-home-dual-deploy

**Owner.** Mav (machinery) + Nico (Protocol cell edit). **Deps.** skill-companion-deploy ✓,
episodic-toolsource-bundle ✓. **State: READY** (both deps completed).

**What.** Make the `memory` organ the deployed home of the `episodic` tool. Promote
`ideas/memory.md` to dir-form and resolve the **"one cell, two deploy fates"** problem: the
cell must (a) keep projecting its verbatim `## Protocol` into every agent SOUL (unchanged
mechanism) **and** (b) deploy as a host `skills/memory/` directory carrying the bundled
`episodic` artifact.

**The crux (Mav, substrate).** `memory.md` is `kind: structure`, not `kind: skill` — so today
it projects into SOULs (verbatim organ, `GENUS_ORGANS`) but does **not** deploy as a host
dir. Resolve the dual fate. Candidate mechanisms:

- **dual-kind / deploy-flag** — let an organ cell also be in the deploy set (front-matter flag
  e.g. `deploy: skill-dir`), so it both projects verbatim AND places a host dir with assets.
- Lean toward the flag over a second `kind:` (a cell has one kind; deployment is a separate
  projection axis). Resolve during build; whichever keeps both projections clean off one cell.

**Nico (constitution).** Cut the `memory.md` `## Protocol` edit naming the affordance (R4):
ENCODE/DREAM cite the concrete invocation (`episodic encode` at the host path,
`~/.claude/skills/memory/episodic`), **reasoning stays prose** (what's salient,
observed-vs-inferred), only the mechanical act gets a handle, path host-derived (never
absolute-bound). Nico authors the wording once Mav lands the final subcommand surface + host
path.

**Exit criteria.**

- `ideas/memory/` (dir-form) deploys as `~/.claude/skills/memory/` containing `SKILL.md` +
  the `episodic` artifact, on a local deploy (and ssh).
- The verbatim Protocol still projects into all 11 agent SOULs — **byte-diff regression
  (agents × readers) clean** except the deliberately-scoped Protocol wording change
  (enumerate the hash delta).
- Every SOUL names the affordance; an agent can invoke `episodic encode` at the host path.
- `verify.py` PASS; CE ∧ ME on the cell edit (Nico verifies).

**Result — DELIVERED (Mav + Nico), exit criteria met.**

The task's "promote `ideas/memory.md` to dir-form" framing **predates γ2-B**: `memory` now lives as the
`<!-- ^memory -->` block in `lexicon/structure.md`, which cannot carry an `assets:` dir. Resolved instead
by a **deploy axis orthogonal to `kind`** (cleaner than dir-form anyway): two front-matter flags on the
existing block.

- **Mechanism (substrate).** `deploy: skill-dir` adds a non-skill cell to the skill deploy set
  (`cells.slugs_deploying_as_skill`); `resolve.emit_skill_dir` renders SKILL.md from the cell's ref-free
  `## Tool` section (not the skill composer); `bundle:` stages a build artifact (distinct from `assets:`);
  optional `skill_description:` gives host-discovery copy. `deploy.py --kind skill` ships the union.
  Hard-errors if the bundle is unbuilt. Files: `core/cells.py`, `resolve.py`, `deploy.py`; doc in
  `toolkit/AGENTS.md ## Dual-deploy`; test `test_place.py §5`.
- **Cell (constitution, Nico).** `## Protocol` ENCODE bullet now names the concrete invocation
  (`node ~/.claude/skills/memory/episodic.mjs encode --home ~/.claude/agents/{name} …`), reasoning stays
  prose; new ref-free `## Tool` section is the SKILL.md body. CE ∧ ME **PASS** (the triple "cannot
  hand-mint" restatement is necessary across non-citing projection targets).
- **Host path landed (Mav):** `~/.claude/skills/memory/episodic.mjs`, invoked via `node` (scp/write_bytes
  drop +x, so no executable-bit dependency).

**Proof.** SOUL byte-delta = **exactly** the ENCODE bullet (with `{name}` substituted) + the content-hash,
across all 11 agents — nothing else (wake/dream/handoff compose memory name-only, unchanged). New
`skills/memory/` = the only added artifact. `verify.py` PASS (R1+R2+R3); all 17 toolkit tests pass;
scratch deploy lands `SKILL.md` + `episodic.mjs` and the tool runs from the landed dir (byte-identical to
source). **The live fleet rollout (atomic SOUL + skill redeploy per host) is the `wake-trigger-and-cutover`
task** — this task delivers the mechanism + corpus + deployability, not the rollout.
