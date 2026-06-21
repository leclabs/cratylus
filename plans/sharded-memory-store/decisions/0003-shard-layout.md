# 0003 — Shard layout: granularity follows the organ's access pattern

- **Status:** Accepted (the on-disk model; realizes ADR 0001 D2, constrained by the verb spec 0002)
- **Date:** 2026-06-20
- **Deciders:** Mav (machinery — owns the shard machinery + `episodic` core). **One call reaches the
  constitution** (SELF stays a monolith) → flagged for Nico's Phase 3 ratification, below.

## Context

ADR 0001 D2 fixes _one-memory-one-file sharded; consolidation = `mv`, not a rewrite_; the verb spec
(`0002`) makes `encode` mint a ULID and write **one** new shard, `graduate` an `mv`, `forget` an
archive-move. This decision fixes the physical layout those verbs operate on: granularity, directory
model, frontmatter, naming — for one agent's `SELF` / `MEMORY` / `EPISODIC` home.

The load-bearing insight: **granularity is not uniform — it follows each organ's access pattern.**
`MEMORY` is recalled _by relevance_ (a set of discrete facts) → it shards. `SELF` is loaded _whole_ as
the reboot seed (a narrative whose value is its coherence) → it stays a monolith. `EPISODIC` is an
append-only event stream → it is already record-sharded (JSONL). One rule, three different outcomes,
each justified by how the organ is read.

## The layout

```
~/.claude/agents/<name>/              # the agent's home (scope-relative — ADR D8, never absolute)
  SELF.md                             # IDENTITY — one coherent file, loaded whole at wake (the seed)
  MEMORY/                             # SEMANTIC — one memory per file, recalled by relevance
    <ulid>.md                         #   a live fact shard (frontmatter + one-fact body)
    .archive/<ulid>.md                #   forgotten facts (archive-not-rm; excluded from recall glob)
  EPISODIC.jsonl                      # RAW STREAM — one record per line, append-only (unchanged)
  index.db                            # DERIVED recall index (D6; rebuildable; gitignored) — FUTURE
```

Cold tier is a **separate home**, not a subdirectory (ADR's hot-index → cold-corpus):

```
~/workspaces/obsidian/agents/<name>/  # the personal vault (cold) — graduated topic notes
  <kebab-topic>.md                    #   a consolidated, human-curated note (e.g. craft-ts-git-monorepo.md)
```

### `SELF` — stays a monolith (constitution-adjacent; Nico ratifies)

`SELF` is the **reboot seed**: read whole at wake, resumed as one continuous self. Its value _is_ its
narrative coherence (Who-I-am · Throughline · Open-threads) — sharding a throughline into atomic files
destroys the thing. It is also small by design (the dreamer keeps it small); a whole rewrite is cheap.
So `SELF` is **not** sharded. The expensive wholesale rewrite the charter names is `MEMORY`'s (≈38 KB
and growing), and sharding `MEMORY` removes ~all of that cost. **This is the one layout call that
reaches the [[memory]] cell's resident-layers model → Nico's Phase 3 ratifies it; here it is the
substrate recommendation.**

### `MEMORY` — one memory per file

Each durable semantic fact (today: one `## Facts I carry` bullet) becomes **one shard file**, matching
`encode`'s contract (mint one ULID → write one shard). Reconciliation (`consolidate`, D7) edits the
shard **in place**; `graduate` `mv`s it to the vault; `forget` moves it to `.archive/`. **Topic/relevance
is carried by frontmatter tags, not by directory clustering** — so a new fact never has to choose or
mutate a "topic file"; it is always a clean new shard, and `recall` does the topic-grouping logically.

### `EPISODIC` — already sharded

The raw stream is one open record per JSONL line, ULID-keyed, append-only — sharding _within_ a single
file. No change: it is the canonical record-shard already. `consolidate` drains it.

## Frontmatter schema (`MEMORY/<ulid>.md`)

