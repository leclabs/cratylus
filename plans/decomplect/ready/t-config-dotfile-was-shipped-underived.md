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

## ▶ RULING 2026-08-05 — TWO concepts, it is MEMORY's, and the re-derivation REJECTS BOTH shipped signs

**Not a merge. Not a ratification.** `.cratylus.config` → **`.cratylus.memory.json`**;
`$CRATYLUS_CONFIG` → **`$AGENT_MEMORY_CONFIG`**.

**(i) Two concepts, separated on three measured axes.** _Authority_ — the runtime dotfile is
PROJECTED by deploy; this one is OPERATOR-AUTHORED and ships an `.example` to hand-copy, so merging
would put operator ground in a projector-owned file and deploy would clobber it. _Location_ —
`homedir()` vs bare-relative. _Referent_ — provider wiring vs boundary semantics. **The only thing
they share is the word `config`, and `config` is vacuous — which is exactly why the guess was easy.**

**(ii) It is memory's, and this shard's own premise is falsified.** All 21 live references sit in
`packages/memory/` plus memory's own port. Zero non-memory consumers exist and none is possible —
the `fleet` section that _was_ general was deleted precisely because nothing read it. The file's top
key already says `memory`.

**(iii) Occupancy kills `.cratylus.config` outright.** The rule already in force in this tree is
`` `.${BIN}.json` ``, and `bin-name.ts` records a deliberate TWO-bin derivation. So
`.cratylus.config` decodes as _"the `cratylus` bin's config"_ — **it squats the bare-mark slot the
build CLI's own config must one day take.** Blind reverse decode: the name predicts general tool
settings, the content is scope-markers and host homes. MISS. The sibling blind-decodes to its
contents. HIT.

**The env var is a separate and cleaner kill.** `store.ts:100` declares this package's namespace is
`AGENT_*`, and the live surface is `AGENT_RUNTIME_CONFIG` · `AGENT_SESSION_ID` ·
`AGENT_SESSION_ID_FROM`. `CRATYLUS_CONFIG` is the **sole outlier**, swept into the wrong register by
`61b85db7` — and `store.ts:100` still asserts the claim that sweep broke. Two registers, two rules,
both already in force: **files ↦ `.cratylus*` · env ↦ `AGENT_*`**.

Also: `.config` lies about the format — the content is `JSON.parse`d. The facet form
`.cratylus.memory.json` follows the `tsconfig.build.json` precedent already in the tree.

**Write the derivation into `node.ts`'s one-home comment block** — that is the site the next brand
sweep cannot overwrite without reading it, which is precisely the failure `61b85db7` executed.

**Ignore this shard's original acceptance line** (`grep 'cratylus' → nothing`): it is self-refuting
and would delete the live scope.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** host-and-config · **wave** 0
- **depends on** —
- **writes** `packages/memory/src/node.ts` · `.cratylus.config.example`
- **compiles against** `packages/runtime/src/runtime-config.ts`
- **evidence** `packages/memory/src/node.ts` · `packages/runtime/src/runtime-config.ts`
- **dispatchable** no ruling owed
