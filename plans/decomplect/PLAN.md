# decomplect — the source converges on ARCHITECTURE

> Working handle, cold-derived: the work is un-braiding **meaning · mechanism · projection**, which
> is what `decomplect` names. It was filed under `enforcing-fragment` for four shards after that
> shard finished — the directory had become a claim about its contents that was no longer true.

Read [`ARCHITECTURE.md`](../../ARCHITECTURE.md) before this file. It is the target; this is the route.
Every item below is a **divergence from it**, and an item that is not one does not belong here.

## Status

Suite green, 16 tasks — **canon 175** (23 files, +1 skipped) · **forge 215** (35) · **memory 255**
(16) · **runtime 52** (5) · **schema 9** (1). Render oracle
`0ac8e09fbbd40077f246d4774da60789cc8b3dbd`. Tree clean.

### Retired-tree deletion — 2026-08-05, operator instruction

**`plans/.retired/` is gone: 18 plans, 127 files, deleted wholesale** to cut the reading surface.
Nothing was retirable at the time — `decomplect` is the only in-scope plan and it is in-flight — so
this was the ALREADY-retired tree, not a retirement.

It is coherent with the ruling three hours earlier and stronger: the argument that chose _marking_
over _restoring_ was that the record was never destroyed, because git holds every byte. That applies
harder to deletion. What left the working tree is the reading cost, not the record; `git log --
plans/.retired/` still reaches all of it. 16 of the 17 `NAMES-RETROFITTED.md` notices went with it,
and the retrofit problem for those 86 files dissolved rather than being solved.

**Two gates had live subjects in that tree and neither may go silently vacuous:**

- `record-retrofit-notice` — roster 17 → 1. Its exonerating leg lost its live subject
  (`plans/decomplect/completed/` is now the only historical directory AND is the whole roster), so
  the property moved into the convicting fixture, where a synthetic corpus can always supply an
  untouched directory. A live leg there would assert over an empty set and read green for having
  nothing to look at.
- `plan-set` retirement-integrity — its scan returns `[]` for a missing root, which the FIXTURE needs
  and the live leg must not inherit. The live leg now REPORTS the absence instead of passing over it.

**▶ A canon contradiction this opens, surfaced and NOT resolved — it is not a cleanup's to make.**
The praxis cell defines `retire : P ↦ P' ≜ relocate dir(P) under plans/.retired/ ; post content(P') =
content(P)` (`canon/src/skills/praxis/skill.ts:159`), and `plan-set.ts` carries `RETIRED_DIR`. If
retirement is to mean DELETION, that law is false as written and the mechanism is misnamed. If it
still means relocation, then this deletion was a one-off cleanup and `.retired/` will simply be
recreated by the next `retire`. **Both are defensible; the canon currently asserts the first is
wrong.** Filed as [`pending/retire-relocates-but-the-operator-deletes.md`](./pending/retire-relocates-but-the-operator-deletes.md).

### Wake sync — 2026-08-05, after the workspace directory was renamed

**The host broke, the repository did not, and nothing here could have told the difference.** The
`RUNTIME_BIN` on `PATH` was a `pnpm link --global` symlink into `workspaces/<old-dir>/`; the rename
stranded it, and every deployed shim died in the node module loader before a capability-level message
could be produced. **Two staleness layers were stacked** — the stranded link, and deployed shims
still spawning the pre-migration bin name. Filed as
[`pending/the-host-install-is-a-symlink-nobody-authored.md`](./pending/the-host-install-is-a-symlink-nobody-authored.md);
it is the second live witness for
[`pending/deployed-drifts-from-rendered-unwatched.md`](./pending/deployed-drifts-from-rendered-unwatched.md),
which is now **promoted to `ready/`** on the strength of it.

**`ready/` was carrying two shards whose work had already landed** — the same
`state ≠ truth` drift the 2026-08-05 praxis sync repaired once, recurring because completion is a
`git mv` nothing performs automatically.

- **[`t-build-steps-proxy-the-cli`](./completed/t-build-steps-proxy-the-cli.md) → completed.** All
  five acceptance legs verified independently at wake: no `project-cli*.ts` survives,
  `agents.config.ts` is at the root, neither root script names `tsx src/toolkit/project-cli` or
  `dist/cli/index.js`, both `canon:project*` legs proxy `cratylus project --harness <name>`, suite
  green.
