# plans — polis plans

`sharded-plan-layout` dirs: `PLAN.md` is the backlog + status mirror; task files materialize into state
folders (`pending/ → ready/ → active/ → completed/`) as deps clear.

## Active

| Plan               | Concern                                                                                                                                                                               | Lead                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `run-the-business` | The standing plan — live backlog + standalone tasks; perpetual (never retires). Pending tails from retired `koine-absorbs-mind`: `minimal-delta-agents`, `provenance-out-of-context`. | Mav + Nico (per task) |

## Retired

A completed scaffold is removed once the source subsumes the result and the rationale has a durable home
([[doc-mirrors-runtime-truth]] · [[plan-retirement]]). git history is the recovery net — recover any with
`git log --all -- plans/<name>/` then `git show`.

**Founding-phase trio (retired at founding):**

- `polis-constitution` (A) — author the latent sociology as explicit corpus. Result: the constitution cells.
- `polis-machinery` (B) — operationalize projection (koine, the reconstruction oracle, hooks). Rationale: `packages/mind/toolkit/AGENTS.md`.
- `polis-instantiation` (C) — found real societies (`init`/`rebase`/`deploy`). Result: `packages/mind/toolkit/`; C closed 6/7 (C3 + apps.lan dropped, revivable).

**Post-founding initiatives (retired 2026-06-19):**

- `repo-structure-firstprinciples` — koine collapsed to one `@leclabs/koine` (core/adapters/cli → `src/`), episodic extracted then retired to a private build-only toolsource, `packages/*` flattened. Rationale: koine + `packages/mind/toolkit/` AGENTS.md; the `koine-` rename closed by deletion.
- `corpus-hardening` — post-founding refinement: cite-once sweep, verbatim-salience made canon, Prettier adoption, full-fleet redeploy. Result: the hardened corpus + `verify.py` gates.
- `anchor-fidelity` — "true anchor" made a falsifiable gated property (CSF acceptance law) + the corpus re-individuated minimal; minted the `canonical-semantic-factorization` cell. Result: minimal corpus + `verify.py` fidelity gate.
- `memory-model-redesign` — memory constitution collapsed to one `memory` home + JSONL-portable episodic; fleet migrated. Result: the memory cells + `packages/episodic` + the live JSONL fleet. Live tail (`vault-reference-home`) → RTB.
- `memory-tool-bundling` — a skill's runtime arm travels with the skill (companion-asset deploy + episodic bundled as a toolsource). Result on main: `98bd5b3`, `7087282`. Live tail (`memory-home-dual-deploy`, `wake-trigger-and-cutover`) → RTB.

**Corpus rebuild (retired 2026-06-22):** the `mind` corpus rebuilt from sourced model-native enums — agents
as organ-selection vectors, skills as self-sufficient set-builder, `lexicon/`+`GLOSSARY` demolished, the
`memory` cell restored. Result on main: `819c58c` (rebuild) + `f649b20` (memory); deployed fleet-wide. The
five plans it subsumed:

- `corpus-reindividuation` — re-individuate the corpus → MECE cells; superseded wholesale by the rebuild.
- `corpus-signify-pass` — σ\*\_R over every definition; absorbed into the rebuild's signification (firing-anchor enums sourced by blind model introspection).
- `mind-structure-flatten` — flatten the nested `mind/<kind>/<organ>`; done (flat `agent/`+`skill/` + organ-dir catalogs).
- `csf-canonicalization` — CSF acceptance + minimal corpus; landed (the `canonical-semantic-factorization` model + the R3 producer/consumer).
- `sharded-memory-store` — sharded memory behind a verb interface; delivered by the JSONL episodic store + the `memory` cell (encode/read/migrate + dream-consolidate).

**Canonical organ values (retired 2026-06-23):** the organ value catalog re-derived from blind model
introspection (2 rounds: 48 then 28 blind agents) — every organ classified open-vs-closed, ~60 bespoke
per-agent cells purged for a generalized opinionated LLM-reader value-set, all 11 agents rewired,
`weitermachen → carry-on`, `build-agent` layman wizard added. Result on `main` @ `510c66e`; **fleet 6/6
deployed + verified** (the 5 initially-unreachable hosts caught up via RTB `fleet-deploy-catchup`, now closed).
The scaffold dir is **kept** (decision docs `0001`/`0002` + raw blind audits are the durable rationale).

**agent-factory rename + inversion (retired 2026-06-30):** three initiatives wound down.

- `koine-absorbs-mind` — the inversion completed: TS modules under `packages/agent-anatomy/src/` are the
  sole source, `@leclabs/agent-forge` (ex-koine) owns the anatomy types + projection + deploy, markdown is
  a projection. Cutover (T6.1) + koine-native hooks (T6.3) landed. The repo renamed to **agent-factory** and
  all old names (koine/mind/episodic-package/polis-config/agentir) depalimpsested from code + runtime
  configs. Two live tails → RTB: `minimal-delta-agents`, `provenance-out-of-context`.
- `organ-catalog` — organ value-set enriched + made discoverable via `agent-forge catalog` (single-source,
  killed the embedded-table drift). Also: the 21-organ re-canonicalization to industry-standard names.
- `principal-stance` — the intent-driven-expert stance encoded as identity (not instructions), the
  mission-command authority anchor minted, and the koine-native Stop/SubagentStop stance guardrail shipped.

**Founder boundary:** Nico owns constitution/roles/archetypes (the society); Mav owns infrastructure/
machinery (the substrate). `principal-ic` is intrinsic to both (founder-genus, bound to the polis subject).
