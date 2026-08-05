# A canon cell matches on claude tool names, the schema forbids it, and codex silently drops it

> Census: [`CENSUS-2026-08-05.md`](../CENSUS-2026-08-05.md). **Ruling owed before execution** —
> the target of a move is indeterminate until it is made.

## Worse than filed — it is a behaviour divergence, not just placement

`canon/src/hooks/stance-guardrail-pre.ts:21` — `matcher: 'AskUserQuestion|Agent|SendMessage'`.

`forge/src/adapters/codex/anatomy.ts:275-303` builds its hook command from `command`, `timeout`, `id`
and **never reads `matcher`**. Confirmed in the renders: `.render-ts/settings.json` carries the
matcher; `.render-ts-codex/hooks.json` has **no matcher key**. So on codex the hook process is
spawned on **every tool call**, and it behaves correctly only because the worker self-narrows at
`:120-121` with the comment _"the matcher should preclude this; be safe"_.

Codex's own `matcher` (`adapters/codex/events.ts:31-37`) is a regex over `agent_type`, not tool name.
**The two harnesses do not share the field's meaning**, so a cell-level matcher cannot be
harness-neutral by construction.

## The schema has already ruled — and contradicts itself three ways

- `schema/src/hook/index.ts:38-41` — a harness mechanism _"lives HERE … and **NEVER on the source
  cell**"_. That is the law this breaches, stated by the schema.
- `schema/src/hook-cell.ts:86-91` nonetheless puts `matcher` on the source cell and documents it as
  _"client-native regex, e.g. `AskUserQuestion|Agent|SendMessage`"_ — **shipping the defect as its
  own example.**
- `schema/src/hook/generated.ts:52-55` describes the same field harness-agnostically.

Three descriptions of one field disagree. That is the real finding.

## Rulings owed, in order

1. **A canonical tool-class vocabulary.** Confirmed absent — 0 files match
   `ToolClass|toolClass|tool-class|CanonicalTool`. The shape already exists for lifecycle
   (`CanonicalEvent` + per-adapter maps). Sized like the lifecycle vocabulary, not like a rename.
2. **Which register owns `matcher`.** Until 1 lands, moving the field only relocates the claude string.

## Blast radius

27 hits / 8 files; **exactly one is structural** (`:21`). The rest is prose the LLM judge reads or
shell the worker branches on — do not sweep them.
