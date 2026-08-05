# The dotfile name was not left underived — it was SHIPPED underived, and the record was overwritten

> Census: [`CENSUS-2026-08-05.md`](../CENSUS-2026-08-05.md). **Ruling owed before execution.**

> **This supersedes `ready/t-config-filename-carries-the-retired-brand.md`**, whose text `61b85db7`
> made unreadable by sweeping the retired brand _inside the shard whose subject was that brand_.

## What the plan got wrong about its own shard

`PLAN.md` recorded the derivation leg as **unpaid**. It was not unpaid. **The decision was already
taken, by default, and the artifact that would have said so is the one the same commit made
unreadable.**

`git log -S` puts all three literals — `CONFIG_FILE`, `.cratylus.config`, `CRATYLUS_CONFIG` — into
`memory/src/node.ts` at **`61b85db7`**: the same commit that rewrote the shard. That commit both
collapsed the two literals into one home **and picked the exact string the shard names as _"the
obvious guess"_ and forbids assuming.**

## What is actually true today

- **One home: MET.** `memory/src/node.ts:306-318`; both former duplicates delegate to
  `resolveConfigPath`. The precedence chain is written once. That half of the shard is discharged.
- **Derivation: ZERO RECORD.** No argmin, no blind reverse decode, no occupancy check, no comparison
  against `.cratylus-run.json`, anywhere in the tree.
- **The sibling IS derived** — `runtime/src/runtime-config.ts:34`:
  ``RUNTIME_CONFIG_NAME = `.${RUNTIME_BIN}.json` ``. So the shard's question 1 was answerable all
  along and was never asked.

## The old acceptance line is now self-refuting

It reads _"`grep -rn 'cratylus' packages/_/src` returns nothing"\* — which today returns **164** and
demands deleting the live scope. Do not execute it.

## The rulings owed

1. Is the memory node config the same concept as `.cratylus-run.json`? One carries repo/fleet scoping
   facts; the other carries runtime provider selection. If they are one, **that is a merge, not a
   rename — STOP and report.**
2. Whose config is it? Read by `memory`, but it describes the repository. A name derived from the
   capability that happens to read it would be wrong.
3. **Is the shipped `.cratylus.config` ratified post-hoc, or re-derived?** This is the new question
   and it is the important one. The window in which a rename is free is still open — nothing is
   published — but it closes at first publish.

## Acceptance

- The name round-trips, or is ratified with the round-trip recorded. Either is fine; **silence is not.**
- Whatever is decided, the decision is written where the next sweep cannot quietly overwrite it.
