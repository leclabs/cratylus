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
import type { RuntimePlugin } from '@leclabs/agent-runtime';
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
- Suite green uncached; render oracle unmoved at `fe084dd1d531948979dc386713c3f688c96088ab` unless a
  projected byte was deliberately changed, in which case re-baseline explicitly.

## Outputs

- `packages/agent-schema/src/index.ts` — no `@leclabs/agent-runtime` import.
- Wherever the capability vocabulary lands, with its signification recorded.
- `packages/agent-canon/test/architecture.test.ts` — the `schema → runtime` ratchet pin **removed**,
  not re-pinned. A pin that stops failing FAILS the suite; that is the shrink working.
- `plans/decomplect/CRATYLISM-SWEEP.md` — the signification legs, including rejects.

## Acceptance

1. `grep -rn "agent-runtime" packages/agent-schema/src/` returns **no import**. (Pre-state: one, at
   `index.ts:35`. The control fails today.)
2. `packages/agent-canon/test/architecture.test.ts` carries **no** `schema → runtime` ratchet entry,
   and the suite is green — proving the pin was retired by repair and not by exemption.
3. `pnpm test --force` green, 9 tasks, no task cached.
4. `find packages/agent-canon/.render-ts packages/agent-canon/.render-ts-codex -type f | sort | xargs shasum | shasum`
   → `fe084dd1d531948979dc386713c3f688c96088ab`, or a deliberate re-baseline argued in the commit.
5. The capability vocabulary's sign round-trips: a forward argmin, a **blind reverse decode**, and an
   **occupancy check against this repo** — all three, because the cold reader cannot see occupied
   ground and `capabilities` is known-occupied.

## The refusal clause

If any check above fails, or if the ruling turns out to need a `MODEL.md` or `ARCHITECTURE.md`
change: **STOP and report.** A workaround here is a design decision, and that is not yours on this
task. Refusing is the correct outcome and it is worth more than a green tree.
