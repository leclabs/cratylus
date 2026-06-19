# repo-structure-firstprinciples — PLAN

First-principles structure review + de-palimpsest spec for the polis monorepo. **Planning only** —
this plan IS the execution spec; landing it moves nothing. Status mirror; task files live under state
folders. Charter: `AGENTS.md`.

## Status — SPEC DRAFTED, awaiting sign-off on two Operator forks + Nico naming review

The first-principles review is complete and empirically grounded against the live tree (HEAD `55cf653`).
Findings verified, not inherited. The spec below is converged for the tasks Mav owns outright (structure

- build + palimpsest); two forks are blocked on the Operator, one batch of names on Nico. Nothing here
  executes until those clear and the Operator opens an execution arc.

## What the review found (empirically verified)

**The current tree.**

- `packages/` has two children: `koine/` (a **grouping dir**, not a package) and `mind/` (markdown +
  Python toolkit, intentionally NOT a workspace member — correct, preserve).
- `packages/koine/*` (the pnpm glob) nests **four** members: `core` (`@leclabs/koine-core`),
  `adapters` (`@leclabs/koine-adapters`), `cli` (`@leclabs/koine`), `episodic`
  (`@leclabs/koine-episodic`).

**Coupling (verified by grep over `*.ts` src, node_modules/dist excluded).**

- `core` <- `adapters` (every adapter + every adapter test) and <- `cli`. `adapters` <- `cli` only.
  `core` depends on no sibling. Strictly one-directional `cli -> adapters -> core`.
- **`episodic` is imported by NOBODY** in the repo, has **zero koine deps**, and is a different domain
  (agent memory: ULID JSONL store + dream routing, not config translation).
- **Nothing outside `packages/koine` imports any koine package.** No external consumer exists.
- **Never published**: no git tags, every member `0.0.0`.

**Build-config coherence (the tell).**

- `tsconfig.json` references list only `core`, `cli`, `adapters` — **episodic is absent.**
- `.changeset/config.json` `fixed: [["@leclabs/koine", "@leclabs/koine-adapters", "@leclabs/koine-core"]]`
  — **episodic is absent.** So episodic is _already_ treated as a structural stranger inside `koine/*`;
  the glob is the only thing still grouping it with config-translation.

**Name <-> path mismatch.** Package names are dash-flat (`koine-core`, `koine-adapters`, `koine-episodic`)
but live nested (`koine/core`, `koine/adapters`, `koine/episodic`). The path does not mirror the identity:
`@leclabs/koine-core` lives at `koine/core`, not `koine-core/`. This is the structural seam the collapse
or the rename must resolve.

**Fleet/deploy coupling is near-zero (key de-risking finding).** The ONLY references to the literal
`packages/koine/core|cli|adapters` paths outside the package are: `tsconfig.json` (3 ref lines),
`pnpm-workspace.yaml` (1 glob), and the IR fixture path `packages/koine/adapters/test/ir-bridge/`
`mind.koine.json` (consumed by `packages/mind/toolkit/test_ir_bridge.py` + an active plan task).
**`deploy.py` references no koine path** — agent-def deploy projects from `packages/mind/.render/`, not
from koine. A koine collapse therefore has no fleet/deploy implication beyond the IR-fixture path.

## Recommended target structure

A first-principles read via [[defer-the-package-boundary]]: the four-way split is **speculative,
inherited from agentir** — no demonstrated independent consumer forces any internal boundary. The
recommendation collapses the speculative split and pulls out the off-domain member.

```text
packages/
  mind/                         # unchanged — markdown + python, NOT a workspace member
  koine/                        # ONE package: @leclabs/koine (was 3)
    package.json                #   name "@leclabs/koine", bin { koine }, subpath exports
    src/
      core/                     #   was packages/koine/core/src
      adapters/                 #   was packages/koine/adapters/src  (subpath exports ./adapters/*)
      cli/                      #   was packages/koine/cli/src       (-> bin)
    schema/  test/  docs/  README.md  AGENTS.md
  episodic/                     # PULLED OUT — its own top-level package, own domain
    (name fork — see Fork 2)
pnpm-workspace.yaml: packages: ["packages/*"]   # flat glob; mind excluded by absence of package.json
```

Why this shape:

- **Collapse core+adapters+cli -> one `@leclabs/koine`.** No independent consumer, never published,
  internal-only one-directional coupling. The adapter-author "only needs core" story is served by a
  subpath export (`@leclabs/koine/core`), not a separate package. Cost of three boundaries
  (version contract x3, release coordination, integration surface) is paid for nothing.
  Subpath `exports` + `bin` preserve every current entry point.
