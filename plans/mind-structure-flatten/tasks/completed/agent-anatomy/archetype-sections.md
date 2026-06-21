# archetype-sections

**Objective.** Restructure each agent archetype so its **named sections are its anatomy**, each
compositing its organ **by reference** (`[[organ]]` + per-agent delta), and **remove the hardcoded
`GENUS_ORGANS` composer list** so sections — not a hardcode — drive SOUL composition.

**Preconditions.** G1 organ set decided + `organ-cells/mint-organs-glossary` landed. Current
composer injects `memory` verbatim via `GENUS_ORGANS`; agent cells today carry only `## Persona`

- a `≜ embodies [[disposition]]` line (see `agents/mav`).

**Operations.**

1. Define the anatomy section template (Persona, Mandate, Memory, Sensors, Ledger, … per G1).
2. Convert each of the 11 agent cells to the section structure; each section references its organ
   cell; per-agent deltas stay in-section. Preserve every existing disposition/persona delta verbatim.
3. Replace `GENUS_ORGANS` with section-driven organ expansion (memory stays `render: verbatim`).
4. Byte-identity: the rendered SOULs must be unchanged (enumerate any deliberate delta).

**Artifacts.** `packages/mind/agents/*.md`, `packages/mind/toolkit/{compose,resolve}.py`.

**Acceptance (blind test).** Rendered SOULs `diff` identical to baseline for all 11 agents, AND
`grep GENUS_ORGANS toolkit/` returns nothing — composition is section-driven.
