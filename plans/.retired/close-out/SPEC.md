# SPEC — the memory system's architectural remedy

> **EXECUTED AND RETIRED (2026-07-26).** This is the spec as authored; the three shards it emitted
> all landed and now sit in [`completed/`](./completed/), not `pending/`. Where the text below says a
> thing "will" be done, read it as done — the diagnosis is preserved verbatim because the reasoning
> is the point, but do not read it as a work list.
>
> **Shipped, against this spec:** `STORE_WATERMARK` **16 000 → 8 000** (M1, corpus-derived: the only
> round value between the largest clean store at 4 379 B and the complained-about one at 15 969 B);
> the asymmetric predicate with its strict-shrink escape, enforced at BOTH write paths — `appendToHome`,
> `replaceGuarded`, and `AgentMemory.replace`, which was found bypassing the ceiling M1 installed;
> the cell↔roster gate (M3); and the pressure seam (M2), whose replace law was swept against the real
> `refusesReplace` over a `(before, after)` grid with **zero divergence**.

> S3's deliverable. Authored 2026-07-26 against `R1-findings.md` + the post-V2/V3 code.
> Reader = LLM. Every decision carries a reason and a citation (`R1 §Qn` or `path:line`).
> **Mirror note:** the PLAN.md slice-table update is the parent's act, not this file's.

---

## 0 · The headline, before the decisions

**R1 is right, and the live corpus confirms it harder than R1 could.** The operator's symptom set
— procedural bloat, duplicate memories, memories restating the projection — is **one defect, not
three**. Measured today:

| measurement                                                             | value               | consequence                                      |
| ----------------------------------------------------------------------- | ------------------- | ------------------------------------------------ |
| `nico/PROCEDURAL.md` bytes vs `STORE_WATERMARK` (`audit.ts:74`)         | **15 969 / 16 000** | the bound exists and **has never fired**         |
| `scanLine` (`audit.ts:177`) markers in those 103 lines                  | **0**               | mechanical scope test yields **0%** on the bloat |
| distinct entry keys in `nico/PROCEDURAL.md` · exact duplicates          | **65 / 0**          | nothing to dedup on, because there are no dups   |
| exact + normalized duplicate bodies across all 46 live+archived records | **0**               | record↔record duplication does **not occur**     |
| recall of a normalized-exact key on the one real dedup event¹           | **0 / 3**           | rung 1 of R1's ladder has **zero yield here**    |
| oldest live EPISODIC record                                             | **0.07 d**          | EPISODIC is healthy; no staleness problem        |
| `routes` stamps present on live records (`record.ts:32-37`)             | **0 / 46**          | filed, not specified — see `x-routes-stamp-…`    |

¹ `mav/EPISODIC.jsonl.bak-dedup` vs current: 3 of 14 records removed by hand. None had a textual
twin still resident — all three were records whose content had been **promoted into an artifact**
(a `DECISION+RATIONALE` that became PLAN.md prose; a `MECHANISM LEARNED` that became a cell law).

So: `nico/PROCEDURAL.md` contains **65 individually-correct, genuinely-generalized, non-duplicated,
scope-clean entries**. No admission test of any kind would have refused a single one of them at the
moment it was written. This is exactly R1 §Q3's verdict — _"not a classification failure; an
unbounded-container failure"_ — and it is now measured on this corpus rather than inferred from
prior art.

**One consequence the prior art did not supply, visible only in the corpus.** Absent a bound, the
store did not stay uncompressed — the agent hand-compacted it. `nico/PROCEDURAL.md:102` carries
five distinct laws crammed onto one line separated by `·`; `:39` and `:52` likewise. That is lossy
compaction performed under implicit pressure, with no eviction decision ever taken — and the store's
own law names the damage: _"A merged set looks CLEAN because the distinctions are gone"_ (`:30`).
**An explicit bound is therefore not merely a size control; it converts silent lossy merging into a
visible eviction decision.** That is the strongest argument for Letta's mechanism, and it is this
repo's, not R1's.

---

## Decision 1 — Write-time signal: **NO. Not even the demoted scalar.**

**`tags` stays barred from routing. `record.ts:26` is unchanged and affirmed. No new public field
is minted, so no cratylism gate is opened.**

**Reason.** R1 §Q5 refuses the hypothesis in its strong form and the evidence is one-sided: a
writer-declared category _regresses 50 points below plain string matching_ on prefix collisions
(82% → 31%), buys ~5.5 aggregate points over pure mechanism, taxes every write, and is taken with
strictly less information than the drain has (R1 §Q2, §Disconfirming 1-8). R1 concludes the
contractual ban on `tags` routing is **vindicated, not indicted**. This spec adopts that verdict
without reservation.