- **`t-config-filename-carries-the-retired-brand` STAYS in `ready/`, and it is BLOCKED.** Its
  one-home constraint is met — `CONFIG_FILE`, `CONFIG_ENV` and the precedence chain now have a single
  home at `memory/src/node.ts:306-311`. Its **derivation leg is unpaid**: the shard says in bold that
  the name is not derived and forbids assuming one, and no round-trip against `.cratylus-run.json`
  exists anywhere in the tree. Worse, the sweep that picked the name **rewrote the shard**, so it now
  argues that the live brand is the retired one. It cannot be executed as written.

**The brand sweep rewrote 99 files of historical record** — 86 under `plans/.retired/`, 13 under
`decomplect/completed/` — including every artifact whose subject _is_ the retired name, and it
renamed a whole retired plan **directory** (`agent-runtime/` → `runtime/`), so the plan that argued
about a name now sits at a path named for the answer. This file's own discipline (_"a record edited
to match today is no longer a record"_) was honored by the re-baseline four commits earlier and lost
to the sweep that followed, because it lived in prose and the sweep's criterion lived in a script.

**Ruled and executed — branch 2, marked rather than restored**, argued in
[`completed/the-brand-sweep-rewrote-the-record-not-only-the-source.md`](./completed/the-brand-sweep-rewrote-the-record-not-only-the-source.md).
The record was never destroyed — `61b85db7^` holds every original byte — so what the sweep took was
the reader's knowledge that a substitution happened, and a pointer restores exactly that at no cost
to the property the operator accepted. 17 `NAMES-RETROFITTED.md` notices now sit in the affected
directories, each naming the sweep and carrying a `git show` that resolves. The gate is
`canon/test/record-retrofit-notice.test.ts`, convicting **and** exonerating, all four legs proven red
by injection. **`fetch-depth: 0` in CI is load-bearing** — the default shallow clone made the
history leg unable to look while still reading green.

**I published "108 of 115" first and it was wrong** — it double-counted the nine pre-rename path
entries of the directory move. Recorded because the shard is _about_ records that no longer say what
happened, and correcting it silently would have been the same defect one level up.

**Forge reads 215 where this file long said 224, and the drop is a MOVE, not a loss**: `215 + 9 = 224`
— the nine tests left forge with `schema` in `48baaddd`. Recorded because a falling test count
is otherwise indistinguishable from tests going dark.

**Act 1 ✅ LANDED (`3bd40eac`) — `test/architecture.test.ts`.** The four load-bearing properties are
enforced for the first time. 26 breaches pinned, shrink-only; 25 retire when §1 lands. The exact-count
leg measured **22 cells · 9 licensed build scripts · 3 root · 1 property-1 breach**, independently
confirming that ARCHITECTURE's long-carried "28" was never measured.

The gate's name came from this corpus's own precedent (`cratylism.test.ts` is named for the principle
it enforces) after five cold legs failed to find a quality-noun — the best returned
`import-acyclicity`, which is **wrong**: canon importing runtime introduces no cycle and is still
forbidden, so that sign names a weaker property than the law.

**The names landed (`49516a6f`) — the scope is `@cratylus/*`.** The discipline is **latent
lexicography**; the instrument is **Cratylus**. This closes the `⊥` README has carried since
2026-07-26, when `semantic engineering` was disconfirmed and the derivation returned no anchor.

Six packages and their directories moved; the `agent-` prefix is gone from every package name because
the scope now carries the domain. `invoke` → `@cratylus/invoke`, folding in
`pending/invoke-is-not-what-it-is-named.md` rather than renaming twice — the whole forward slate
died on blind decode and `invoke` won on a property no noun had: **a verb decodes as a leaf**.

**No bin moved, deliberately.** `forge` and `runtime` are now the only artifacts wearing
the retired prefix — filed as `ready/t-bin-name-migration.md` with the naming explicitly underived,
because `PATH` is a global unscoped namespace and needs its own round-trip. A sweep did silently
rename forge's `bin` key; the suite caught it and it was reverted.

**Render oracle re-baselined `fe084dd1…` → `f60e936a172d6f37a5120cd9dd0e282c19727f58`**, both targets.
The delta was **proven, not assumed**: HEAD was rebuilt in a detached worktree, reproduced `fe084dd1`
exactly at 37/38 files, and diffed. Five files, three lines, all generated header prose naming the
packages. No structural change, and all 18 `runtime` occurrences in the renders unchanged — the
bins held. Historical citations of `fe084dd1` were left alone, as were `plans/.retired/` and
`completed/`: a record edited to match today is no longer a record.

