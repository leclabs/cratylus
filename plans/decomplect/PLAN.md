# decomplect — the source converges on ARCHITECTURE

> Working handle, cold-derived: the work is un-braiding **meaning · mechanism · projection**, which
> is what `decomplect` names. It was filed under `enforcing-fragment` for four shards after that
> shard finished — the directory had become a claim about its contents that was no longer true.

Read [`ARCHITECTURE.md`](../../ARCHITECTURE.md) before this file. It is the target; this is the route.
Every item below is a **divergence from it**, and an item that is not one does not belong here.

## Status

Suite green — forge 224 · canon 159 · memory 255 · runtime 52.

**Regression oracle:** `find packages/agent-canon/.render-ts packages/agent-canon/.render-ts-codex
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
`src/hooks/memory-consolidation-nudge.ts:2` is a canon cell importing `@leclabs/agent-runtime`, and
`test/bin-name-single-home.test.ts:57,101` asserts that it stays. **Repairing the architecture turns
the suite red.** Amending that counter-gate is a design decision and comes before the repair.

| #      | work                                                                                                        | why here                                                                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **1**  | ✅ **ground revised** — `agent-anatomy`→`agent-schema`, stale `28`→`34/22`, `MODEL:22` `⟨schema-owned⟩`     | hard blocker on §1; ground carrying a refuted sign is worse than source                                                                   |
| **2**  | **§1 extract `agent-schema`** + `Anatomy`→`DimensionManifest`, `ANATOMY`→`MANIFEST`, `.anatomy`→`.manifest` | largest conviction volume by far — 25 of 34 canon→forge file edges, and `src/anatomy.ts` alone propagates to 142 dimensions and 10 agents |
| **3**  | **§2 vocabulary** — canon owns the 28 names, schema owns the `Hook` shape; land `vcs.commit.post`           | needs #2's package to exist; §1 is what hands §2 its cut                                                                                  |
| **3′** | **C1 residuals** — concept B (`anatomyRoot`, 10 files, `⊥`), concept C (`adapters/*/anatomy.ts`)            | independent of #2's type moves                                                                                                            |
| **4**  | **C5** `SOUL`→`Target` in forge                                                                             | same depalimpsest pass as 3′, 12 files                                                                                                    |
| **5**  | **C4** signify the anchor, derive `eventTap` mechanically, gate keyspace≡name≡dir≡verb≡skill                | needs its own ruling — **then fixes A12 for free**, which hard-codes `scripts/eventTap.mjs` in a canon cell                               |

**Parallel from day one, blocked by nothing:** C2 _(gate ✅ landed — `command-veracity`; the property
generalizes to ~45 more convictions across markdown links and source-comment path citations, not yet
covered)_ · C3 _(pure deletion — but **file the `coined` re-signification separately**, it does not
die with the generator)_ · `accept.ts:52`'s fifth `Kind` · both `pending/` files.

**Deliberately last: §4 and A2/A5/A6** — not because they are small, but because **no property
convicts them**, so each needs its property stated first. A2 is a vocabulary-design task the size of
§2 and should be scheduled as one, not as a table row.

**Re-verify before scheduling: A9 appears already discharged by `a2205eb`** — `skills/signify/skill.ts`
now reads `Art ≜ every authored surface` and contains no harness path token.

**C1 interacts with §1 below** — if its argmin rejects `anatomy`, `ARCHITECTURE.md` must be revised
in the same act, because ground carrying a refuted sign is worse than source doing so.

### 1. Extract the meta-model — it leaves the projector

**The largest divergence, and the one the others are downstream of.** Canon's cells take **28 imports
from `@leclabs/agent-forge/anatomy`** — the corpus depending on its own projector. ARCHITECTURE's
property 2 fails on exactly those 28.

**Do C1 first, or at least concurrently.** `ARCHITECTURE.md` calls the extracted package
`agent-anatomy`, and C1's ruling is that `anatomy` is a metaphor binding two concepts and must be
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
