# mint-organs-glossary

**Objective.** Mint the composable-organ cells (per G1) with glosses from the σ\*\_LLM anatomy doc,
and ensure each organ has a GLOSSARY entry so an archetype's organ section is hover-legible.

**Preconditions.** G1 ruling final (the exact organ set + home). `docs/agent-conceptual-anatomy.md`
is the authoritative gloss source.

**Operations.**

1. For each composable organ, mint its cell (anchor = the σ\*\_R organ name; delineation from the
   anatomy doc, CE ∧ ME). Reconcile `memory` per G1 (re-kind, keep front-matter).
2. Confirm runtime organs are glossary-only (no cells).
3. Regen `GLOSSARY.md`; verify each organ resolves and renders.

**Artifacts.** organ cells under `packages/mind/<organ-home>/`, `packages/mind/GLOSSARY.md`.

**Acceptance (blind test).** Every organ named in an archetype section resolves to a glossary entry;
`verify.py` PASS (references + CE ∧ ME); no runtime organ has a cell.
