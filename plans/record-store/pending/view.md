# view

**Wave 1.** Realizes `view`. Factors at `c501e002`: `fold`, `divergence`, `incoherence`, `unit`.

## Intent

A domain's current state rendered at query time for its reader (an agent: ρ = LLM), in three
layers:

1. a **header** naming the commit it was computed at, with counts;
2. **everything that must be resolved before the rest is trusted** — divergence, incoherence,
   drift, suspect units, owed rulings, open questions;
3. **the whole domain in its own structure**, one line per live item: the lattice root to
   primitive; the bound plan's units in wave order with the frontier marked in place (and the
   plan's own lifecycle state in the header); the notebook grouped by kind, then topic.

Design and plan views cross-reference — each concept shows how the plans stand on it, each unit
shows the concept it serves — and naming one item drills into it in full. No output ever carries
a record id, an envelope, a head as such, or a file path.

The view declares the shapes it renders (structural input types) and computes nothing a domain
owns: it receives lifecycle states and note kinds as display text, frontier and wave already
computed by `unit`, closure order as given, drift and suspect as flags, owed rulings as notes
naming what they block. It declares no lifecycle vocabulary (the `plan` skill's, received through
the runtime config), no note kind (the `note` skill's) and no closure (`design-domain`'s).
`domain-interface` maps each domain's fold onto these shapes.

Isolation: imports nothing from `packages/runtime/src/capabilities/` or `runtime-config.ts`, and
nothing from `record-store/` except read-only types if it needs them.

## Static

- `git show c501e002:docs/design/record-store.md` § How they are met (`view`, `domain interface`).
- `packages/canon/test/reader-register.ts` — the register ρ = LLM artifacts are held to.

## Deps

`record-store`

## Outputs

- `packages/runtime/src/view/**` (new)
- `.changeset/view.md`

## Accept

1. `pnpm --filter @cratylus/runtime typecheck` passes.
2. The return carries a smoke script and its verbatim output, run as
   `pnpm --filter @cratylus/canon exec tsx <absolute path>` over hand-built inputs for all three
   domains; a re-run reproduces the output. It shows: the first line names the given commit and
   the counts; a fed divergence, incoherence, drifted unit, suspect unit, owed ruling and open
   question all print before the body; a concept prints before its factors; units print in wave
   order with the frontier marked on its lines; notes group by kind, then topic; a concept line
   shows the units standing on it and a unit line shows its concept; drilling into one item prints
   it in full; no line matches `[0-9A-HJKMNP-TV-Z]{26}` even when the inputs are built from real
   entity ids.
3. `git grep -n "capabilities/" -- packages/runtime/src/view` prints nothing.
4. `git grep -nE "'(proposed|bound|closed|pending|ready|active|completed|idea|question|decision)'|closure" -- packages/runtime/src/view`
   prints nothing.
5. Sole: the return names the one entry point per domain that renders its view, and no module
   outside `packages/runtime/src/view/` exports a renderer of the three layers.
6. `.changeset/view.md` names `@cratylus/runtime`.
