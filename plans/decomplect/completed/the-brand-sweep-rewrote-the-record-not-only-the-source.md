# The brand sweep rewrote 99 files of historical RECORD, and one live shard now refutes itself

> Found 2026-08-05 at wake, reading the frontier. `61b85db7` enforced "zero occurrences of the
> retired NAMES, in content AND in paths … across 661 files **including retired history**" — the
> criterion was stated, accepted, and met. What was never surfaced is the price: a record edited to
> match today is no longer a record, and this plan's own PLAN.md had already written that sentence.

## Symptom — the proof case is self-refuting on its first line

`ready/t-config-filename-carries-the-retired-brand.md` now reads:

> "Everything else stopped saying `cratylus`. This did not, because it is a **filename on a user's
> disk**" — heading `` `.cratylus.config` — a user-facing filename still wearing the retired brand ``

The retired brand and the live brand are the same string in that sentence. The shard's whole
argument — _one name survived a sweep that removed it everywhere else_ — is unreadable, because the
sweep that removed the name also removed it from the shard describing its survival. Its acceptance
line `grep -rn 'cratylus' packages/*/src returns nothing` now demands the deletion of the live scope.

The same substitution ran over `completed/t-bin-name-migration.md` (30 lines), the
`.retired/runtime/` plan that _decided_ the CLI brand (`s9-unified-cli-brand.md`, 19 lines), and
`completed/invoke-was-not-what-it-was-named.md` — every artifact whose subject **is** the retired
name.

## Census

`git show 61b85db7 --name-only -- plans/`

| class                                           | path entries | files today |
| ----------------------------------------------- | ------------ | ----------- |
| `plans/.retired/**` — closed plans              | 95           | **86**      |
| `plans/decomplect/completed/**` — closed shards | 13           | **13**      |
| live (PLAN, sweeps, `pending/`, `ready/`)       | 7            | 7           |
| **total**                                       | **115**      | **106**     |

1100 insertions, 1108 deletions. **99 of 106 files are historical record.**

**The two columns differ by 9, and the gap is itself a finding.** Nine path entries are the
pre-rename side of a **directory** rename: `plans/.retired/agent-runtime/` → `plans/.retired/runtime/`.
So the sweep did not only rewrite the record's text — it moved the record's address. The retired plan
that _decided the CLI brand_ now sits at a path named for the outcome rather than for the subject it
argued about, and a citation of the old path resolves to nothing.

(The first version of this shard said "108 of 115", double-counting those nine. Recomputed from
`git show --name-only` against the working tree; corrected here rather than in place, because the
same class of error is what the shard is about.)

## Why nothing caught it

Two gates exist and neither is wrong; the property simply falls between them.

- The **retired-name gate** quantifies over the tree with no exemption for `plans/`, and that is what
  the operator accepted — hypothesis 1 was explicitly "in content AND in paths."
- **`command-veracity`** checks that a cited path resolves. Every path in these files still resolves,
  because the sweep renamed the citation and the target together. A record can be made false without
  becoming unresolvable.

PLAN.md states the discipline that was breached — _"Historical citations of `fe084dd1` were left
alone, as were `plans/.retired/` and `completed/`: a record edited to match today is no longer a
record"_ — and states it about a **different sweep**, four commits earlier. So the rule was known,
written down, honored once, and then lost to a sweep whose criterion did not carry it. **A rule in
prose competes with a criterion in a script and loses.**

## What is actually at stake

A retired plan is the only evidence of _why_ a decision was taken. `s9-unified-cli-brand.md` recorded
that the CLI brand anchor settled at `⊥` and that the then-current bin was **KEPT** — a refusal, with
its reasons. Rewritten into today's vocabulary it reads as if the current name was always the answer,
which inverts the finding: what it recorded was that no name won. The next agent to re-open that
question reads a record that agrees with the status quo instead of one that explains it.

