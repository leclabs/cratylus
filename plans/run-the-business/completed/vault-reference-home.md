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

---

## Outcome — DONE 2026-06-20

**Finding (Operator's question — "did we lose the spec?").** No. The type→home routing table **with the
vault row** (reference → vault), the hot-index/cold-vault split, and the MEMORY→vault graduation rule are
all intact + CE∧ME-clean in `lexicon/structure.md` (`^memory`) and `dream.md` (§4 cascade). The table's
**voice column** _is_ the "which type goes where" explanation; it survived minimization. The only thing
never in the corpus is the concrete Obsidian binding — correct by design (substance-over-accident): the
commons keeps `vault` abstract; the instance binds it. Nico re-verified independently (exit criterion 3).

**Operational binding (per Nico's substance/accident ruling — outside the corpus).** Documented as a
directive in polis `AGENTS.md` (`## Memory vault`) + an agent-held MEMORY fact (the host-derived path):

- **Personal** = the fleet-synced Obsidian git repo `~/workspaces/obsidian/` (`leclabs/obsidian`,
  `~`-relative → portable per host); agents write under `agents/<name>/` as sharded notes.
- **Project** = repo `docs/`.

**Graduation proven (exit criteria 1 + 2).** Graduated two voluminous TS/git/monorepo craft clusters from
my MEMORY → one sharded vault note `agents/mav/craft-ts-git-monorepo.md` (committed to `leclabs/obsidian`
`bc56ad1`); MEMORY now keeps a single one-line pointer (32060 → ~30800 B). Queryable on demand by path;
not loaded at wake. Convention is forward-compatible with the `sharded-memory-store` follow-up.
