# 0003 — Memory-section convention: `## Memory` → `- binds [[memory]]` (ratified)

- **Status:** Accepted (Nico ratification — corpus-convention owner)
- **Date:** 2026-06-20
- **Deciders:** Nico (corpus conventions, the `cite-dont-copy` discipline) · Mav (applied the section to all 11 archetypes as the section-driven `GENUS_ORGANS` replacement)

## Context

G1 (`decisions/0001-organ-taxonomy.md`) ruled organ-as-slot: an organ is a **named section
inside an archetype** that composites its organ concept **by reference**, never a directory the
archetype is filed under, never a `kind`. D5 mandated the hardcoded `GENUS_ORGANS=("memory",)`
composer list be **removed** so anatomy sections drive composition. Mav implemented the section
mechanism (`compose/agent.py: section_organ_refs`) and, to keep `memory` rendering into every
SOUL, added a uniform `## Memory` section to all **11** archetypes:

```md
## Memory

- binds [[memory]]
```

`section_organ_refs` scans every `## ` section other than `## Persona` for `[[ ]]` refs, and the
composer renders the `render: verbatim` ones it finds (here, `memory`'s `## Protocol`) at the
position the old hardcoded list occupied. This gate ratifies the **section name** and the **ref
form** against corpus convention.

## Decision

**Ratified as-is. `## Memory` → `- binds [[memory]]` is the correct shape.** No change requested;
Mav's 11-archetype application stands. The byte-identity gate holds (the rendered fleet is
unchanged: `diff -rq` of `.render` pre/post = empty; `verify.py` PASS).

### Why this shape is right (the convention test)

- **D1 — The ref form obeys `cite-dont-copy` AND the composer's boundary-bind rule.** The toolkit
  requires dependencies be boundary-bound with **"binds" prose**, never `X ≜ [[cell]]` in prose
  (`toolkit/AGENTS.md`, composer gotchas — a prose `≜` is consumed as the composition formula).
  `- binds [[memory]]` is exactly that idiom: it composites the organ **by reference**, one home,
  never restates the protocol body. A bare `- [[memory]]` would also resolve, but the `binds` verb
  makes the compositional intent legible to a human reader and matches the established cite idiom —
  it earns its two words.

- **D2 — The section name matches the organ concept's anchor (hover-legibility).** `## Memory`
  names the `memory` organ whose meaning is glossed once as a cell. The section heading IS the
  organ name, so a reader hovering the section sees the organ it carries — satisfying CE
  (every organ named, hover-legible) from G1. A divergent name (`## Disposition-Memory`,
  `## Continuity`) would split the section heading from the anchor it binds and break that legibility.

- **D3 — Uniform across all 11 archetypes is correct, not redundant.** `memory` is a **genus
  organ** — every agent embodies it _qua_ agent (the identity-&-memory protocol). Pre-flatten this
  was the single hardcoded `GENUS_ORGANS` entry emitted for all. The section-driven replacement must
  therefore appear in **every** archetype, or that agent loses its SOUL protocol and byte-identity
  breaks. The uniformity is the genus-organ semantics made explicit in each archetype's anatomy,
  which is the whole point of retiring the hidden hardcoded list (composition is now visible at the
  source, [[cite-dont-copy]] honored, no magic list).

- **D4 — Non-verbatim organ sections are byte-neutral, so the anatomy can grow.** Because the
  composer renders only the `render: verbatim` organ-section refs it finds and treats every other
  organ-section ref as source-structure (never projected), an archetype can later declare fuller
  anatomy sections (`## Telos`, `## Heuristics` → the 8 glossary organ concepts) **byte-neutrally**.
  The `## Memory` convention is the first instance of a general, extensible section idiom — exactly
  the shape G1 intended.

## Consequences

- The 11-archetype `## Memory` sections are **canon**; future archetypes (and `init.py`-founded
  societies) carry the same `## Memory` → `- binds [[memory]]` section. Any new genus organ that
  must project follows the same idiom: a `## <Organ>` section binding the organ cell by reference.
- `ideas/AGENTS.md` documents this section idiom (the `render: verbatim` front-matter note + the
  _Agent cells_ anatomy-section paragraph) so a fresh contributor places a new agent + organ
  correctly on first try (the `docs/update-conventions` acceptance gate).
- No change is flagged back to Mav. This decision closes the convention question for the plan.

## References

- G1 ruling: `decisions/0001-organ-taxonomy.md` (organ-as-slot, D5 `GENUS_ORGANS` removal).
- Mechanism: `packages/mind/toolkit/compose/agent.py` (`section_organ_refs`, `ORGAN_SECTION`).
- Convention: `packages/mind/ideas/AGENTS.md` · [[cite-dont-copy]] · `toolkit/AGENTS.md` (boundary-bind rule).