**Where this spec goes further than R1, and why.** R1 §Q5 recommends keeping the channel open in a
demoted form — a cheap non-authoritative scalar shaped like Generative Agents' poignancy integer.
**Declined.** The scalar's only demonstrated use in the survey is _accumulate-and-threshold to
schedule consolidation_ (R1 §Q3: Park et al., threshold 150). **This repo already has that trigger,
deterministically and for free**: `consolidationOwed` (`strategy.ts:430-435`) fires on any of
backlog ≥ `BACKLOG_WATERMARK` (`audit.ts:81`), store pressure, or scope findings. A poignancy scalar
would be a fourth trigger measuring approximately what the backlog count already measures, at the
cost of a per-write judgement and a new public field. R1 surveyed prior art; it did not have this
repo's existing trigger in view when it kept the channel open.

**Reversal condition, stated so the refusal is falsifiable.** If a scheduling need arises that
backlog ∧ pressure ∧ purity provably do not serve, the scalar is the correct shape to add, and its
field name is a **cratylism act — gated, not coined here**.

**Cost of being wrong.** Low and recoverable. A scalar can be added later to new records without
touching old ones (the schema is open — `record.ts:15` "minimal and **open**"). Refusing it now
costs nothing that cannot be bought back.

---

## Decision 2 — The deterministic / inference split

The operator's stated failure mode is fleeing to mechanism. Two refusals are recorded below the
table for exactly that reason; both were tempting and both are wrong.

| routing decision                     | side    | site                      | why this side                                                       |
| ------------------------------------ | ------- | ------------------------- | ------------------------------------------------------------------- |
| `node(cwd, host)` — provenance       | **DET** | `node.ts:172`             | a filesystem fact; never reasoned (`node.ts:18-22`)                 |
| vanished-cwd ↦ `legacy`              | **DET** | `node.ts:216`             | an existence test; V3's landed fix                                  |
| `project-referential(i)`             | **DET** | `audit.ts:177` `scanLine` | fixed regex classes + explicit repo-key list; V3's exonerating case |
| store over ceiling                   | **DET** | `audit.ts:233`            | a byte count                                                        |
| **ceiling refusal at the write**     | **DET** | **M1 → `dream.ts:31`**    | a byte count; new — see Decision 3                                  |
| backlog owed                         | **DET** | `strategy.ts:432`         | a record count                                                      |
| `identity(i)` ∨ `agent-intrinsic(i)` | **INF** | cell `skill.ts:37`        | irreducibly semantic                                                |
| `generalized-wisdom(i)`              | **INF** | cell `skill.ts:38-39`     | induction past the instance; no string test exists                  |
| `projection-carries(i)`              | **INF** | cell `skill.ts:40`        | _carries_ means conveys the content, not shares the tokens          |
| `canon-truth(i)`                     | **INF** | cell `skill.ts:29`        | a remit judgement over the fleet                                    |
| `next-step(i)`                       | **INF** | cell `skill.ts:41`        | tense + intent, not form                                            |
| **WHAT to evict at the ceiling**     | **INF** | the dream agent           | a value judgement over 65 correct entries — see Decision 3          |
| near-duplicate / restatement         | **INF** | the dream agent           | measured: no mechanical rung fires — see Decision 4                 |

**Refused mechanization #1 — `projection-carries(i)` by grep.** Tempting: the projections are on
disk, so "does the projected corpus already say this?" looks like a substring search. It is not. A
record restating `.cratylus.config` in its own words shares no distinctive token with the
config. A grep here is a **false-negative machine** that would license exactly the restatement R1
§Live-corpus-facts measured in `mav/SEMANTIC.md`. This stays inference.

**Refused mechanization #2 — an admission test keyed on the entry-slug convention.** `nico`'s
entries lead with a ``**`slug`**`` key — 65 of them, a usable normalized name. Measured across the
other stores: **0 slugs in `mav/PROCEDURAL.md`, 0 in either `SEMANTIC.md`**. It is one agent's
private writing habit, not a store convention. Mechanizing on it would gate the corpus on a
stylistic accident. Refused.

**What this table asserts, in one line:** every _quantity_ is mechanical and every _judgement_ is
inferential, and the two sets do not currently overlap anywhere. The remedy adds exactly one row to
the DET side (the ceiling refusal) and moves nothing from INF to DET.

---

## Decision 3 — The admission test for `PROCEDURAL` _(the highest-value decision)_

### 3a — There will be no admission test. Stated plainly.

**No quality gate on the write.** Not prose, not mechanism, not inference.

**Reason, in three parts, each grounded.**

