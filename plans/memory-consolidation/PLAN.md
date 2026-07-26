# memory-consolidation — PLAN

> Working handle, **not** an anchor. Reader = LLM. The plan names a concern, not a concept; if the work
> mints anything public, the anchor is derived then, never inherited from this directory name.

**Status: PROPOSED — sharded, wave-0 ready. R1/R2 are census/research and run concurrently; S3 (the
execution spec) is the deliverable and is gated on both.** Authored by mav 2026-07-26 from operator intent
plus a live census of `packages/agent-memory/src`.

## Intent

The memory system is fragile and its output is poor. Operator statement of the problem, verbatim in
substance: procedural bloat, duplicate memories, memories restating things already in source context,
semantic routing errors during drain, and clunky `agent-memory` ↔ `agent-canon` skill integration. The
remedy sought is **reorganization and bug-fixing, not a redesign** — with mechanism maximized and inference
reserved for where it is genuinely needed.

Operator hypothesis, carried as a hypothesis and not a conclusion: _the tooling should drive the agent
through consolidation, and the agent writing a memory should emit, at write time, the semantic signals
routing needs at drain time._

## Census — what is already established (do not re-derive; these are measured)

`packages/agent-memory/src`, 4458 LOC across 18 modules. The relevant seam:

| fact                                                                                                  | source               |
| ----------------------------------------------------------------------------------------------------- | -------------------- |
| `route : I → {SEMANTIC · PROCEDURAL · EPISODIC · drop}`; `drop` is absent-target, not a store         | `route.ts:1–30`      |
| The **classifier is the agent**, at drain time. `route.ts` is types + an apply engine only.           | `route.ts:40–50`     |
| `EpisodicRecord.body` is `JsonValue` — free-form, unstructured                                        | `record.ts:15–25`    |
| `tags` exist but are **"Refine, never route (SPEC D2/D4)"** — routing may not consult them            | `record.ts:26–27`    |
| `scope` / `path` are v1 legacy, explicitly **INERT**; the fold never reads them                       | `record.ts:28–31`    |
| `routes[]` is stamped only by a dream pass, only on retained records                                  | `record.ts:32–37`    |
| Verb surface: `init encode read node home fold lock session migrate drain apply get replace rollover` | `verb-port.ts:38–52` |

**The architectural finding this yields.** There is **no write-time routing signal, by design** — `tags` is
the obvious carrier and is contractually forbidden from routing. Every routing decision is therefore 100%
deferred inference over free-form prose, performed at drain, with no structured input. That single fact is
sufficient to explain mis-routing, duplication (nothing to dedup _on_), and unbounded `PROCEDURAL` growth
(no mechanical admission test). It also means the operator's hypothesis is **architecturally well-founded**
— but whether write-time signals are the right remedy, or merely the obvious one, is R1/R2's to answer.

## Shards

MECE. R1 and R2 are wave 0 and independent — dispatch concurrently. S3 is wave 1 and consumes both.

| shard                                                            | wave | deps   | state   |
| ---------------------------------------------------------------- | ---- | ------ | ------- |
| [R1](./ready/R1-prior-art.md) — prior-art survey                 | 0    | —      | ready   |
| [R2](./ready/R2-defect-census.md) — reproduce the defects        | 0    | —      | ready   |
| [S3](./pending/S3-execution-spec.md) — author the execution spec | 1    | R1, R2 | pending |

```text
wave(0) = { R1, R2 }
wave(1) = { S3 }
```

**S3 is the deliverable this praxis exists to produce** — the follow-up execution-spec generation task the
operator asked be recorded rather than improvised now. It is deliberately `pending`: authoring a spec
before the prior art is read and before the defects are reproduced is how the current implementation got
clunky, and repeating it here would reproduce the failure at one level up.

## Constraints (bind every shard)

- **Reorganize, do not redesign.** A proposal that rewrites the store model, changes the CoALA
  four-part taxonomy, or replaces the fold engine is out of scope and must be recorded as a separate
  finding rather than folded in.
- **Mechanism over inference.** Every routing decision that can be made deterministically must be, and the
  spec must state, per decision, whether it is mechanical or requires a model — and justify each model call.
- **Measure, do not assert.** Each claimed defect is reproduced against real store contents before it is
  designed against. A defect that will not reproduce is recorded as not-reproduced, not quietly designed for.
- **`cratylism`.** Any new verb, field, or store name is cold-derived, never coined. Undiscovered ⇒ ⊥ and the
  spec says so.
- **No `git push`.** Operator-gated.

## Out of scope

Cross-host / vault sync, the `agent-runtime` port boundary, and the harness session-id bridge. All are
adjacent and all are working; touching them widens this into the redesign the operator explicitly excluded.