This is the same species as `deployed-drifts-from-rendered-unwatched.md` — an agent reasoning
confidently from a surface that was silently rewritten underneath it — one layer further back:
there, the _doctrine_ was stale; here, the _history_ is counterfeit.

## The fork — and my pick is branch 2

Two branches, mutually exclusive:

1. **The record is immutable.** `plans/.retired/**` and `**/completed/**` are exempted from every
   name sweep, forever, and the 99 files are restored from `61b85db7^`. Cost: the retired names
   come back into the tree, which is a **published-repo** decision now that `cratylus` is public.
2. **The tree is uniform.** The rewrite stands, and each rewritten historical directory gets a
   provenance note stating that its contents were retro-fitted by `61b85db7` and that names in it are
   not the names in use at the time. Cost: the record stays retro-fitted, but becomes _marked_.

**▶ Branch 2, and the argument that decides it is one the framing above obscured: the record was
never destroyed.** `61b85db7^` holds every original byte, and git does not forget. What the sweep
took was not the record — it was the **reader's knowledge that a substitution happened**. That is
exactly what a provenance note restores, at zero cost to the property the operator explicitly
accepted. Branch 1 pays a public-repo cost to recover something a one-line pointer recovers for free.

The residual branch 2 leaves is real and should be stated rather than hidden: a reader who does not
follow the pointer reads retro-fitted names as contemporaneous ones. The note must therefore sit in
each affected directory, not in a central register — the defect is local, so the marking is local.

**Reversible either way, and the operator may overturn it**; nothing downstream is built on the
choice except the one blocked shard below.

## Acceptance — whichever branch

- The chosen property is enforced by a **gate**, not by a sentence in PLAN.md. Branch 1 = a path
  exemption in the retired-name check plus a test that convicts a sweep touching `.retired/`;
  branch 2 = a test asserting every historical directory carries its provenance note.
- `ready/t-config-filename-carries-the-retired-brand.md` reads coherently again under either branch
  — it is the one live shard the sweep made unusable, and it is blocked until this is ruled.
- Both fixtures: a convicting one and an exonerating one. A checker that can only convict convicts
  the corpus of its own defects.

---

## Closed ✅ — branch 2 executed, 2026-08-05

17 `NAMES-RETROFITTED.md` notices placed: 16 retired plan directories plus
`plans/decomplect/completed/`. Each names the sweep, links to this shard, and carries a `git show`
command **verified to resolve** against `61b85db7^`. `plans/.retired/runtime/`'s notice is different
on purpose — nothing under that path exists at `61b85db7^`, because the directory itself was the
rename, so it tells the reader to ask for the old address.

Gate: [`packages/canon/test/record-retrofit-notice.test.ts`](../../../packages/canon/test/record-retrofit-notice.test.ts).
Four legs, each **proven red by injection** and restored:

| injection                                     | leg that fired  |
| --------------------------------------------- | --------------- |
| remove a notice                               | 1 — convicting  |
| notice in a directory the sweep never touched | 2 — exonerating |
| cited `git show` object does not exist        | 3b              |
| broken relative link to this shard            | 3a              |

The exonerating leg asserts its own denominator (`untouched.length > 0`), so it fails as DARK rather
than passing as clean if the sweep ever reaches every historical directory.

**The roster is pinned as DATA, not derived from git, and that is the load-bearing decision.**
Deriving it needs `git show 61b85db7`, and `actions/checkout@v4` clones **shallow** by default — a
git-derived roster comes back EMPTY in CI and the gate passes by looking at nothing. `fetch-depth: 0`
is now set in `verify.yml` for the history leg, and that leg reports NOT-CHECKABLE out loud rather
than passing silently when the sha is unreachable.

**What this gate does NOT cover, stated so its silence is not read as coverage:** the general
property — _no sweep may rewrite a record without marking it_ — is unowned. It cannot be gated until
the sweep is a mechanism rather than an ad-hoc pass, because there is nothing to hook. That is the
real residue of this shard.
