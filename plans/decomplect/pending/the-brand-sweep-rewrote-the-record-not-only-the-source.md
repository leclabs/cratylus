# The brand sweep rewrote 108 files of historical RECORD, and one live shard now refutes itself

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

| class                                           | files   |
| ----------------------------------------------- | ------- |
| `plans/.retired/**` — closed plans              | **95**  |
| `plans/decomplect/completed/**` — closed shards | **13**  |
| live (PLAN, sweeps, `pending/`, `ready/`)       | 7       |
| **total**                                       | **115** |

1100 insertions, 1108 deletions. **108 of 115 are historical record.**

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

## The fork — operator's, not mine

Both branches are defensible and they are mutually exclusive:

1. **The record is immutable.** `plans/.retired/**` and `**/completed/**` are exempted from every
   name sweep, forever, and the 108 files are restored from `61b85db7^`. Cost: the retired names
   come back into the tree, which is a **published-repo** decision now that `cratylus` is public.
2. **The tree is uniform.** The rewrite stands, and each rewritten historical directory gets a
   provenance note stating that its contents were retro-fitted by `61b85db7` and that names in it are
   not the names in use at the time. Cost: the record stays counterfeit but becomes _marked_.

There is no third option where both properties hold, which is why this is filed rather than fixed.

## Acceptance — whichever branch

- The chosen property is enforced by a **gate**, not by a sentence in PLAN.md. Branch 1 = a path
  exemption in the retired-name check plus a test that convicts a sweep touching `.retired/`;
  branch 2 = a test asserting every historical directory carries its provenance note.
- `ready/t-config-filename-carries-the-retired-brand.md` reads coherently again under either branch
  — it is the one live shard the sweep made unusable, and it is blocked until this is ruled.
- Both fixtures: a convicting one and an exonerating one. A checker that can only convict convicts
  the corpus of its own defects.
