# `deploy --check` exists; nothing runs it, so the drift is still silent by default

> Filed 2026-08-05 by the agent landing `deployed-drifts-from-rendered-unwatched`, which built the
> comparator and declined the second half — a canon hook cell was outside its writes.

## What landed, and what it does not do

`cratylus deploy --check` compares the deployed tree against the rendered one and reports **stale**,
**absent** and **foreign** separately, refusing to charge a file it cannot account for. It is
reachable, it is correct, and **it only speaks when someone asks it to.**

That is the whole gap. The incident this repairs was not "the operator ran a check and misread it".
It was an agent editing the corpus for a full session under a superseded first principle, with every
gate green, **because nobody thought to look**. A check that must be remembered is a check that will
be forgotten at exactly the moment it matters — the session where the doctrine is already wrong.

## The shape

A canon hook cell on session start, in the family that already exists
(`resume-availability-notice`, `memory-consolidation-nudge`): run the comparison, stay **silent when
in sync**, and speak when it is not. `ARCHITECTURE`'s fidelity ladder gives the register — degrade
and warn, never refuse. A stale deployment must not block a session; it must be impossible to start
one without being told.

## What it must say

Not a count. The comparator already produces the right thing — the superseded lines still running
and the rendered lines missing — and the advisory should carry that, because **"3 files differ" does
not tell an agent its own doctrine is stale.** The one line that matters is the axiom it is about to
operate under.

## Constraints

- The cell declares the capability; it does not name a path or a command. That is
  `t-shim-path-from-capability`'s law and it applies here.
- Silence when clean is mandatory — an advisory that fires every session trains the reader to skip it.
- Cost: this runs on every session start. Measure it. If a full byte comparison is too slow, compare
  a digest and say so, but **do not sample** — a sampled check that misses the founding doctrine is
  worse than none, because it reports "in sync".

## Acceptance

- A stale host produces the advisory at session start, naming the superseded content.
- A synced host produces nothing at all.
- Both proven by driving the worker, not by asserting the cell's text.
- The cost of the clean path is measured and recorded in the cell.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** deploy-surface · **wave** 1
- **depends on** `deployed-drifts-from-rendered-unwatched` · `soul-survives-in-canon-test-prose` · `source-can-go-invisible-to-every-text-tool`
- **writes** `packages/canon/src/hooks/**` · `packages/canon/test/**`
- **compiles against** `packages/forge/src/deploy/local.ts`
- **evidence** `packages/forge/src/deploy/local.ts` · `ARCHITECTURE.md`
- **dispatchable** no ruling owed