**MVP publish-readiness ✅ (2026-08-05).** The architecture ratchet is **26 → 1**. Both remaining
API-surface shards landed, each retiring its pin **by repair rather than exemption**, and the render
oracle did not move for either — the same structural proof the `schema` extraction earned.

- **`t-runtime-capability-vocabulary`** — the `schema → runtime` edge is gone and `RuntimePlugin`
  never moved. Schema states only that a capability has a name; canon declares the members. The
  shard's own proposed remedy stayed refuted.
- **`t-agent-plugin-cut`** — `AgentPlugin`/`defineAgentPlugin` moved to the schema, retiring the last
  **property-2** breach. There was no ownership question: the contract imported one type from the
  schema and the factory is `(plugin) => plugin`. Half the cut is **⊥** — `preamble` and `manifest`
  are NOT grouped, because the only thing they share is having to travel, and grouping by a lifecycle
  property is how `anatomy` became a palimpsest.

**The one surviving ratchet entry is property 1's pinned breach** — the only one that cannot be
repaired by refactoring, because `bin-name-single-home.test.ts` REQUIRES the import. Amending a
counter-gate is a design decision owed before the repair.

**The gates themselves were the bigger finding.** `typecheck:test` was unwatched, the render oracle
existed only as prose in shard acceptance lines, and there was no CI at all — every green claim was a
claim about somebody's laptop. All three are now real, and the first genuine cold-clone run found
**four** further defects the warm tree had been hiding, including that the installer never creates a
workspace bin symlink when `dist/` is absent at install time.

**Act 2 ✅ LANDED (`48baaddd`) — `schema` exists.** Canon **cells** importing the projector:
**22 → 0**. Render oracle unmoved at `fe084dd1d531948979dc386713c3f688c96088ab` — the proof the change
was structural and altered no meaning. Suite green uncached, 9 tasks. Architecture ratchet **26 → 3**.

**Two of the four acceptance numbers I wrote were WRONG, and the delegates refused them rather than
contorting the tree to fit.** Recorded because the correction is the lesson:

| I wrote               | truth                                                                                                                                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| build scripts → **0** | **4, and it must never be 0** — ARCHITECTURE licenses canon's build steps using the projector as a tool; 0 means canon cannot build itself                                                                                          |
| root → **0**          | **1** — `src/index.ts` takes `defineAgentPlugin` from forge. Whether `AgentPlugin` is a schema SHAPE or a forge resolver CONTRACT is an open ownership question, and answering it inside a refactor would smuggle a design decision |

**The real acceptance, now encoded in the gate:** cells **0** · build scripts **4** · root **0** ·
property-1 breaches **1**. An acceptance criterion that contradicts the ground it claims to enforce is
worse than none — it converts a correct refusal into an apparent failure.

### Praxis sync — 2026-08-05

`state` was **not** `truth`, in three ways, all now repaired:

- **`frontier(P) = ∅` while `bound(P) ∧ sharded(P) ∧ ¬done(P)`** — the plan was bound with nothing
  `ready` and nothing `active`, which that law forbids. The cause is structural and worth naming:
  `file` writes a stub to `pending/` with **no census and no re-slice**, so a filed defect has no
  edge in `R` and can never be reached by `promote`. Filed stubs are therefore invisible to the
  frontier while still counting against `done(P)`. Only `upsert` gets them out. **The plan's whole
  work list lived as prose in this mirror rather than as task-files** — and `(state, R, content) ≽
PLAN.md`, so the mirror was carrying the state instead of reflecting it.
- **This file said "both `pending/` files" when there were three** (now five, with two filed today).
- **The Status counts were stale**, and the stalest one — forge 224 → 215 — reads as nine lost tests
  unless the move to `schema` is recorded beside it.

Surfaced and NOT fixed, because it is the operator's:
[`pending/vision-still-carries-the-enumeration-cratylism-dropped.md`](./pending/vision-still-carries-the-enumeration-cratylism-dropped.md).
`VISION.md:127` still enumerates _"anchors, dimensions, skills, agents, files, and directories"_ —
the reach `a2205eb` generalized out of `cratylism`. The apex triad must stay mutually consistent, and
`CANON.md` says a VISION conflict is surfaced, never unilaterally edited.

### Owed next — the work list left this file

**`(state, R, content) ≽ PLAN.md` — and this mirror was violating it.** The plan's work list lived
here as prose while `ready/` sat near-empty, which is the exact defect the 2026-08-05 praxis sync
named and did not finish repairing. **It is now task-files.** Read
[`praxis frontier`](./ready/), not this section.