1. **No shipped system has one, and the most-deployed one argues against it.** mem0's extraction
   prompt, verbatim: _"When in doubt, extract. A slightly redundant memory is far less costly than a
   missing one."_ Zep computes a relevance rating at ingest and still refuses to gate admission on
   it — it is a _retrieval_ filter (`min_fact_rating`). Anthropic's memory tool has no gate and
   explicitly delegates the concern to the integrator as _"cap how large a file can grow"_
   (R1 §Q3).
2. **The mechanical test the shard asked me to consider yields zero here.** S3 asked: can admission
   be mechanized, even partially, using `audit.ts:177 scanLine()`? **Measured answer: no — 0 markers
   across 103 lines of the bloated store.** That is not a weakness in `scanLine`; it is proof that
   the content is genuinely in-scope. There is nothing for a purity predicate to reject.
3. **Prompt-only admission control is the regime this repo is already in, and it is the documented
   failure.** The cell carries a prose bar — `generalized-wisdom(i) ∧ ¬projection-carries(i)`
   (`skill.ts:39`) — which is precisely the "add a prompt telling it to stay organized" remedy R1
   §Q3 identifies as known-insufficient _by its own vendor's need to suggest it_. Writing a better
   prose bar is doing the failing thing more emphatically.

**This is the point where fleeing to mechanism would happen, and the honest answer is that the
admission judgement is genuinely semantic and must stay with the agent.** The correct response is
not to mechanize the judgement but to **bound the container the judgement writes into** — which is
fully mechanical, and which the code already half-implements.

### 3b — What replaces it: an **enforced** ceiling with a strict-shrink escape

Three parts. Each is small, each cites a live line.

**(i) The bound already exists and is set above the observed bloat.** `STORE_WATERMARK = 16_000` at the time of writing; recalibrated to `8_000` by M1
(`audit.ts:74`); `nico/PROCEDURAL.md` is 15 969 bytes. The audit reports it **clean right now**. The
one file the operator names as bloated sits at 99.8% of the watermark and raises no signal.

_Recalibrate to 8 000 bytes, derived from the corpus bracket, not chosen:_

| store                       | bytes      | at 8 000 |
| --------------------------- | ---------- | -------- |
| baseline seeded agents (×8) | 470 – 496  | clean    |
| `mav/PROCEDURAL.md`         | 4 289      | clean    |
| `mav/SEMANTIC.md`           | 4 379      | clean    |
| `nico/SEMANTIC.md`          | 2 506      | clean    |
| **`nico/PROCEDURAL.md`**    | **15 969** | **over** |

8 000 is the only round value that fires on exactly the complained-about store and nothing else,
with 1.8× headroom over the largest uncomplained store. The rationale at `audit.ts:69-73` — _"wake
loads SEMANTIC and PROCEDURAL in full every session… set below the point where that read starts to
crowd out the work it is supposed to serve"_ — is unchanged; only its calibration was never tested
against a real store.

**(ii) The bound is advisory and must become enforced.** `pressure` is computed (`audit.ts:233`),
reported (`cli.ts:1082-1083`), and consumed as a _nudge_ (`strategy.ts:434`). **Nothing refuses a
write.** Letta's mechanism is a limit the writer _cannot exceed_ — that is what converts append into
an eviction decision (R1 §Q3.1). A watermark an agent may ignore is a watermark an agent will
ignore, and has.

_Enforce at `appendToHome` (`dream.ts:31`)_ — the single landing site for all prose-store growth,
reached by `applyRoutes` (`dream.ts:204`) and therefore by `apply` and `rollover` alike. One home,
one guard.

**(iii) The escape that prevents a brick, and makes migration unnecessary.**

```
append (appendToHome)  accepts ⇔  bytes(after) ≤ ceiling
replace (cli.ts:875)   accepts ⇔  bytes(after) ≤ ceiling  ∨  bytes(after) < bytes(before)
```

The second disjunct is load-bearing three ways:

- **It un-bricks the over-ceiling store.** Without it, `nico/PROCEDURAL.md` at 15 969 could never be
  repaired — every `replace` would be refused for still being over.
- **It makes the ceiling a gradient, not a cliff.** An over-ceiling store converges across
  successive dreams; no single heroic distillation is demanded.
- **It is why there is no migration.** See §Migration.

**What the refusal must say.** The overage in bytes, the ceiling, and the store — so the agent's
next act is a distillation with a known target rather than a retry. A bare refusal invites a retry
loop.

**The judgement stays with the agent.** _That_ an eviction is owed is mechanical. _What_ to evict
from 65 correct entries is a value judgement, and this spec deliberately does not touch it — see the
Decision 2 table's last two rows.

