# repo-structure-firstprinciples — PLAN

First-principles structure review + de-palimpsest spec for the polis monorepo. The review and spec are
preserved below as the rationale of record; **all four phases are now EXECUTED** (the Operator resolved
Fork 1 = collapse and opened the execution arc). Status mirror; task files live under state folders.
Charter: `AGENTS.md`.

## Status — ALL PHASES EXECUTED (P0–P3), green, merged to main

The first-principles review was empirically grounded against the live tree; findings verified, not
inherited. **Fork 1 was resolved by the Operator: collapse.** All phases landed on branch
`worktree-koine-depalimpsest` and merged to `main`:

- **P0 (de-palimpsest)** — stale agentir prose + dead cross-refs removed (residue ledger in its task).
- **P1 (koine collapse)** — `core` + `adapters` + `cli` collapsed into ONE package `@leclabs/koine`;
  they are now source areas under `src/`, exposed via subpath exports (`.` / `./core` / `./adapters/*`)
  plus a `koine` bin. No nested package.json remains under `packages/koine`.
- **P2 (episodic extraction)** — `@leclabs/koine-episodic` moved out to top-level `packages/episodic/`.
  Name kept (Fork 2's _rename_ to drop the `koine-` prefix stays Nico's [[signify]] call).
- **P3 (workspace + build coherence)** — `packages/*` flat glob, root tsconfig references reconciled,
  `.changeset` `fixed` emptied, agentir catalog crumb dropped, IR-fixture consumer path updated.

Proof: `pnpm build` + `pnpm test` (126 koine + 35 episodic) + `pnpm typecheck` + `pnpm lint` all green;
`koine --help` runs; subpath exports + bin resolve to built targets. See the execution ledger below.

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

### P0 — de-palimpsest (DONE — no fork dependency, Mav's call)

- **depalimpsest-naming-residue** (completed) — repo-wide scrape of stale/layered naming, the residue
  this review found. Independent of the structure decision; pure [[palimpsest]] cleanup. **Landed** on
  `worktree-koine-depalimpsest` (prose/config-comment only): stale "alignment pending" warnings removed
  from `packages/koine/AGENTS.md` + root `AGENTS.md`, README member-count + dead `COORDINATION.md`
  cross-ref fixed, `.scratchpad/` confirmed gitignored. Residue ledger in the task file.

### P1 — koine collapse (DONE — Fork 1 resolved = collapse)

- **spec-koine-collapse** (completed) — `core` + `adapters` + `cli` collapsed into one `@leclabs/koine`.
  Sources moved to `src/{core,adapters,cli}`; package-name imports rewritten to relative paths; merged
  `package.json` (union deps, `bin`, subpath `exports` `.`/`./core`/`./adapters/*`); single `tsconfig` +
  array `tsup.config` (lib dts + cli shebang). IR-fixture consumer path updated.

### P2 — episodic extraction (DONE — Fork 2 home settled; rename deferred to Nico)

- **spec-episodic-extraction** (completed) — `@leclabs/koine-episodic` moved to top-level
  `packages/episodic/` (Fork 2 option (a): move, keep name). `tsconfig` extends-depth fixed. Zero import
  impact (nobody imports it). The `koine-`-prefix _rename_ remains Nico's [[signify]] call and must
  reconcile with `memory-model-redesign`'s stated home.

### P3 — workspace + build coherence (DONE)

- **spec-workspace-glob-and-config** (completed) — flattened to `packages/*`; root `tsconfig`
  references → `packages/koine` + `packages/episodic`; `.changeset` `fixed` emptied; agentir catalog
  crumb dropped. Build/test/typecheck/lint green across both packages.

## Backlog (pending)

_(none beyond P1–P3 above.)_

## Completed

- **P0 · depalimpsest-naming-residue** — stale agentir "pending/re-homing" prose removed, README
  member-count + dead cross-ref fixed, `.scratchpad/` confirmed gitignored. Gates green.
- **P1 · spec-koine-collapse** — `core`+`adapters`+`cli` → one `@leclabs/koine`; sources under
  `src/{core,adapters,cli}`; subpath exports + `bin`; imports relativized.
- **P2 · spec-episodic-extraction** — `@leclabs/koine-episodic` → `packages/episodic/` (name kept;
  rename = Nico follow-up).
- **P3 · spec-workspace-glob-and-config** — `packages/*` glob, tsconfig refs, changeset `fixed`,
  catalog crumb. Build + test (126 + 35) + typecheck + lint all green; merged to `main`.

## Execution ledger (2026-06-18, branch `worktree-koine-depalimpsest`)

- **Layout:** `packages/koine/src/{core,adapters,cli}` (was three packages), `packages/koine/test/{core,
adapters,cli}`, `src/core/schema` + `src/core/scripts` (gen). `packages/episodic/` pulled out.
- **Proof of single package:** exactly two `package.json` under `packages/` — `@leclabs/koine` +
  `@leclabs/koine-episodic`; zero nested package.json under `koine`. `koine --help` runs; `.`/`./core`/
  `./adapters/<client>` exports + `bin` resolve to built `dist/` targets.
- **Gates:** `pnpm build`, `pnpm test` (koine 126 / episodic 35), `pnpm typecheck`, `pnpm lint` — all
  green on a fresh `pnpm install`.
- **Open follow-up (Nico):** rename `@leclabs/koine-episodic` to drop the `koine-` prefix ([[signify]]),
  reconciled with `memory-model-redesign`'s stated home — the one piece of Fork 2 not Mav's to decide.
