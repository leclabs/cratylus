# plans — polis plans

`sharded-plan-layout` dirs: `PLAN.md` is the backlog + status mirror; task files materialize into state
folders (`pending/ → ready/ → active/ → completed/`) as deps clear.

## Active

| Plan                   | Concern                                                                                                                                                                                                                | Lead                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `sharded-memory-store` | Reshape the memory store: sharded files behind a stable verb interface (`encode/recall/consolidate/graduate/forget`); files are truth, any DB a derived index; CLI-over-shell now, MCP a future adapter. Design-first. | Mav + Nico            |
| `run-the-business`     | The standing plan — live backlog + standalone tasks; perpetual (never retires). Currently holds the live tails of the retired memory-tool-bundling + memory-model-redesign initiatives.                                | Mav + Nico (per task) |

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

**Founder boundary:** Nico owns constitution/roles/archetypes (the society); Mav owns infrastructure/
machinery (the substrate). `principal-ic` is intrinsic to both (founder-genus, bound to the polis subject).