**Contract check.** `audit.ts` gains a changed constant; `dream.ts` gains a guard in one existing
function; `cli.ts` gains a guard in one existing function. **No store rewrite, no fold-engine
change.** Within the "reorganization and bug-fixing, not a redesign" constraint.

---

## Decision 4 — Duplicate detection: **refused at every rung, on measurement**

### 4a — The briefed constraint conflict, and why it dissolved

S3 required that R1's cosine-similarity rung be dropped, priced, or shown unnecessary — it assumes
an embedding service, and deployment is local-first, file-backed, no network, inside a Stop hook.

**Priced, for the record.** A local embedding path exists: a quantized MiniLM under
`onnxruntime-node` / transformers.js — Apache-2.0, ~23 MB of weights plus a ~100 MB **native**
runtime with per-arch binaries. Against a package whose deployment story is _portable across hosts,
runs in a hook, file-backed markdown_, a per-arch native binary two orders of magnitude larger than
the data it indexes is refused on weight and portability alone.

**But that refusal turned out not to be the operative one, and the shard's framing was too
generous to the ladder.** Measured on the live corpus, **rung 1 — exact normalized match, the
free rung — fires zero times**: 0 exact and 0 normalized-exact duplicate bodies across all 46 live
and archived records, and 0 exact duplicates among `nico/PROCEDURAL.md`'s 65 entry keys. On the one
real deduplication event in the corpus' history, a normalized-exact key would have caught **0 of 3**
removed records.

**So the ladder does not lose one rung — it has no yield at any rung, because the phenomenon it
detects does not occur in this store.** Graphiti's ladder is built for a graph with many entities
and repeated mentions of each. This store takes ~11–22 bespoke prose observations per drain, each
authored once. Building the detector would be building an instrument for a phenomenon this corpus
does not exhibit — and its acceptance could only be demonstrated on a synthetic.

**One thing worth keeping from the ladder's logic, inverted.** Graphiti puts the LLM last because
there it is an expensive network call per candidate. Here **the drain-time reasoner is the dream
agent — already resident, already reading the whole store via `get` (`cli.ts:850`), already holding
the candidate set.** The cost ordering that motivates a cheap pre-filter does not obtain. Even if a
rung had yield, the rung it would be shortcutting past is free.

### 4b — What the duplication actually is

The 3 hand-removed records were not textual twins of anything. All three were records whose content
had been **promoted into an artifact** — a decision that became PLAN.md prose, a mechanism that
became a cell law. That is not record↔record duplication. It is **record↔projection restatement**,
and it is the same defect R1 §Live-corpus-facts logged separately as _"restatement is real"_ in
`mav/SEMANTIC.md`. **R1 listed duplication and restatement as two findings; they are one.**

**Verdict: no new detector, no new key, no new stage.** The law already exists and is correct —
`projection-carries(i) ⇒ i ↦ drop` (`skill.ts:40`) and `promotion-is-move ≜ a promoted item ∉ its
raw source` (`skill.ts:28`). The failure is not that the law is missing; it is that
`promotion-is-move` is stated as a _definition_ rather than as an _obligation discharged at the
moment of promotion_, so a promoted record survives in the raw log until some later drain notices.
**On a hit: flag, never merge.** Merging is what produced `nico/PROCEDURAL.md:102`'s
five-laws-on-one-line damage — the corpus is its own evidence against automatic merge.

**Cost of being wrong.** If duplication later appears at volume, rung 1 is ~20 lines against
`audit.ts` and can be added then, with the corpus to calibrate it. Refusing it now costs a
detector that would report zero.

---

## Decision 5 — The `memory` ↔ `canon` seam

**Named concretely first, as required.** Two clunks, both verified; the second is causally tied to
Decision 3.

**Clunk A — the memory verb roster has THREE homes and only two are gated.**

| home                          | site                                                                         | gated?                               |
| ----------------------------- | ---------------------------------------------------------------------------- | ------------------------------------ |
| the CLI's per-verb flag table | `cli.ts`                                                                     | —                                    |
| `MEMORY_VERBS`                | `verb-port.ts:38-54`                                                         | **yes** — `test/verb-roster.test.ts` |
| the cells' invocation strings | `dream/skill.ts:14,18-25,27` · `wake/skill.ts:14,19` · `handoff/skill.ts:10` | **no**                               |

`verb-port.ts:31-37` documents this failure class in its own words — _"they diverge SILENTLY … which
is how `get` and `rollover` shipped dead"_ — and then gates only two of the three homes. V2 found
the same shape one layer down: one verb's contract stated three different ways in three files.

