# audit-residual-findings

**State:** ready · **Lead:** Nico · **Source:** the bounded 8-auditor CE∧ME sweep (2026-06-17). The high-confidence findings were fixed in `6bc95b5`; these are the **med-confidence** residue — real but minor, deliberately not rushed.

## Findings (each: re-verify by direct read before acting — auditors over-claim)

1. **`self-sufficient-formalism`:19-20 — CE gap in the closure cell's own block (the notable one).** The block
   uses free function symbols `behavior(concept)`, `use(s)`, `definition(s)` on the RHS of `complete(B)` and
   `ordered(B)` with no defining line, no table row, no β/ι binding — so under the cell's OWN `closed(B) ⇔ S ⊆
   T ∪ D ∪ β ∪ ι` test, they are undeclared. The cell that *defines* closure should pass its own closure test.
   Fix = add definitional lines or bind the symbols — but carefully (don't over-formalize the keystone). Med.
2. **`provenance`:15 ↔ `regenerate-without-clobbering`:10 — overlap.** Both assert "the recorded X is the common
   ancestor for a three-way merge" (different X: upstream source-version vs self-output hash). NOT fusible
   (distinct ancestors/boundaries), but provenance could CITE regenerate's ancestor claim instead of re-asserting.
3. **Med over-narration in principle/concept cells** (cited glosses — acceptable corpus style, low priority):
   `continual-agency`:8 (restates ambient-person-agent self-clocked + never-go-silent), `pulse`:10 (phase-by-phase
   re-narrates principal-agency/dont-blind-wait/dream/episodic-encoding), `principal-agency`:11 (recaps the
   recommendation tail, but cited), `nico`:8 (narrates mece/pyramid/rigidity not in its ≜), `senses`/`powers`
   "voice" framing stated 3× with drift, `sharded-workflow-layout`:10-11 (re-bullets genus properties the sibling
   `sharded-plan-layout` cites). `densest-faithful-point`:12 ↔ `context-pathologies`:32 (the anti-density list —
   designed seam, likely fine), `exemplify`:43-51 (the json manifest spec — operational, likely fine).

## Note

These were judged NOT worth blocking on this session: the high-confidence three are done, and #3 are mostly
legitimate cited glosses (a brief characterization at a citation is normal in a prose principle cell — not every
gloss is the cite-once violation the prose-free standard targets in *pipeline* cells). Pick off #1 + #2 in a
focused pass; weigh #3 case-by-case against over-trimming cells into crypticness.

## Done when

- `self-sufficient-formalism`'s block passes its own `closed(B)` test (or the trio is explicitly table-declared).
- #2 resolved (cite-not-restate). #3 weighed and either trimmed or explicitly accepted as cited-gloss.
