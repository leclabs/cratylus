# 0002 — Flatten scope: composites only; primitives stay lexicon-blocks

- **Status:** Accepted
- **Date:** 2026-06-20
- **Deciders:** Mav (machinery founder, principal-ic lead) — conatus session; the Operator delegated this call to Mav.

## Context

`mind-structure-flatten` removes the γ2-B nesting. Two storage forms exist today:

- **Primitives** (`concept · principle · process · structure · utility · classification` + `gloss`)
  live as `<!-- ^anchor -->` blocks in `packages/mind/lexicon/<kind>.md` — one file per kind, each
  block's body the verbatim original cell bytes up to the next marker.
- **Composites** (`agent · skill`) live as files under `packages/mind/mind/<kind>/<organ>/<slug>.md`.

`cells.py` is already storage-polymorphic (parses flat · dir-form · composite · lexicon-block
identically), so neither form is forced by the toolkit.

This gate decides one thing: does the flatten **also** re-home the ~150 lexicon-block primitives to
`packages/mind/<kind>/<slug>.md` (one file each), or **only** the composites?

## Decision

**Composites only. Primitives stay as `lexicon/<kind>.md` blocks.** Primitive re-homing is explicitly
**out of scope** for this plan and becomes a separate, later, _optional_ plan — gated on a concrete
motivating need, not on uniformity for its own sake.

### Numbered decisions

- **D1 — The load-bearing fix is the composite category error, which primitives do not have.**
  Filing a composite under `mind/<kind>/<organ>/` files a _many-organ_ thing under _one_ organ: an
  agent embodies many organs at once, so the path mis-models it (the anatomy _decomposes_ an agent;
  it does not _partition the set of agents_). A primitive belongs to exactly **one** kind, so
  `lexicon/<kind>.md` is a legitimate grouping, not a category error. The flatten exists to kill the
  category error — it has no motivation to touch primitives.

- **D2 — Re-homing 150 primitives is pure churn with no semantic gain.** 150 blocks → 150 files
  fragments git history and multiplies path surface for zero change in meaning or resolution behavior
  (an `[[anchor]]` ref resolves to its home transparently regardless of storage). "Every cell its own
  file" is an aesthetic pull, not a forcing function.

- **D3 — Lexicon blocks carry real _current_ benefits.** (a) **Verbatim byte-storage** — each block
  stores exact cell bytes, load-bearing for the byte-identity discipline and for `render: verbatim`
  organ cells; `lexicon/` is in `.prettierignore` precisely to hold that byte contract. (b) **Density
  / one-file-per-kind browsing.** Re-homing forfeits both for nothing.

- **D4 — The call is reversible; defer the boundary.** A later plan can still re-home primitives if a
  concrete need arises (per-primitive companion assets, or per-primitive cross-links wanting their own
  file). Until such a need is named, YAGNI — do not pay the churn for a future that has not arrived.

- **D5 — Scope boundary with G1.** This ruling governs only the **genuine primitive kinds** above.
  The storage of any **organ cells** minted by G1 (`decisions/0001-organ-taxonomy.md`) and the special
  `memory` cell's storage/front-matter are G1's call, not this gate's — G2 does not constrain them
  beyond leaving the primitive kind-blocks in place.

## Consequences for downstream tasks

- `toolkit/flat-storage-support` — keep `lexicon/<kind>.md` block parsing intact; flatten work targets
  composites only. No primitive-path migration code.
- `migration/move-composites-flat` — moves composites out of `mind/<kind>/<organ>/`; **does not touch
  `lexicon/`**.
- The byte-identity / no-loss gate (the γ2-B technique: `diff -rq` the rendered fleet pre/post = empty)
  still governs the whole move.