**Before dispatching anything, read [`CENSUS-2026-08-05.md`](./CENSUS-2026-08-05.md).** Four
independent readers re-measured every open item against the tree. **Seven items are dead** —
discharged, refuted, or superseded — and several survivors are not the defect they were filed as.
Executing the old list would have produced motion without value.

|                |                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| **`ready/`**   | **12 shards with a determinate target today.** No ruling owed; dispatchable now                          |
| **`pending/`** | **21 shards blocked on a ruling that is not an executor's** — a mint, a ground revision, or a design cut |

**The single largest thing in `pending/` is `t-worker-payload-seam-and-property-1`** — it merges the
homeless-hook-message shard into the property-1 ruling, because the census established they are one
question wearing two filings. It is the last entry in the architecture ratchet and the only breach
that cannot be repaired by refactoring.

## Sequence — R and the waves

<!-- GENERATED from ./spec.mjs by ./sync-shards.mjs. Edit the spec, not this section. -->

Computed, not asserted: `wave(0) ≜ { t | ∄ u : (t,u) ∈ R }`, and each later wave is what its
predecessors unblock. `packages/canon/test/praxis-execution-spec.test.ts` proves every wave
satisfies the concurrency precondition — no two members write the same file, and none writes a
file another compiles against — so **a wave can be fanned out with no isolation**.

`~~struck~~` = a RULING is owed. It sits in its wave but is not dispatchable; the count beside it
is what can actually be sent.

| wave  | shards | dispatchable | members                                                                                                                                                                                                                                                                                                                                                                     |
| ----- | ------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0** | 7      | 7            | `retire-relocates-but-the-operator-deletes` · `spec-arrays-can-silently-truncate` · `t-memory-config-scope-is-incoherent` · `t-shim-path-from-capability` · `t-soul-to-target-in-forge` · `t-tap-anchor` · `t-worker-payload-seam-and-property-1`                                                                                                                           |
| **1** | 11     | 11           | `bin-name-gate-stops-at-the-language-boundary` · `project-never-cleans-its-out-dir` · `t-accept-fifth-kind` · `t-coined-classification` · `t-definiens-vs-residue` · `t-init-hardcodes-harness-dir` · `t-kind-root-ignores-agent-ext` · `t-policy-seam-unused` · `t-project-human-vs-engine` · `t-seed-prose-has-drifted` · `the-host-install-is-a-symlink-nobody-authored` |
| **2** | 8      | 7            | `deployed-drifts-from-rendered-unwatched` · `memory-nudge-is-flaky-under-the-full-verify` · `t-canon-soul` · `t-classification-wears-three-signs` · ~~t-engine-internal-names-await-decode~~ · `t-kind-is-triple-booked` · `t-projection-file-anchor` · `t-rule-cell-body`                                                                                                  |
| **3** | 2      | 2            | `t-harness-adapter-surface-is-genus-and-species` · `t-lifecycle-vocabulary`                                                                                                                                                                                                                                                                                                 |
| **4** | 2      | 2            | `elevate-installs-no-mechanism` · `t-tool-class-vocabulary`                                                                                                                                                                                                                                                                                                                 |

**Slices** — a partition, 8 of them, cut to minimize cross-slice edges in `R`:

- `corpus-rename` (5) — `t-manifest-file-basename` · `t-canon-package-default` · `t-policy-seam-unused` · `project-never-cleans-its-out-dir` · `t-ground-numbers-are-unmeasured`
- `plan-machinery` (5) — `t-anatomy-root-compose` · `retire-relocates-but-the-operator-deletes` · `t-coined-classification` · `elevate-installs-no-mechanism` · `spec-arrays-can-silently-truncate`
- `skill-cells` (5) — `t-shim-path-from-capability` · `t-substrate-concept` · `t-authoring-surface` · `t-canon-soul` · `t-classification-wears-three-signs`
- `projection-and-ground` (4) — `t-soul-to-target-in-forge` · `t-seed-prose-has-drifted` · `t-project-human-vs-engine` · `t-accept-fifth-kind`
- `deploy-surface` (5) — `t-kind-root-ignores-agent-ext` · `t-init-hardcodes-harness-dir` · `deployed-drifts-from-rendered-unwatched` · `t-signify-marker` · `t-engine-internal-names-await-decode`
- `event-vocabulary` (5) — `t-capture-row` · `t-tap-anchor` · `t-lifecycle-vocabulary` · `t-projection-file-anchor` · `t-harness-adapter-surface-is-genus-and-species`
- `cell-contract` (6) — `t-worker-payload-seam-and-property-1` · `t-definiens-vs-residue` · `t-rule-cell-body` · `t-tool-class-vocabulary` · `bin-name-gate-stops-at-the-language-boundary` · `t-kind-is-triple-booked`
- `host-and-config` (4) — `t-config-dotfile-was-shipped-underived` · `the-host-install-is-a-symlink-nobody-authored` · `memory-nudge-is-flaky-under-the-full-verify` · `t-memory-config-scope-is-incoherent`