- **Pull `episodic` to top-level `packages/<name>/`.** It is a different domain, zero-coupled, and the
  config already excludes it from koine's tsconfig refs + changeset `fixed`. Nesting it under
  `koine/` is a pure palimpsest of the agentir grouping. Flat `packages/*` glob then mirrors identity:
  one dir == one package == one name.
- **`packages/*` flat glob.** With koine collapsed and episodic pulled out, the `koine/*` grouping glob
  has no remaining job. Flat `packages/*` is the pnpm-idiomatic default; `mind` stays out by having no
  `package.json` (already how it is excluded).

## Forks needing sign-off (the decisions Mav will NOT absorb)

These are genuine value/intent calls, not substrate judgments — surfaced, not decided.

**Fork 1 (Operator) — publish intent for koine.** The collapse is correct IFF koine is a **single
published/consumed unit**. If the Operator intends `@leclabs/koine-core` and `@leclabs/koine-adapters`
to be **independently published** so third parties depend on core without the CLI (the README's
"only package a community adapter author needs" story taken literally as a release boundary), the
boundary has a forcing function and the three packages should **stay split**.
**Mav's recommendation: COLLAPSE.** No tags, all `0.0.0`, no external consumer, no release pipeline —
the independent-publish story is aspirational, not actual. Re-split later is cheap if a real consumer
appears; carrying three premature boundaries now is not. _Yes/no: collapse, or keep split for publish?_

**Fork 2 (Operator + Nico) — episodic's home + name.** Pulling episodic out of `koine/` is settled
(domain + zero-coupling). Open: **where, and called what.** Options:
(a) `packages/episodic/`, name stays `@leclabs/koine-episodic` — minimal, but the name still claims the
koine domain it no longer belongs to (residual palimpsest);
(b) `packages/episodic/`, **rename** to `@leclabs/episodic` or `@leclabs/<memory-domain-name>` — clean,
but a published-name change (none published, so cost is internal-only: imports + the IR-fixture
nothing, since nobody imports it) and a **naming call = Nico's sign-off**.
**Mav's recommendation: (b) `packages/episodic/` + rename to drop the `koine-` prefix** — the name
should mirror the domain (agent memory), not inherit koine's. **Flag to Nico** for the new anchor
([[signify]]). NOTE: `memory-model-redesign` PLAN currently names `@leclabs/koine-episodic` as its
**settled, deployed** home — this rename **touches that plan's stated home**, so it needs that plan's
lead (Nico) to concur, not just a naming nod. _Where + what name?_

**Naming batch (Nico, advisory) — beyond Fork 2.** Any new dir/package names introduced by the
collapse (e.g. confirming `@leclabs/koine` as the single name; subpath export names `./core`,
`./adapters/<client>`) are [[signify]] calls. Mav proposes; Nico signs off. Low-risk (mostly retaining
existing names) but flagged for completeness.

## Phases (tasks)

Tasks shard by [[shard-by-orthogonal-concern]]. **P0 (palimpsest) is independent of the structure
forks and can land first** — it is pure cleanup, no boundary decision, Mav's call outright. P1–P3 are
the structure spec; they stay `pending` until the forks clear, because their content depends on the
fork outcomes.

### P0 — de-palimpsest (READY — no fork dependency, Mav's call)

- **depalimpsest-naming-residue** (ready) — repo-wide scrape of stale/layered naming, the residue this
  review found. Independent of the structure decision; pure [[palimpsest]] cleanup.

### P1 — structure spec, koine (PENDING — blocked on Fork 1)

- **spec-koine-collapse** (pending; dep: Fork 1 = collapse) — the concrete file-level move-list +
  exports/bin design + tsconfig/changeset/workspace edits + IR-fixture-path update + rollback for
  collapsing core+adapters+cli into one `@leclabs/koine`.

### P2 — structure spec, episodic (PENDING — blocked on Fork 2)

- **spec-episodic-extraction** (pending; dep: Fork 2 = home+name) — the move + (optional) rename
  file-list, the import/exports impact, tsconfig/changeset/workspace edits, the `memory-model-redesign`
  cross-plan reconciliation, and rollback.

### P3 — workspace + build coherence (PENDING — depends on P1+P2 shapes)

- **spec-workspace-glob-and-config** (pending; deps: spec-koine-collapse, spec-episodic-extraction) —
  flatten `packages/*` glob, reconcile `tsconfig.json` references, `.changeset/config.json`
  (`fixed`/`access`), turbo, catalog comment de-agentir, root loose-file + `.scratchpad`/`docs` hygiene
  review. The integration task that makes the build green after P1+P2.

## Backlog (pending)

_(none beyond P1–P3 above.)_

## Completed

_(none — plan just scaffolded.)_
