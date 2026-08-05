# 28 events declared twice, agreeing by coincidence — and the adapter table is cloned too

> Census: [`CENSUS-2026-08-05.md`](../CENSUS-2026-08-05.md). **Ruling owed before execution.**

## Measured, today

| home               | site                                                         |
| ------------------ | ------------------------------------------------------------ |
| `CanonicalEvent`   | `schema/src/hook/generated.ts:8-36`, from `hook.schema.json` |
| `LIFECYCLE_EVENTS` | `runtime/src/events.ts:21-50`, hand-authored                 |

**28 / 28. Identical as sets AND in order.** Three artifacts, not two: the JSON enum, the emitted
union, the authored tuple. **Nothing enforces it** — zero test files in any package mention either
name — and the consumer sets are **fully disjoint**, which is why it never surfaced.

## Three corrections to the filing

1. **The duplication is schema-vs-runtime now, not forge-vs-runtime.** `48baaddd` moved
   `CanonicalEvent` out of forge. This changes the remedy: `ARCHITECTURE.md:221-227` has
   `forge → schema` and `forge → runtime` but **no edge between schema and runtime in either
   direction**. Unifying needs an edge the north star does not contain.
2. **The adapter table is duplicated too, and nobody filed it.**
   `forge/adapters/claude/events.ts:10` `canonicalToClaude` and
   `runtime/capabilities/event-tap/claude-serialize.ts:23` `lifecycleToClaude` are the **same 18
   key→value pairs, byte-identical**. The clone is a declaration _and_ its adapter table.
3. **"Nine realizable on no harness" is ten.** Measured against both shipped adapters: 10 of 28 have
   no native peer. The symmetric-pair signature holds for 8; `notification` and `session.resume` are
   unpaired singletons and do not carry it — so the "signature of enumeration" argument covers less
   than it claimed.

## `vcs.commit.post` — CHANGED

Now at `schema/src/hook/index.ts:32` (`SubstrateEvent = CanonicalEvent | 'vcs.commit.post'`), 3 files
/ 8 sites. The originating cell `canon/src/hooks/praxis-continuity.ts:5` still says _"not in
**forge's** taxonomy"_ — stale by one package. The cell itself is clean.

**Not a defect, worth recording:** `Substrate = 'harness' | 'git'` sits one line above and IS consumed
by the adapter port. The axis `EVENT-VOCABULARY.md` said was missing is now declared. Only the
literal remains.

## The ruling owed

Where does a lifecycle vocabulary live, given `ARCHITECTURE` says runtime receives corpus facts as
configuration the projection emitted? `EVENT-VOCABULARY.md` is **still correct on the defect,
superseded on the remedy** — do not restate its remedy.

## Acceptance

- One home; the other derives. No new package edge without an ARCHITECTURE amendment argued separately.
- The 18-entry claude map has one home too, or a test that fails when the two diverge.
- Cold-verify the members: is each a real concept? Unmapped ≠ fabricated — that is a different
  question from whether a harness fires it.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** event-vocabulary · **wave** 3
- **depends on** `t-tap-anchor` · `t-projection-file-anchor`
- **writes** `packages/schema/src/hook/**` · `packages/runtime/src/events.ts` · `packages/runtime/src/capabilities/event-tap/claude-serialize.ts`
- **compiles against** `packages/forge/src/adapters/claude/events.ts`
- **evidence** `packages/schema/src/hook/generated.ts` · `packages/runtime/src/events.ts` · `ARCHITECTURE.md`
- **dispatchable** no ruling owed
