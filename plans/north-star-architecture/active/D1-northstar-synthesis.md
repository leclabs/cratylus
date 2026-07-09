# D1 — north-star architecture: synthesis + mav debate → ratified target

**Concern (join):** synthesize the three censuses (C1·C2·C3) into ONE ratified north-star architecture for
the whole system, grounded in `ENGINE ⊥ MODEL` (ENGINE.md) and the VISION ("author semantics once, realize
behavior everywhere; canon is the source of truth, targets are projections"). nico is the design authority;
mav subagents are the adversarial reviewers that keep the synthesis honest.

**static (pinned inputs):**

- `../census/C1-package-boundaries.md`, `../census/C2-forge-memory.md`, `../census/C3-citation-memory-prose.md`
- `VISION.md`, `MODEL.md`, `ENGINE.md`
- the draft north-star: `../NORTH-STAR.md` (nico authors it first, then debates)

**method (Operator-directed):**

1. nico authors `NORTH-STAR.md`: (a) current-state wiring diagram (packages · modules · real edges incl.
   the invisible path/string edges D3); (b) enumerated principle-violations → resolution; (c) target-state
   diagram + the module-boundary law; (d) the resolved design FORKS with rationale.
2. Dispatch ≥3 mav subagents, each a DISTINCT adversarial lens:
   - M1 package-boundaries / SoC / dependency-inversion (the forge↔memory D4 seam; toolkit relocation);
   - M2 functional purity / DI / duplication (A1-A5, C1-C6; pure-core extraction);
   - M3 memory-tool-ownership + citation semantics (B1 seeds; genus prose-vs-tool; the C3 composition fork).
     Each mav must try to REFUTE the draft and propose a better cut, not rubber-stamp.
3. Iterate: nico integrates/rebuts; re-dispatch until convergence.

**accept (falsifier — convergence gate):**

- `NORTH-STAR.md` exists with current + target diagrams, violation→resolution table, and each design fork
  resolved with explicit rationale;
- ≥3 distinct mav reviews recorded, each with a verdict, and every surviving objection either adopted or
  rebutted in-doc (no open objection left unaddressed);
- the target architecture is REGENERABLE-consistent (does not violate MODEL invariants or introduce a
  package cycle — forge still MUST NOT import anatomy);
- the C3 citation fork is resolved by a COLD (Ω\*) reading, not by corpus deference.
- OUTPUT then presented to the Operator for sign-off (the irreversible refactor is human-gated).

**dep:** C1, C2, C3 (all completed). **owner:** this session.