**Clunk B — the cell's `gate` codomain omits the one signal that fixes the bloat.** The cell
declares `gate : home → findings` (`skill.ts:25`). `auditHome` returns
`{findings, pinned, stalePins, scanned, pressure}` (`audit.ts:55-66`), and **`pressure` is the only
trigger `depalimpsest` has** (`strategy.ts:427-428`: _"it is the trigger `depalimpsest` has always
lacked"_). The cell then schedules that act as `periodic :` (`skill.ts:47`) — an **unbound
schedule**, where the tool computes an actual trigger.

**So the tool measures store pressure, and the cell that must act on it cannot see the measurement.**
That is the clunk in one sentence, and it is why a bound that already existed never produced a
consolidation.

**Fix — minimal, and direction-preserving.**

- **B:** correct the cell's `gate` codomain to carry `pressure`; replace `periodic` with the
  pressure trigger; declare the ceiling law so the cell states what the tool will refuse. A cell
  edit, no code.
- **A:** add a gate that **fails when a cell names a memory verb absent from `MEMORY_VERBS`**.

**Explicitly NOT proposed: generating the cell from code.** `AGENTS.md` fixes the direction —
source is brought _up_ to the grounding, never regenerated _from_ it — and the cells are
hand-authored formal blocks under the self-sufficiency and symbols gates. The gate only **refuses
drift**; it never authors. That distinction is the whole design of the fix.

**Out of contract, and named as such:** collapsing the three verb-roster homes into one generated
source would be a redesign of the seam. Refused. The smaller thing — gate the ungated third home —
buys the same protection at a fraction of the change.

---

## Migration — **none is owed, and that is the result, not an omission**

**No schema change is proposed anywhere in this spec.** `record.ts` is untouched: no new field
(Decision 1), no dedup key (Decision 4), no counter. `EpisodicRecord` (`record.ts:15-38`) ships
unchanged, so `assertRecord`, `serializeRecord`'s fixed key order (`record.ts:95-107`), and the
fold's byte-determinism (`fold.ts:10-12`) all hold as-is.

**Existing records are left, not rewritten.** There is nothing to rewrite them _to_.

**The only state that changes is a threshold, and the strict-shrink escape makes even that
migration-free.** After M1, `nico/PROCEDURAL.md` is over the ceiling. It is not invalid, not
quarantined, and not rewritten — it is **legal-but-frozen-to-shrink**: appends refuse, any
size-reducing `replace` succeeds. The store migrates itself, by consolidation, at the agent's own
pace. Had the ceiling been a hard both-ways bar, a batch rewrite of live agent memory would have
been required; the escape clause is what buys that away.

**Falsifier for this claim:** `git diff` on the landed shards touches no field of `EpisodicRecord`
and adds no migration step to `strategy.ts:443 migrateIfOwed`.

---

## Shards emitted → landed, now `plans/.retired/close-out/completed/`

| id     | shard                      | concern   | deps   | wave |
| ------ | -------------------------- | --------- | ------ | ---- |
| **M1** | `store-ceiling-enforced`   | the bloat | —      | 0    |
| **M3** | `cell-verb-roster-gate`    | seam A    | —      | 0    |
| **M2** | `dream-cell-pressure-seam` | seam B    | M1, M3 | 1    |

```text
R = {(M2,M1), (M2,M3)}
wave(0) = { M1, M3 }   wave(1) = { M2 }
```

M1 (`memory`) and M3 (`canon/toolkit`) have disjoint outputs — same wave, no isolation
needed. M2 edits the cell and must land _after_ M3's gate exists, so the gate judges the edit.

**Decisions 1 and 4 emit no shard. Both are refusals with no code change** — that is their content,
and inventing a shard to carry a refusal would be work with no acceptance. Migration emits no shard
because none is owed.

**Filed, not specified:** `x-routes-stamp-declared-and-stamped-yet-absent-from-every-live-record.md`
— `routes` is stamped by `applyRoutes` (`dream.ts:214-226`) yet present on **0 of 46** live and
archived records, implying `apply` is not the path in live use. Found while measuring Decision 4;
out of this shard's remit to chase.

---

## Acceptance self-check (S3's own)

1. ✅ All five decisions taken, plus migration, each with its reason.
2. ✅ Every decision cites R1 or a `path:line`.
3. ✅ Three shards emitted with all six fields — M1, M3, M2 — all since executed and completed.
4. ✅ Each acceptance is falsifiable and stated to fail on the pre-state.
5. ⤳ PLAN.md slice table + `R` — **the parent's act** (this shard was instructed not to edit the
   mirror). Rows and `R` supplied above verbatim for that update.
