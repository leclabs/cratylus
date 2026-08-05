# The `schema → runtime` edge — the vocabulary is canon's, and `RuntimePlugin` does not move

> **This shard REFUTES the resolution PLAN.md carried for it.** "Owed next" item 2 read: _a shape the
> corpus authors against belongs in the shapes package, so the resolution is to move `RuntimePlugin`._
> A census on 2026-08-05 shows that move would fuse MECHANISM into the shapes package and make the
> architecture worse. The **detection** stands — the edge is real and ratcheted, not licensed. The
> **remedy** is replaced.

## Intent

Dissolve `agent-schema → agent-runtime` by naming the thing schema actually needs, which is a
**vocabulary**, not a shape — leaving `RuntimePlugin` and the ports where ARCHITECTURE puts them.

## What the census established

`agent-schema/src/index.ts` takes exactly one type from the runtime:

```ts
import type { RuntimePlugin } from '@cratylus/runtime';
export type RuntimeCapability = keyof Omit<RuntimePlugin, 'name'>;
```

and uses it in exactly one place — `SkillDeploy.runtime?: { capability: RuntimeCapability }`, the
field by which a **skill cell declares which runtime capability it is a face of**.

So what schema consumes is not `RuntimePlugin`. It is the **key set** `'memory' | 'eventTap'`,
derived structurally from the shape of an implementation interface.

`RuntimePlugin` itself is typed over `MemoryStrategy` and `EventTapHost` — the runtime **ports**.
Moving it into the shapes package drags the ports with it, and the ports are the whole of what
ARCHITECTURE assigns to `agent-runtime`: _"Structured as **ports** (the abstraction) and
**strategies** (the interchangeable implementations)."_ Trading one ratcheted edge for a fused
concern is not a repair.

**The real defect is `shape ⊥ vocabulary`** — the identical defect `MODEL.md:22` already names for
the lifecycle vocabulary:

> `Event ≜ … ⟨corpus-owned ⟨a name for a moment ∴ signification⟩ ; shape ⊥ vocabulary : shape @ agent-schema · names @ corpus⟩`

A capability name is a name for a **faculty an agent may have**, and naming is signification. Under
that parity the vocabulary is canon's, the shape stays where its ports are, and the edge dissolves by
naming the other thing — the same cheapest-possible resolution that dissolved the `catalog`
collision.

## Constraints

- `agent-canon` depends on `agent-schema`, never the reverse. **Schema cannot import canon's
  vocabulary.** Schema types the field against a bound; canon supplies the members. This is the
  pattern `DimensionName`/`catalog` already runs — reuse it, do not invent a second one.
- **`ARCHITECTURE.md` and `MODEL.md` are ground.** If the ruling needs either to change, that is a
  separate act and it lands first — ground carrying a refuted claim is worse than source doing so.
- The keyspace sign is **occupancy-constrained**: `capabilities` is already the runtime's own
  capability keyspace and is the subject of sweep item C4. A cold argmin that returns it must be
  rejected on occupancy, not adopted.
- The vocabulary today has **two** members. Two is enough to be a vocabulary and not enough to prove
  one — state whether a member is DISCOVERED or enumerated, on C4's precedent.
- Suite green uncached; render oracle unmoved at `f60e936a172d6f37a5120cd9dd0e282c19727f58` unless a
  projected byte was deliberately changed, in which case re-baseline explicitly.

## Outputs

- `packages/schema/src/index.ts` — no `@cratylus/runtime` import.
- Wherever the capability vocabulary lands, with its signification recorded.
- `packages/canon/test/architecture.test.ts` — the `schema → runtime` ratchet pin **removed**,
  not re-pinned. A pin that stops failing FAILS the suite; that is the shrink working.
- `plans/decomplect/CRATYLISM-SWEEP.md` — the signification legs, including rejects.

## Acceptance

1. `grep -rn "agent-runtime" packages/schema/src/` returns **no import**. (Pre-state: one, at
   `index.ts:35`. The control fails today.)
2. `packages/canon/test/architecture.test.ts` carries **no** `schema → runtime` ratchet entry,
   and the suite is green — proving the pin was retired by repair and not by exemption.
3. `pnpm test --force` green, 9 tasks, no task cached.
4. `find packages/canon/.render-ts packages/canon/.render-ts-codex -type f | sort | xargs shasum | shasum`
   → `f60e936a172d6f37a5120cd9dd0e282c19727f58`, or a deliberate re-baseline argued in the commit.
