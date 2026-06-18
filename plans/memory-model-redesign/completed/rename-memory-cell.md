# rename-memory-cell

**Owner.** Mav. **Deps.** redesign-memory-constitution.

**What.** Rename the memory home cell `identity-memory-stack` → `memory` (its content is now the whole memory home; the slug should be the anchor). Toolkit-coupled — Nico flags the rename, code lands through Mav — so it lands as **one global sweep**:

- `toolkit/compose/agent.py`: `GENUS_ORGANS = ("identity-memory-stack",)` → `("memory",)`.
- Prose/code refs in `toolkit/{place/seeds.py, init.py, verify.py, deploy.py, compose/agent.py}`.
- Rename `ideas/identity-memory-stack.md` → `ideas/memory.md`; sweep all `[[identity-memory-stack]]` → `[[memory]]` across `ideas/` + `docs/`; retitle `# Memory` (already done) and drop the "slug rename pending" note.
- Regenerate GLOSSARY.

**Exit criteria.** `resolve.py` + `verify.py` PASS; the composer emits the memory Protocol into all agent defs under the new slug; zero `[[identity-memory-stack]]` refs remain. Nico re-verifies the projection himself.
