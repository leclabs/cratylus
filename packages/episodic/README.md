# @leclabs/koine-episodic

The portable **EPISODIC** event store — the runtime that backs an
[ambient person-agent](../../mind/ideas/memory.md)'s raw memory stream.

EPISODIC is a JSONL event log. Each record is encoded **minimal and open** — no
taxonomy is forced at capture; the Dreamer applies routing later by reasoning
over the body. Portability is the invariant: a record stores `(scope, path)`, never
an absolute path or a one-way hash, so the same logical store resolves correctly
on any host (`/Users/lex` vs `/Users/lcaraccioli`).

This is the **commons reference library**. Oikos (the runtime instance) adopts it;
this package owns the store, the ULID source, and `resolveFile`.

## Install

```bash
npm install @leclabs/koine-episodic
```

## Public API

```ts
import {
  // ULID — lexicographically time-sortable ids
  ulid, monotonicFactory, decodeTime, isValidUlid,

  // Scope + portability
  Scope, HostEnv, createHostEnv, resolveFile, parseScope, assertScope,

  // Record shape
  EpisodicRecord, serializeRecord, parseRecord, assertRecord,

  // The store
  EpisodicStore, groupByStore, parseLines, DEFAULT_EPISODIC_PATH,
} from '@leclabs/koine-episodic';
```

## The record

```jsonc
{ "id": "<ULID>", "scope": "user" | "project:<key>", "path": "<scope-relative>", "body": <open> }
```

- **`id`** — a ULID: 48-bit ms timestamp + 80-bit randomness, Crockford base32,
  strictly monotonic within a millisecond. Lines sort by time lexicographically.
- **`scope`** — single-valued. `user` travels with the agent; `project:<key>`
  stays with the project. If a fact is true in both, the encoder routes it to the
  more durable tier, never both.
- **`path`** — scope-relative; optional (defaults to `EPISODIC.jsonl`).
- **`body`** — any JSON value. Captured cheap and truthful; structured later.

No `home` (absolute) and no `fid` (hash): both would break portability.

## resolveFile — the portability core

```ts
const env = createHostEnv('/Users/lex/.claude/agents/mav', { polis: '/Users/lex/workspaces/polis' });

resolveFile(env, 'user', 'EPISODIC.jsonl');
// → /Users/lex/.claude/agents/mav/EPISODIC.jsonl

resolveFile(env, 'project:polis', 'notes/EPISODIC.jsonl');
// → /Users/lex/workspaces/polis/notes/EPISODIC.jsonl
```

`user → agentHome()/path`; `project:<key> → projectRoot(key)/path`. The stored
`(scope, path)` is the portable identity; each host derives its own absolute path.

## Encode (append-only)

```ts
const store = new EpisodicStore({ env });
store.encode({ scope: 'user', body: { decision: 'x', rationale: 'y' } });
// appends one JSONL line to <agentHome>/EPISODIC.jsonl
```

`encode` mints the ULID, builds the open record, and appends. Reconcile across
stores with `groupByStore` — groups by `(scope, path)`, orders each group by ULID.

## Out of scope

The dream routing engine (which adds `routes: [...]`) and compaction live in
separate tasks. This package is the store + encode + resolveFile only.
