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

## Acceptance

- A canonical tool-class vocabulary exists with per-adapter maps, in the same shape `CanonicalEvent`
  already has — or the ruling records why tools are not events and what replaces it.
- **The codex divergence is closed and PROVEN closed**: a fixture asserts the narrowing survives
  projection to codex. **The control fails today** — `.render-ts-codex/hooks.json` carries no
  matcher at all, so the check convicts on the current tree.
- The schema stops disagreeing with itself: one description of `matcher`, in one register, and the
  doc comment no longer ships the defect as its example.
- The worker's `*) allow ;;` self-narrowing stays as defence in depth, but is no longer the **only**
  thing making codex correct.

## ▶ RULING 2026-08-05 — there must be NO tool-class vocabulary. Tools are not events; the act vocabulary already exists.

**A tool-class enum is a category error.** `CanonicalEvent` works because harnesses share a
_lifecycle_ — stable and closed. Tool sets are **open-world**: MCP servers add tools at runtime,
users add custom ones, and claude's and codex's sets overlap only in shell/file primitives. A closed
enum over a runtime-extensible set is permanently incomplete and every adapter map would be
near-empty. **This shard asked for the wrong artifact, and so did the census.**

**The vocabulary is DISCOVERED, and it is already written in the cell's own σ\*.**
`stance-guardrail-pre.ts:17` residue reads `permission-menu ⟨AskUserQuestion⟩ · dispatch-echo
⟨Agent · SendMessage⟩`. **The cell already factors three tool names into two acts, then flattens
back to three names four lines later.** The residue is the argmin; `matcher` is its lossy projection.

Extend `CanonicalEvent` by **two** members, in the grammar it already uses:

- **`operator.consult.pre`** — about to put a question or menu to the operator. Candidate set
  recorded: `principal.consult.pre` (runner-up) · `user.ask.pre` (rejected — `user` collides with
  deploy's install-scope `user`, and it is the _vendor_ word while the pivot is vendor-neutral) ·
  `elicit.pre` (rejected — occupied by the concept-recovery skill) · `decision.request.pre`
  (rejected — collides with `permission.request` **inside the same enum**).
- **`subagent.dispatch.pre`** — about to hand work to an agent; covers spawn _and_ message, and
  pairs as the pre-phase of the existing `subagent.start`/`subagent.end`.

Two members only. A third has no site.

**`matcher` belongs to `HarnessMechanism` ALONE and is COMPUTED, never declared.** The cell declares
the act; the adapter emits ⟨native event, native selector⟩. That makes cell-level harness-neutrality
**structural rather than aspirational** — no cell can spell a claude tool name again.

**Of the schema's three self-contradicting descriptions, `hook/index.ts:38-41` survives and the
other two die.** `hook-cell.ts:86-91` goes with the field. `generated.ts:52-55` describes a union of
two unlike things — path-glob narrowing (genuinely harness-agnostic) and tool-name narrowing
(harness-native) — and since **zero path-glob matchers exist in the corpus**, parsimony deletes
`matcher` from the schema entirely. A future path need arrives as its own field, never as an
overloaded `matcher`.

**Codex closes through the channel it already has**: where an adapter cannot narrow it routes
through the existing `warnings`/`skipped` path. **Silence is the defect, not the gap.**

**Do this together with `t-lifecycle-vocabulary`** — widening the adapter map codomain from `string`
to `{event, matcher?}` is the same edit that shard needs.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** cell-contract · **wave** 1
- **depends on** `t-worker-payload-seam-and-property-1` · `t-lifecycle-vocabulary`
- **writes** `packages/schema/src/hook/index.ts`
- **compiles against** `packages/canon/src/hooks/stance-guardrail-pre.ts`
- **evidence** `packages/canon/src/hooks/stance-guardrail-pre.ts` · `packages/schema/src/hook-cell.ts`
- **dispatchable** no ruling owed
