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
| build scripts → **0** | **6, and it must never be 0** — ARCHITECTURE licenses canon's build steps using the projector as a tool; 0 means canon cannot build itself                                                                                          |
| root → **0**          | **1** — `src/index.ts` takes `defineAgentPlugin` from forge. Whether `AgentPlugin` is a schema SHAPE or a forge resolver CONTRACT is an open ownership question, and answering it inside a refactor would smuggle a design decision |

**The real acceptance, now encoded in the gate:** cells **0** · build scripts **6** · root **1** ·
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

### Owed next, in order

1. **Amend `bin-name-single-home`**, then repair property 1. It pins the canon→runtime import; the
   repair is red until the counter-gate is a design decision made deliberately.
2. ▶ **READY — [`ready/t-runtime-capability-vocabulary.md`](./ready/t-runtime-capability-vocabulary.md).**
   The `schema → runtime` edge is **ratcheted, not licensed**, and that detection stands. **The remedy
   recorded here was refuted by census on 2026-08-05 and is replaced.** It read _"a shape the corpus
   authors against belongs in the shapes package, so the resolution is to move `RuntimePlugin`"_ — but
   schema does not consume `RuntimePlugin`, it consumes `keyof Omit<RuntimePlugin, 'name'>`, a **key
   set**. `RuntimePlugin` is typed over `MemoryStrategy` and `EventTapHost`, so moving it drags the
   **ports** into the shapes package — and the ports are the whole of what ARCHITECTURE assigns to the
   runtime. The defect is `shape ⊥ vocabulary`, exactly as `MODEL.md:22` already names it for `Event`,
   and it dissolves by naming the vocabulary in canon. Detection kept, remedy rejected.
