# Deleting the archive left a property with no enforcement point

> Found 2026-08-05 by the agent landing `retire-relocates-but-the-operator-deletes`, which named the
> loss rather than quietly accepting it. That is the report I want; this is the follow-up it owed.

## The property

_A retired plan carries no unfinished shard._ Every `pending`/`ready`/`active` file left behind at
retirement is work somebody stopped doing without deciding to drop it.

## Why it no longer has an owner

It used to be enforced **post-hoc**: a gate scanned `plans/.retired/` and convicted any archived plan
still holding an open shard. Now `retire` DELETES, so there is nothing left to scan. The detector
survives — but it runs against synthetic input only, which makes it a demonstration rather than a
control over the live corpus.

**This is the honest shape of the loss, and it is worth stating plainly:** the property did not
become false, it became unobservable. Those are different, and only the first is a bug. But an
unobservable invariant decays exactly like a `⊥` — nothing re-checks it, because there is nothing
left to check it against.

## The fix

The enforcement point moves from _after_ to _before_: `retire` still sees the pre-image, so the
guard belongs in its precondition. `retire(P)` refuses when `P` holds any file under
`pending/`, `ready/` or `active/` — the same read `done(P)` already performs.

That is strictly stronger than the gate it replaces: the old one convicted an archive AFTER the
mistake was made and preserved; the new one prevents it.

## Adjacent, and deliberately not folded in

`retire` also checks only `terminal(P)`, not `drained(yield(P))` — the second is a claim about
whether every intent reached its strongest seam, and no predicate over the tree decides it. It is
recorded in the implementation as an obligation the caller owes. Making `drained` checkable is a
larger question than this shard and should not be smuggled into it.

## Acceptance

- `retire(P)` refuses a plan with any open shard, and the refusal names the shards.
- A convicting fixture: a plan with one `ready/` file is refused; an all-`completed` plan retires.
- The existing synthetic detector is either deleted as superseded or re-pointed at the precondition —
  it must not sit there implying a live scan that no longer exists.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** plan-machinery · **wave** 0
- **depends on** `retire-relocates-but-the-operator-deletes`
- **writes** `packages/canon/src/toolkit/plan-set.ts` · `packages/canon/test/plan-set.test.ts`
- **compiles against** `packages/canon/src/skills/praxis/skill.ts`
- **evidence** `packages/canon/src/toolkit/plan-set.ts` · `packages/canon/test/plan-set.test.ts`
- **dispatchable** no ruling owed
