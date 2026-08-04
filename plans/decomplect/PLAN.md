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

**C0 comes first and dominates the rest.** The density gate reaches exactly three families that were
already dense by construction, and its empty ratchet states a COVERAGE claim as a CONFORMANCE one.
Its detector is length-normalized, so long prose is structurally unconvictable — the stance canon's
own judge prompt scores **0.90 per 100 against a threshold of 4**, 4.4× under by dilution, and is not
even in scope to be measured. Extend the reach and most of C1–C5 convict themselves.

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