3. **Rule on `AgentPlugin` — [`pending/t-agent-plugin-cut.md`](./pending/t-agent-plugin-cut.md), and
   the binary in the question is the wrong question.** Its seven fields split cleanly: `fragments`
   `agents` `skills` `hooks` are dirs the **resolver scans** (forge's mapping); `preamble` and
   `manifest` are **doctrine and which-dimensions-exist** (canon's, and ARCHITECTURE calls a dimension
   constitutive). One sign over two concepts — the same palimpsest species as `anatomy`, which is why
   the ownership question has no answer as posed. Blocked on #2: both write `schema/src/index.ts`
   and both retire a pin from the same ratchet, so they cannot share a wave.
4. **Concept A's surviving occupancy**, now the largest residue: `canon/src/anatomy.ts` still holds
   `MANIFEST` behind the retired sign (154 importers), and `FIXTURE_ANATOMY` survives at ~110 sites so
   call sites read `manifest: FIXTURE_ANATOMY`. Both were outside the enumerated rename set and were
   correctly left rather than assumed.

**The oracle command in Status is ✅ FIXED** — it now reprojects both targets and names the
`canon:project:codex` gap that made the old one half a proof.

**Before touching property 1** (canon ⊥ runtime), amend the counter-gate: `bin-name-single-home`
asserts the violating import STAYS. That is a design decision, not a repair, and it is not the
extraction's job.

**Regression oracle** — reproject BOTH targets first:

```sh
pnpm canon:project && pnpm canon:project:codex
```

`canon:project` alone writes only `.render-ts`, so against a stale codex render the hash below reads
the stale half and **still prints the expected value**. The root asymmetry that forced the codex leg
through `--filter` is gone (`t-build-steps-proxy-the-cli`): both legs are now proxies through
`cratylus project --harness <name>`. What survives is that `canon:deploy` runs `canon:project`
only, so **deploy never reprojects codex at all**. Then:
`find packages/canon/.render-ts packages/canon/.render-ts-codex
-type f | sort | xargs shasum | shasum` → `fe084dd1d531948979dc386713c3f688c96088ab`. Verified
deterministic across two reprojections. **It moved from `9055e88b…` when `a2205eb` changed the
founding doctrine, which rides into every SOUL — so a hash change is only a defect when nothing
intended to change the projected bytes.** Re-baseline deliberately, never silently.

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

## Open — ordered by how much of ARCHITECTURE they unblock

### 0. The cratylism sweep — [`CRATYLISM-SWEEP.md`](./CRATYLISM-SWEEP.md)

Six specs (C0–C5) plus three unassigned findings, every claim verified against the tree. Tests the
generalized `cratylism` that landed in `a2205eb` and finds it not honored, with one dominating
failure shape: **the correction was written into the prose and never into the sign.**

**C0 is ✅ LANDED (`979fa021`)** — it came first and dominated the rest. The gate's reach is now
**asserted**, not merely extended: every ρ=LLM class it owns must be witnessed by a real surface, so
the empty ratchet states conformance rather than coverage. Newly reached: rule bodies (`/AGENTS.md`,
the corpus's most widely-read emission, previously unscanned), rule and hook declarations, the
founding doctrine, and every agent vector — a class that was declared ρ=LLM and witnessed by nothing.
One conviction, fixed not pinned. Controls verified by injection.

**Its detector was NOT touched, and that is the finding.** Both halves of the filed normalization
complaint died under checking: raising the threshold false-positives the judge prompt (whose
second-person is agent-address and quoted specimens of the register it detects), and dropping the
signal false-negatives four of five genuine tutorials. Real tutorial prose runs 15–20 per 100 against
a threshold of 4; agent-address runs under 1.1. **The rate is a sound discriminator, not a proxy** —
tutorial register is constituted by density of address. See the sweep's `▶ MEASURED` block; the audit
trail is kept whole rather than rewritten to match the outcome.

**One part deferred**, as a model change rather than a test change:
[`pending/hook-message-has-no-declared-home.md`](./pending/hook-message-has-no-declared-home.md).

**C0 does NOT unblock C1–C5, and the claim that it did was this plan's ordering error.** Measured:
score **0 of 10**. The density predicate is `conform(cls, text)` — extending reach widens its domain,
it cannot change what is quantified, and every C1–C5 locus scores clean at whole-file grain. See the
sweep's `▶ THE SEQUENCING CLAIM IS FALSE`. Each item needs its own property and its own gate.

## The order — re-derived from measurement, 2026-08-04

A census measured, per naming/architecture property, whether a gate exists, how far it reaches, and
what total reach would convict. **The result reorders this plan.**

**The finding that outranks everything else: ARCHITECTURE's four load-bearing properties are enforced
by nothing** — no dependency-cruiser, no import lint, no CI; the one edge gate covers 4 files of one
direction. And **property 1, the highest-ranked, is not merely breached but PINNED**:
`src/hooks/memory-consolidation-nudge.ts:2` is a canon cell importing `@cratylus/runtime`, and
`test/bin-name-single-home.test.ts:57,101` asserts that it stays. **Repairing the architecture turns
the suite red.** Amending that counter-gate is a design decision and comes before the repair.

| #      | work                                                                                                  | why here                                                                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **1**  | ✅ **ground revised** — `anatomy`→`schema`, stale `28`→`34/22`, `MODEL:22` `⟨schema-owned⟩`           | hard blocker on §1; ground carrying a refuted sign is worse than source                                                                   |
| **2**  | **§1 extract `schema`** + `Anatomy`→`DimensionManifest`, `ANATOMY`→`MANIFEST`, `.anatomy`→`.manifest` | largest conviction volume by far — 25 of 34 canon→forge file edges, and `src/anatomy.ts` alone propagates to 142 dimensions and 10 agents |
| **3**  | **§2 vocabulary** — canon owns the 28 names, schema owns the `Hook` shape; land `vcs.commit.post`     | needs #2's package to exist; §1 is what hands §2 its cut                                                                                  |
| **3′** | **C1 residuals** — concept B (`anatomyRoot`, 10 files, `⊥`), concept C (`adapters/*/anatomy.ts`)      | independent of #2's type moves                                                                                                            |
| **4**  | **C5** `SOUL`→`Target` in forge                                                                       | same depalimpsest pass as 3′, 12 files                                                                                                    |
| **5**  | **C4** signify the anchor, derive `eventTap` mechanically, gate keyspace≡name≡dir≡verb≡skill          | needs its own ruling — **then fixes A12 for free**, which hard-codes `scripts/eventTap.mjs` in a canon cell                               |

**Parallel from day one, blocked by nothing:** C2 _(gate ✅ landed — `command-veracity`; the property
generalizes to ~45 more convictions across markdown links and source-comment path citations, not yet
covered)_ · C3 _(pure deletion — but **file the `coined` re-signification separately**, it does not
die with the generator)_ · `accept.ts:52`'s fifth `Kind` · **all three** `pending/` filings —
`hook-message-has-no-declared-home`, `elevate-installs-no-mechanism`, and
[`deployed-drifts-from-rendered-unwatched`](./pending/deployed-drifts-from-rendered-unwatched.md),
the last filed 2026-08-04 after a stale deployed SOUL ran superseded doctrine for a whole session
with every gate green.

**Deliberately last: §4 and A2/A5/A6** — not because they are small, but because **no property
convicts them**, so each needs its property stated first. A2 is a vocabulary-design task the size of
§2 and should be scheduled as one, not as a table row.

**Re-verify before scheduling: A9 appears already discharged by `a2205eb`** — `skills/signify/skill.ts`
now reads `Art ≜ every authored surface` and contains no harness path token.

**C1 interacts with §1 below** — if its argmin rejects `anatomy`, `ARCHITECTURE.md` must be revised
in the same act, because ground carrying a refuted sign is worse than source doing so.

### 1. Extract the meta-model — it leaves the projector

**The largest divergence, and the one the others are downstream of.** Canon's cells take **28 imports
from `@cratylus/forge/anatomy`** — the corpus depending on its own projector. ARCHITECTURE's
property 2 fails on exactly those 28.

**Do C1 first, or at least concurrently.** `ARCHITECTURE.md` calls the extracted package
`anatomy`, and C1's ruling is that `anatomy` is a metaphor binding two concepts and must be
re-signified. Extracting under a sign already ruled against would mint the defect into a package
name — the most expensive place to carry one.

The meta-model is [`MODEL.md`](../../MODEL.md) realized in types and belongs to neither package.
Extracting it lets meaning and projection stop referencing each other.

Keep the distinction that makes this tractable: canon's **build scripts** importing
`forge/{project,deploy,validate,module-scan}` is a corpus _built by_ forge and is fine. A **cell**
importing forge is a corpus _defined by_ forge. Only the second is the defect.

`completed/DIMENSION-OWNERSHIP.md` is the executed template — the same shape, one layer down, and its
hazards apply verbatim.

### 2. The lifecycle vocabulary — one home, and it is canon's

Declared twice today: forge's `CanonicalEvent` (schema-generated) and runtime's `LIFECYCLE_EVENTS`
(hand-authored). 28 members each, **identical set and identical order, agreeing by coincidence with
nothing enforcing it**, consumers fully disjoint — which is why it never surfaced.

`EVENT-VOCABULARY.md` carries the measurements and is **still correct on the defect, superseded on
the remedy**. It proposed base-in-runtime plus a corpus extension, to solve a dependency problem —
runtime is the dependency root and cannot import canon. **ARCHITECTURE dissolves that problem:
runtime receives corpus-specific facts as configuration the projection emitted**, exactly as a memory
strategy receives its backend selection. So the vocabulary is canon's outright: a lifecycle event is
a _name for a moment_, and naming is signification.

Two things to settle before moving anything:

- **Cold-verify the members.** Nine of 28 are realizable on no harness, in symmetric pairs
  (`model.request.pre`/`model.response.post`, `shell.exec.pre`/`shell.exec.post`,
  `mcp.exec.pre`/`mcp.exec.post`, `file.edit.post`/`file.read.pre`). That is the signature of
  enumeration, not discovery. **Unmapped ≠ fabricated** — canon may legitimately declare a moment it
  wants governed and let harnesses degrade — so the test is whether each names a real concept, not
  whether a harness fires it. Those are different questions.
- **`vcs.commit.post`** sits outside the union, hardcoded in forge, because a canon cell needed it and
  there was no seam. It is not a separate item; it is the same defect's other half.

### 3. Direction A — harness knowledge still in canon cells

**Verify placement before moving any of these.** At least one is filed on a string match rather than
analysis: `A7 dimensions/model/claude.ts` — the `model` dimension exists to pin which model an agent
runs on, and models _are_ vendor products. That is plausibly correct and not a defect at all.

| #   | what                                                         | where                                         |
| --- | ------------------------------------------------------------ | --------------------------------------------- |
| A2  | claude TOOL NAMES in a matcher                               | `hooks/stance-guardrail-pre.ts:21`            |
| A5  | `substrate ↦ claude` in the skill that AUTHORS cells         | `skills/create-agent/skill.ts:20`             |
| A6  | front-matter/`<name>.md` asserted as the authoring law       | `create-agent`, `create-skill`, `materialize` |
| A7  | `dimensions/model/claude.ts` — **probably not a defect**     | `dimensions/model/claude.ts`                  |
| A9  | the σ\*-register law quantifies over one harness's file tree | `skills/signify/skill.ts`                     |
| A10 | `timeout` on hook cells                                      | 4 cells                                       |
| A12 | `scripts/<capability>.mjs` — the projector owns that shape   | `wake`, `dream`, `handoff`, `event-tap`       |
| —   | `RUNTIME_BIN` in a cell — a cell naming the runtime's binary | `hooks/memory-consolidation-nudge.ts`         |

**A2 needs design, not a rename.** "Fire when the agent is about to ask or delegate" is a generic
intent expressed in claude's tool namespace. The generic form needs a canonical **tool-class
vocabulary** — the same move the lifecycle vocabulary represents, for tools. Sized accordingly.

### 4. Direction B — generic design still in forge

Same rule: verify placement first.

| #       | what                                                                   | where                                      |
| ------- | ---------------------------------------------------------------------- | ------------------------------------------ |
| B7      | memory-store seed PROSE (CoALA doctrine) authored in the deploy layer  | `deploy/seeds.ts` — its own TODO admits it |
| B11-B14 | σ\* register doctrine, `NO_PRIOR`, `HUMAN_MARKERS`, parsimony classes  | beside an empty `Policy` injection seam    |
| B16     | the SOUL body shape — harness-neutral by its own header                | `core/anatomy-body.ts`                     |
| B17     | `CANON_PACKAGE` — the projector names one corpus as the default design | `config/scaffold.ts`                       |

Also still claude-shaped in deploy: `deploy/seeds.ts`, `deploy/manifest.ts` `KIND_ROOT`,
`deploy/init.ts`.

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
