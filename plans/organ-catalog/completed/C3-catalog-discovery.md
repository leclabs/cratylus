# C3 — Catalog discovery: de-drift the builder skill

**Lane** Nico (catalog contract + create-agent) + Mav (`koine catalog` CLI) · **Depends on** the inversion
(catalog-as-TS + koine-as-tool, done) · **Enables** C1, C2.

## Problem

`create-agent` embeds the organ catalog as a **hand-maintained table in its skill body** (the "## The organ
catalog" section). It is a static snapshot: the moment a value is added/renamed in
`packages/mind/src/organs/<organ>/*.ts`, the builder's option-space silently drifts from the corpus. C1/C2
would force manual table edits and still rot. The catalog must be discovered, not embedded.

## Scope

1. **Single-source the catalog** — the typed organ-value modules ARE the catalog (already true). Define the
   enumeration contract: `organ → [{ slug, definiens }]` (+ open/closed + arity per organ from the koine
   anatomy types). No second copy.
2. **`koine catalog` CLI verb** (Mav) — read a typed organ-module corpus → emit the catalog as JSON (machine)
   and a table (human). koine owns the _mechanism_ (it types the 24 organs); the corpus (mind) supplies the
   _data_ — koine stays doctrine-agnostic (mirror T3.1: "consumes a render tree, not the corpus"). Point it
   at mind by default-or-flag; it must work for any organ-module corpus.
3. **Rewrite `create-agent` to discover** — replace the embedded catalog table with a step that runs
   `koine catalog` to obtain the current option-space (closed enums + open sets + recommended default
   ordering). The skill keeps the _protocol_ (one question per organ, default-first) but the _values_ come
   from the live catalog.

## Acceptance criteria

- `koine catalog` enumerates every organ's values from the TS modules (JSON + table); a value added under
  `src/organs/<organ>/` appears with no other change.
- `create-agent` no longer hard-codes the value lists; its option-space == the live catalog (a drift test:
  add a fixture value → it shows up in the builder's options without editing the skill).
- `pnpm build/test/lint` green; the skill still projects/deploys correctly.

## Out of scope

Adding values (C1/C2). The recommended-default _ranking_ policy can stay a thin per-organ ordering hint in
the corpus; designing a richer ranking is a follow-up.

## Done (2026-06-24)

`koine catalog` enumeration verb landed (Mav): `enumerateCatalog` + CLI (`koine catalog [--json]`) + a
runtime `ANATOMY` descriptor that is **type-derived** (`MetaOf<OrganAlias>` projects each `Fragment`'s
phantom axis/kind/arity, so a wrong entry is a COMPILE error — single-sourced, drift-proof). koine commits
`4b5dca0` (a pre-existing T3.1 typecheck bug it caught + fixed) + `8f457b9` (catalog). Consumer half (Nico):
`create-agent` rewritten to **discover via `koine catalog`** — the embedded value-table is gone; the skill's
option-space now tracks the corpus with zero drift (`b3576e6`). Nico re-verified independently incl. the live
verb (24 organs, correct axis/kind/arity), byte-identical `create-agent` SKILL.md, verify.py PASS, and
**typecheck** (the gate I'd been omitting — see below). Note: the T3.1 typecheck-red was shipped because the
repo's "green triad" (build+test+lint) omits `typecheck`; **typecheck is now part of the re-verify gate.**