5. The capability vocabulary's sign round-trips: a forward argmin, a **blind reverse decode**, and an
   **occupancy check against this repo** — all three, because the cold reader cannot see occupied
   ground and `capabilities` is known-occupied.

## The refusal clause

If any check above fails, or if the ruling turns out to need a `MODEL.md` or `ARCHITECTURE.md`
change: **STOP and report.** A workaround here is a design decision, and that is not yours on this
task. Refusing is the correct outcome and it is worth more than a green tree.

---

## Resolution — landed 2026-08-05

The `schema → runtime` edge is gone. `RuntimePlugin` did not move, exactly as this shard required.

### What schema kept and what it gave up

```ts
-export type RuntimeCapability = keyof Omit<RuntimePlugin, 'name'>;  // a SHAPE, borrowed for its keys
+export type CapabilityName = string;                                 // the BOUND, members elsewhere
```

`SkillDeploy` and `Skill` became generic over that bound with a `string` default, so every existing
`Skill` reference still compiles. `canon/anatomy.ts` declares the members beside `MANIFEST`:

```ts
export const RUNTIME_CAPABILITIES = ['memory', 'eventTap'] as const satisfies readonly CapabilityName[];
export type RuntimeCapability = (typeof RUNTIME_CAPABILITIES)[number];
export type Skill = SkillOf<RuntimeCapability>;
```

and the sixteen skill cells now import `Skill` from `anatomy.js` rather than from the shapes package
— the same move cells already make for `Dimension`. No second pattern was invented.

### The fix was smaller than this shard assumed, and the reason matters

`RuntimeCapability` had **no consumer outside schema**. `forge` already types the same field as plain
`string` in both places it reads it, and `core/anatomy-body.ts` says why in a comment: _"Plain
`string` (not `RuntimeCapability`) keeps core free of an anatomy import."_ So the closed union bought
exactly one thing — a compile-time check on four canon cells — and this shard's insight is that the
check belongs to the corpus that ships the capabilities, not to an implementation interface.

**The check got stronger, not weaker.** Control, both directions: `capability: 'notACapability'` in
`skills/dream/skill.ts` now fails with
`TS2322: Type '"notACapability"' is not assignable to type '"memory" | "eventTap"'`, and reverting is
clean.

### The sign — and a defect in how I obtained it

The blind decode returned **`FacultyName`** (member `Faculty`) with a good argument: the `*Name`
suffix is what encodes shape-vs-vocabulary, because that distinction is one English marks with the
word _name_ rather than with a separate noun. **That structural insight is kept.**

Its root word is not, and the reason is a **defect in my prompt**: I listed `capabilities` as
occupied and told the decoder not to propose it, which disqualified the entire `Capability*` family.
Only the plural keyspace is occupied. The decode therefore ran on a wrongly-constrained candidate
set, and its output cannot be trusted for this decision.

Corrected against real occupancy: `capability` is this architecture's established sign for the
concept — ten uses in `ARCHITECTURE.md`, plus `capability package`, `capability port`. Adopting
`Faculty` would have minted a **second sign for one concept**, which is exactly
`α(cᵢ) = α(cⱼ) ⇒ D(cᵢ) = D(cⱼ)`.

**The finding: the name was never the defect — the derivation source was.** Canon's member type is
called `RuntimeCapability`, which is what schema already called it. The qualifier is load-bearing in
canon and not in schema, because canon also declares a **dimension** named `capabilities`
(`Capabilities`), an agent-design axis and a genuinely different concept. Bare `Capability` beside it
would be one root over two concepts.

### Acceptance

1. [x] No `@cratylus/runtime` import in `packages/schema/src/`.
2. [x] `schema/index.ts → runtime` **removed** from the ratchet, not re-pinned; suite green, so it
       retired by repair rather than exemption.
3. [x] `pnpm test --force` green — 14 tasks (the pipeline now carries `typecheck:test`), 706 tests.
4. [x] Render oracle **unmoved** at `0ac8e09fbbd40077f246d4774da60789cc8b3dbd` — no re-baseline
       needed, which is the proof the change was structural and altered no meaning.
5. [x] Round-trip run — with the prompt defect above recorded rather than hidden.

One gate needed repointing: the non-vacuity witness asserted `canon/skills/wake/skill.ts → schema`,
an edge this repair legitimately removed. It now witnesses `canon/anatomy.ts → schema` — the
corpus→shapes edge is alive and has one anchor, the manifest module, which is where it belongs.