## Landed

| what                                                                                               | commit                                     |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Enforcing fragments carry their own events; scope derived from composition                         | `c5e84fc` `fb49ee2` `fd3e3f3` `3cab6a0`    |
| `realizable` split into fire-ability vs agent-scopability                                          | `36e3ef6`                                  |
| A harness that cannot mechanize a constraint DEGRADES and warns — it never refuses                 | `e8f103c`                                  |
| `HookCell` retired; the invocation left the cell; **codex stopped running ungoverned**             | `b162a80`                                  |
| Deploy asks the adapter for `home`/`agentExt`/`hooksFile`; `--harness codex` works                 | `6925845`                                  |
| **The corpus owns its dimension catalog** — proven by adding one with zero forge edits             | `29f1185` `045485d` `b903c75` `fb944d2`    |
| The test layer stopped coupling forge to canon's content                                           | `b486803` `d83488b5` `082566f0` `ef06a3e2` |
| cratylism generalized to every authored surface; the intrinsic carry stopped naming this workspace | `a2205eb`                                  |

Detail and the corrections made during execution live in `completed/`.

## Open — the sections that used to live here

**Deleted, not lost.** `## Open`, `## The order`, `### 1. Extract the meta-model`, `### 2. The
lifecycle vocabulary`, `### 3. Direction A` and `### 4. Direction B` carried this plan's work list as
prose for as long as the plan has existed. Every item in them has been re-measured and re-filed as a
task-file under `ready/` or `pending/`, each carrying its own census evidence and, where one is owed,
the ruling that blocks it.

They are recoverable at `git show a500cf1c:plans/decomplect/PLAN.md`. They are not reproduced here,
because two homes for one work list is how the frontier went stale twice in one day.

**What the sections got wrong, in summary — the detail is in the census:**

- **Direction A lost three of eight rows outright** (`A7`, `A9`, `A10`) and a fourth split and lost a
  member (`A6`/`materialize`). Of the four survivors, only `A12`'s `memory` half is mechanical.
- **Direction B lost `B16`** and had `B11–B14`'s premise corrected: the `Policy` seam is **not
  empty** — it has 3 members, a corpus-side supplier, and 17 live call sites.
- **`### 2`'s duplication is schema-vs-runtime now**, not forge-vs-runtime, which changes the remedy:
  ARCHITECTURE has no edge between those two in either direction.
- **`### 1`'s numbers were wrong** — 177 importers, not 154; 75 `FIXTURE_ANATOMY` sites, not ~110,
  which was never measured at all.
- **`CRATYLISM-SWEEP.md`'s C6 is OVERTURNED** and the sweep does not say so. `49516a6f` minted the
  brand it recorded as `⊥` — **and the ⊥ was ruled without testing the candidate that won.**

`CRATYLISM-SWEEP.md` and `EVENT-VOCABULARY.md` are kept as the record of what was believed when they
were written. Where they disagree with the census, **the census is what is true.**

## Method — what this shard has learned

- **State the PROPERTY, never a string that correlates with it.** A `grep returns nothing` check
  cost a delegation before being refused as a proxy. The property here is behavioural: _add a
  dimension to canon and forge's suite stays green._
- **Verify placement for the whole set BEFORE moving any of it.** Bulk moves are correct; bulk moves
  on unverified assumptions are not. The byte-identity oracle works the same for a large move.
- **Half-parameterizing is worse than neither** — the half that still works produces plausible output
  masking the half that does not.
- **A defaulted parameter that is accepted and ignored passes every byte-identity check there is.**
  Prove the thread is live, separately.
- **Delegate with the clause that makes refusal possible**: _a workaround here is a design decision
  and that is not yours on this task._ Every high-value finding in this shard came from an agent
  refusing an instruction rather than satisfying it.
