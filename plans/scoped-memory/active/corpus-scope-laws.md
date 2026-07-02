# corpus-scope-laws — the scope model in the corpus cells

**Lane** Nico · **wave(1)** · deps: none (SPEC is the static input) · **Status** pending (HELD until
Operator approves `../SPEC.md`).

## Static

`../SPEC.md` §1 (lattice + tag grammar) · §3 (encode clause) · §4 (routing table + hard rule) · §5
(surface table — the exact edit per artifact). Sources: `packages/agent-anatomy/ideas/memory.md`,
`packages/agent-anatomy/src/skills/{dream,wake,praxis}.ts` (cells), the `memory` skill cell.
`make-base.ts` regenerates `base.ts` after the cell edit.

## Scope

ONLY the §5 surfaces. One home per law: grammar in the memory cell schema section; routing table in
dream; orient+audit step in wake; sink law in praxis; verb docs in memory SKILL. No runtime code, no
deploy, no migration.

## Accept (falsifiers)

- Projected SOUL Memory Protocol carries the scope clause; kernel stays ≤ current length +1 line
  (over-carry = fail).
- dream cell states the §4 table verbatim-equivalent incl. the SELF/MEMORY hard rule; wake cell orient
  names project + active-plan `AGENTS.md` reads and the post-dream `audit` step; praxis carries the
  sink law. A blind reader executes dream routing from the cells alone (no SPEC access).
- Gates: `tsc` · anatomy suite (projection-stability, reader-density, null-organ, skill-shape,
  symbols) · build · lint — all green.
