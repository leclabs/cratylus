# routes is stamped by applyRoutes yet present on 0 of 46 live and archived records

> FILED, not specified. A stub: symptom + locus + provenance, no census, no
> acceptance. It exists so the defect was not chased when it was found. Whoever
> promotes it to `ready` owes it a real spec (`/praxis upsert`).

**Symptom.** `EpisodicRecord.routes` is documented as the dream pass's write-back — _"only the dream
pass stamps this, and only on records it retains"_ — and the write-back **is implemented and wired**:
`applyRoutes` builds the stamp map (`dream.ts:214-219`) and `compact` writes it in the same atomic
rewrite (`dream.ts:122-129, 226`). Yet **0 of 46** records across every live and archived stream
carry a `routes` key:

| stream                               | n   | with `routes` |
| ------------------------------------ | --- | ------------- |
| `mav/EPISODIC.jsonl`                 | 11  | 0             |
| `nico/EPISODIC.jsonl`                | 13  | 0             |
| `nico/EPISODIC.jsonl.bak-1784870751` | 22  | 0             |

Either `apply` is not the path in live use (the corpus hints at it: `mav/EPISODIC.jsonl.bak-dedup`
is a hand-chosen backup name, where the tool writes `.bak-<timestamp>` — and `verb-over-prose`
(`dream/skill.ts:54`) names hand-editing a tool-writable store as _the_ defect), or retention never
occurs and every record is consumed. **Both readings are inferences and neither was verified.**

Consequence if the first reading holds: the retain/consume distinction that `applyRoutes` computes
is never persisted, so nothing can distinguish a record seen once from one deferred repeatedly, and
`verb-over-prose` is being violated in the live corpus without any gate noticing.

**Locus.** `packages/agent-memory/src/dream.ts:214-226` · `packages/agent-memory/src/record.ts:32-37`
· the live homes under `~/.agents/`.

**Provenance.** Filed 2026-07-26 by S3 (`plans/close-out/SPEC.md`) while measuring Decision 4
(duplicate detection). Out of that shard's remit to chase.
