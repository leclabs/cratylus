# vault-reference-home

**Owner.** Mav. **Deps.** redesign-memory-constitution. **Priority.** Lower — cold path, not load-bearing for wake.

**What.** The Obsidian vault as the 5th home — cold, networked, queried/linked **on demand** (vs the hot resident
SELF/MEMORY loaded wholesale at wake). Holds evergreen concept notes, research/literature, full ADR rationale that
AGENTS.md only points to, domain maps. Scoped: personal (fleet-synced) + project (repo `docs/`). A fact graduates
**MEMORY → vault** when durable but too voluminous to stay resident, or when it wants links; MEMORY keeps only the
hot index/pointer into it.

**Exit criteria.**

- A fact graduates MEMORY → vault and remains queryable on demand; MEMORY retains only the pointer.
- Vault scoping works (personal fleet-synced; project in repo `docs/`).
- Nico re-verifies the hot-index / cold-corpus split himself.