```yaml
---
id: 01KVM1HS57… # ULID — equals the filename stem (time-ordered, host-portable; D8)
basis: observed # observed | inferred — the cheap-and-truthful provenance tag
encoded: 2026-06-20 # human-readable date (the ULID also encodes it)
topic: [deploy, fleet] # relevance tags — recall filters/ranks on these (no topic-dirs needed)
kind: craft # optional semantic kind: fact | craft | lesson | host | …
---
The memory body — one fact, prose. Exactly today's bullet text.
```

`basis` + `kind` mirror the verb spec's `Meta` (`0002`). `topic` is what makes a tag-indexed `recall`
(D6) possible without restructuring files.

## Naming — minted hot, curated cold

- **Hot (`MEMORY/`, `EPISODIC`):** the **ULID** is the name (`<ulid>.md` / the record `id`). Machine-minted
  by `encode`, time-sortable (`ls` is chronological), collision-free, portable. The agent never names a
  hot shard.
- **Cold (vault):** a **kebab topic-slug** (`craft-ts-git-monorepo.md`). Human-curated at graduation,
  because cold notes are browsed and `[[linked]]`. A graduation leaves a one-line **pointer shard** in
  `MEMORY/<ulid>.md` (`→ vault/<topic>.md`) so the hot set keeps the index entry (hot index → cold corpus).

## Where any new memory files (the blind-test table)

| The memory…                           | files at…                                    | via verb           |
| ------------------------------------- | -------------------------------------------- | ------------------ |
| a new durable semantic fact           | `MEMORY/<ulid>.md` (tagged)                  | `encode`           |
| an identity / throughline shift       | edit `SELF.md` (whole, narrative)            | _(dream writes)_   |
| a forward-looking next-step           | stays `EPISODIC.jsonl`                       | `encode`           |
| a fact that contradicts an old one    | edits the existing `MEMORY/<ulid>.md`        | `consolidate` (D7) |
| a durable-but-voluminous fact cluster | `vault/<topic>.md` + pointer shard in MEMORY | `graduate`         |
| a no-longer-true fact                 | `MEMORY/.archive/<ulid>.md`                  | `forget`           |
| a raw event, as it happens            | one line in `EPISODIC.jsonl`                 | `encode`           |

A reader can lay out one agent's `SELF`/`MEMORY` by hand from this table and predict where any new
memory lands — the acceptance bar.

## How the verbs land on the layout

- `encode(semantic)` → write `MEMORY/<ulid>.md` with frontmatter; `encode(episodic)` → append a JSONL line.
- `recall(MEMORY)` → no query: glob `MEMORY/*.md` (dotfiles excluded ⇒ `.archive/` skipped), load whole
  while small; with a query: filter/rank by `topic`/`kind`/text, backed by `index.db` once present (D6).
- `consolidate(EPISODIC)` → drain the stream, route each item, **edit target shards in place** (reconcile).
- `graduate(MEMORY→vault)` → `mv` the shard to `vault/<topic>.md`; write the pointer stub back.
- `forget(MEMORY)` → `mv` the shard to `MEMORY/.archive/` (recovery net; never `rm`).

No verb signature (`0002`) changes; this is purely the storage adapter's on-disk shape (ADR D1: files
are the source of truth, the index a derived rebuildable view).

## Open for Nico (Phase 3 — constitution)

1. **Ratify SELF-stays-monolith** in the [[memory]] cell's resident-layers model (granularity follows
   access pattern; only `MEMORY` shards).
2. Update [[dream]] routing to write **one shard per durable fact** (not a wholesale `MEMORY.md` rewrite)
   and [[wake]] load to **glob `MEMORY/*.md`** (not read one file). The verbs make both mechanical.

## References

- ADR `decisions/0001-memory-store-architecture.md` (D1 files-are-truth · D2 one-file-per-memory · D6
  derived-index · D7 reconcile · D8 portable-ULID identity).
- Spec `decisions/0002-verb-interface.md` (the five verbs this layout is the storage adapter for).
- Corpus: [[sharded-work-layout]] (one-unit-one-file · [[shard-by-orthogonal-concern]] ·
  [[cite-dont-copy]]) · [[memory]] · [[palimpsest]].
- Precedent: `../run-the-business/completed/vault-reference-home.md` — the cold topic-note idiom already
  live (`obsidian/agents/mav/craft-ts-git-monorepo.md`).
