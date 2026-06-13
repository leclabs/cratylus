# A1 — found-the-founders

**State:** completed (2026-06-13) · **Lead:** Nico · **Phase:** A (constitution) · **Implements:** Operator recommendation #1

## Intent

Make `principal-ic` **essence, not accident** for the two founders, and author the founder charter as
the constitution's first cell — the society's first authored act is the one that defines its founders.

## Today

- `packages/mind/AGENTS.md` carries `grant @nico [[principal-ic]] on ./mind/*` — a **path-scoped
  accident** (and the path is now stale post-move). Mav holds principal-ic by an analogous grant.
- The founders' roles are described in prose (README/AGENTS) but not authored as corpus.

## Work

1. Introduce a **founder genus**: `principal-ic` (and the founder boundary) emitted for every founder
   agent *qua* founder — like the genus dispositions the resolver already adds to all agents
   (`semantic-whole-over-syntactic-substrate`). Bind it to the **polis subject**, not a directory.
2. Author the **founder charter** cell: Mav = master builder of infrastructure/substrate; Nico = master
   builder of constitution/society; the boundary and the co-equal founding. Reference it from nico.md / mav.md.
3. Remove the stale path-grant from `packages/mind/AGENTS.md`; replace with the subject-bound founder genus.

## Done-when

- nico and mav embody `principal-ic` intrinsically (resolver-emitted founder genus), bound to subject.
- No `on ./mind/*` path-grant remains; the founder charter cell exists and verifies.
- `verify.py` PASS; round-trip `accept` holds on the founder cells.

## Notes

- This is the prerequisite the repo move already forced (the `./mind/*` path can't survive). Doing it as
  authored corpus (not a quick edit) is the point — it's the constitution's seed.


## Outcome

- **founder genus** in `toolkit/compose/agent.py`: `FOUNDER_DISPOSITIONS = ("principal-ic",)` beside
  `GENUS_DISPOSITIONS` (emission rule = machinery); `founder_slugs()` reads the roster from the charter's
  `## Founders` section (who-is-a-founder = constitution, not hardcoded). Founder genus leads the list. No new
  front-matter field — taxonomy mandates minimal front-matter (kind + delineation).
- **`ideas/founder-charter.md`** authored (kind: concept) — the binding family's third member: scope-grant
  binds capability-on-path, subject-binding binds whom-served, founder-charter binds who-founds. nico
  (constitution) + mav (substrate), co-equal; principal-ic = essence-on-subject, not grant-on-path.
- **`ideas/nico.md`** references the charter (gains principal-ic via genus — formula unchanged).
  **`ideas/mav.md`** drops `[[principal-ic]]` from his `≜` (now genus, one home) + references the charter.
- **`packages/mind/AGENTS.md`**: stale `grant @nico [[principal-ic]] on ./mind/*` removed; `## @nico` cites
  the founder genus + charter.
- **Verified**: schema/refs/fences gates PASS (zero new errors). Founder cells round-trip clean (in-memory:
  idempotent re-composition, header-hash == body-hash, principal-ic emitted, charter-linked). Full local
  deploy skipped (C4-adjacent; avoided scope creep).

## Finding (→ polis-machinery / C)

polis has **no green baseline**: `verify.py` ROUNDTRIP + the toolkit test suite are red on fresh checkout —
(a) no local `.claude/` projection (deploy projects from playground until C4), (b) fixtures reference
deleted/playground-only cells (`bona`, `reductio`, `confusio`). Substrate concern; surfaced, not owned by A1.
