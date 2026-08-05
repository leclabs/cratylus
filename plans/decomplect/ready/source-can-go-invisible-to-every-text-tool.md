# source-can-go-invisible-to-every-text-tool

## Symptom

`packages/forge/src/adapters/codex/render.ts` was authored with two raw NUL bytes
embedded in a template literal, as separators in a dedup key:

```
const key = `${hook.id ?? '?'}<NUL>${native}<NUL>${binding.matcher ?? ''}`;
```

The choice is defensible on its own terms — NUL cannot occur in a hook id, a native
event name, or a matcher, so the key is injective. What it also did:

- `file` reported the source as `data`.
- BSD `grep` reported **"Binary file … matches"** and printed **no lines** — for
  every pattern, including ones that matched. Exit code 0. Success, and silence.
- The `Read` tool rendered the NULs as spaces, so the source displayed a
  **space-separated key that was not the key being built**.

Measured consequence, in this session: a grep for `CODEX_AGENT_SCOPED_EVENTS`
returned one hit when `git grep` returned five, all four missing hits being in this
file. That false negative supported a conclusion — "the symbol is orphaned, the
shard that rewrote this file left a doc asserting a policy it no longer implements"
— which was wrong, and which was one edit away from deleting live code. The
instrument failed open and looked like evidence.

## Locus

Any authored source file. The failure is not specific to NUL: BSD `grep` classifies
a file binary on any byte it cannot decode in the active locale, and returns nothing
while exiting 0.

## Provenance

Found while integrating `t-tool-class-vocabulary`. The NUL was introduced by that
shard's execution and is **already repaired** — the key is now
`JSON.stringify([...])`, injective for the same reason and printable. A scan of all
619 tracked files found no other instance, so this is not a standing corpus defect.

## What is owed

A gate, not a repair. The repair is done; what is missing is the thing that would
have caught it without a person happening to run `file`.

A tracked-source scan asserting no authored file carries a control byte outside
`\t \n \r`. Cheap (one pass over `git ls-files`), and it convicts the exact failure
that makes every other gate in this corpus unable to see a file.

Note for whoever builds it: the harness's own `Bash` tool **rejects** commands
containing control characters, with the reason that they "would be hidden in the
approval dialog". That is this defect's argument, already accepted one layer up.
The convicting fixture must therefore construct the byte programmatically
(`String.fromCharCode(0)`), never as a literal — the same constraint the
`signify-marker-class` gate works under, and for the same reason.

Per the meta-gate: needs a `gate-convicts.test.ts` REGISTRY entry and a fixture
whose name matches the convicting-name pattern.

## Acceptance

- A gate exists that reds on a tracked source file containing a control byte
  outside tab/newline/CR, and greens on the live tree.
- Its convicting fixture builds the byte programmatically and is proven to fail
  before the exoneration leg is trusted.
- Registered in `gate-convicts.test.ts`.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** deploy-surface · **wave** 0
- **depends on** —
- **writes** `packages/canon/test/authored-source-is-text.test.ts` · `packages/canon/test/gate-convicts.test.ts`
- **compiles against** —
- **evidence** `packages/canon/test/gate-convicts.test.ts`
- **dispatchable** no ruling owed
