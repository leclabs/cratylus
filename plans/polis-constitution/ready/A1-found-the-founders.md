# A1 — found-the-founders

**State:** ready · **Lead:** Nico · **Phase:** A (constitution) · **Implements:** Operator recommendation #1

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
