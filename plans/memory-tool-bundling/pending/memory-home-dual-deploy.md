# memory-home-dual-deploy

**Owner.** Mav (machinery) + Nico (Protocol cell edit). **Deps.** skill-companion-deploy,
episodic-toolsource-bundle. **State: PENDING.**

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
