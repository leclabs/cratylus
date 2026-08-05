# Canon's own `SOUL` — 9 lines in 5 shipped cells, and it moves the render oracle

> Census: [`CENSUS-2026-08-05.md`](../CENSUS-2026-08-05.md). **Ruling owed before execution.**

## Scope, and why it is separate from `t-soul-to-target-in-forge`

Forge's 30 `SOUL` sites are a projector carrying a corpus metaphor — mechanical once `Target` is
adopted. **Canon's are different: the corpus may legitimately own a metaphor for its own artifact.**
That is the question, and it is strictly larger.

## Measured

15 files / 35 lines under `packages/canon`. Of those, **9 lines in 5 SHIPPED source cells**:

- `genus/founding-doctrine.ts:42` — **rides into every SOUL**
- `genus/persona.md:9`
- `skills/create-agent/skill.ts:7`
- `skills/dream/skill.ts:7,13,34,63`
- `skills/introspect/skill.ts:7,9`

Touching any of them **moves the render oracle**, and `founding-doctrine` moves every projected agent.

## Explicitly out of scope

Three of the 15 files are `toolkit/guardrail/fixtures/turn-*.txt` — **records, not surfaces**. The
`record-retrofit-notice` precedent applies: a record edited to match today is no longer a record.
**Do not sweep them.**

## The ruling owed

Does canon's `SOUL` survive C1's metaphor ruling? A corpus about discovered names carrying a
metaphor for its central artifact is either a defect or a deliberate exception — and if it is the
exception, the reason must be written down where the next sweep will find it.

## Acceptance

- Ruled explicitly, either way, in ground rather than in a plan file.
- If it changes: oracle re-baselined deliberately, with the founding-doctrine diff quoted in full,
  because every agent's doctrine changes with it.
- If it stays: a note in the cell saying why, so this is not re-opened a fourth time.

## ▶ RULING 2026-08-05 — `SOUL` GOES. Not an exception — a defect, and the sharpest in the row.

**`SOUL` names the wrong side of the corpus's own ontology.** `MODEL.md:70` — _"a cell is a BEING ;
deploy projects it to MANY per-harness Targets = its FACES."_ `SOUL` denotes the FACE. Every prior
`soul` fires — inner, singular, essential, persisting — is the **BEING**. The sign decodes to the
opposite of its referent, against the ground the corpus wrote itself: `decode_warm ≢ decode_cold`
⇒ PROJECT-DEFECT.

`Target` is already canonized (`MODEL.md:33`) and occupancy is not merely clean but **confirming** —
canon's own `targetPath` already means "the path a Target regenerates to", and `repo-preamble.ts`
already writes _"byte-locked rule TARGET … `SelfAuthored ∉ Target`"_.

**The rename makes a law mechanical that is currently a translation step.** `dream/skill.ts:63`
`SOUL ∉ dream-outputs` **is** `MODEL.md:69` `SelfAuthored ∉ Target`. Under `Target` they are visibly
one law; under `SOUL` they are two homes — a DRY breach the metaphor hides. And the metaphor is
already producing a tautology: `introspect/skill.ts:9` unions a thing with itself, and only the
metaphor makes the two operands look distinct.

**Two corrections to this shard, both verified:**

1. `genus/persona.md:9` does **not** move the oracle — the file is in neither render tree. Free edit.
2. **Two `SOUL` populations belong to no shard at all**: `schema/src/index.ts` ×5 and
   `memory/src/seeds.ts` ×4 — and `seeds.ts:51` **ships into every deployed `PROCEDURAL.md`**.
   `t-soul-to-target-in-forge`'s acceptance greps `packages/forge/src` only, so it would have gone
   green with `SOUL` still live in two packages. **That acceptance is widened in this ruling** —
   it is exactly the decay class this census exists to stop.

**Oracle: 52 of 75 rendered files**, every one through `founding-doctrine.ts:42`. Three re-baselines,
deliberately NOT batched: forge comments (oracle unmoved) → substrate+authoring (4 files) → this one
(52 files), kept alone so its diff stays reviewable as a pure rename.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** skill-cells · **wave** 1
- **depends on** `t-shim-path-from-capability` · `t-substrate-concept` · `t-authoring-surface` · `t-coined-classification`
- **writes** `packages/canon/src/genus/**` · `packages/canon/src/skills/dream/**` · `packages/canon/src/skills/introspect/**`
- **compiles against** `packages/schema/src/index.ts`
- **evidence** `packages/canon/src/genus/founding-doctrine.ts`
- **dispatchable** no ruling owed
