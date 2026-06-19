# koine — agent conventions

**koine** is the projection machinery of _polis_: the **common tongue**. Author agent-config once in a
canonical IR, compile it to every client dialect (Claude Code, Codex, Cursor, …), and lift any client's
existing config back into the IR. Formerly developed as _agentir_.

It is the substrate half of the founding pair (Mav's domain); the culture it carries comes from
`packages/mind` (Nico's domain). koine itself is **client-agnostic** — it knows dialects, not doctrine.

## Layout — one package, three source areas

koine is a **single npm package**, `@leclabs/koine`. The former `core` / `adapters` / `cli` packages are
now source areas under `src/`, wired through subpath `exports` plus a `bin`:

| Source area     | Public entry                       | Role                                                                                                                                                                       |
| --------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/core/`     | `@leclabs/koine` (`.` / `./core`)  | The canonical IR (types + JSON Schema), the engine (read/merge/compile/drift/migrate), runtime validators, markdown+frontmatter serializers, and the **Adapter contract**. |
| `src/adapters/` | `@leclabs/koine/adapters/<client>` | The 10 official adapters (claude, opencode, codex, gemini, copilot, cursor, cline, crush, aider, continue), one per client dialect — one subpath export each.              |
| `src/cli/`      | `koine` (bin)                      | The user-facing orchestrator (`init` / `import` / `compile` / `diff` / `lint` / `adapters` / `events` / `doctor` / `watch` / `migrate`).                                   |

Internal dependency direction is still strictly `cli → adapters → core` (now plain relative imports);
`core` depends on no sibling. The three were collapsed into one package because nothing external consumed
them independently, they were never published, and the split was inherited from agentir
([[defer-the-package-boundary]]; executed under `plans/repo-structure-firstprinciples`). The "only need
core" story is now served by the `./core` subpath export, not a separate package.

Agent memory lives in a **separate** top-level package, `@leclabs/koine-episodic` (`packages/episodic/`)
— a different domain (JSONL store + dream routing), zero-coupled to koine. (Its name still carries the
`koine-` prefix pending a [[signify]] rename.)

## The IR and the `.koine/` home

The **IR** (intermediate representation) is the canonical superset of every supported client's config
surface — eight resource types: `Rule`, `Skill`, `Command`, `Agent`, `Hook`, `McpServer`,
`Permissions`, `EnvVars`. TypeScript types are **generated from JSON Schema**
(`src/core/schema/*.schema.json` → `pnpm gen`); the schema is the source of truth, not the `.ts`.

Authored IR lives in a **`.koine/`** directory (constant `IR_DIRNAME = '.koine'`), resolved per scope:
`user` → `~/.koine/`; `project` → walk up from cwd to the nearest `.koine/`; `local` → `<root>/.koine/local/`.
Compile state (for drift detection) is recorded under that same `.koine/`.

## Lossy translation is first-class

Not every client supports every resource or event. Adapters **declare** per-resource support
(`full`/`partial`/`none`) and per-event support; the engine surfaces losses via `WriteReport.warnings`
and `.skipped` rather than failing silently. The CLI's `--explain` prints them; `--strict` promotes them
to errors. koine's canonical **event taxonomy** (`CanonicalEvent`, 28 events) is the vendor-neutral pivot
each adapter maps its native events to and from.

## Conventions

- Toolchain: pnpm workspace · turbo · biome · tsup · vitest (repo-wide — see root `AGENTS.md`).
- Every commit green: `pnpm build` + `pnpm test` + `pnpm lint`. Biome is the formatter/linter (no eslint/prettier).
- `src/core/ir/generated.ts` is generated — edit the schema and regenerate (`pnpm gen`), never hand-edit.
- This `AGENTS.md` is the single contributor surface; `README.md` is the user-facing one. Keep them
  consistent. Tests live under `test/{core,adapters,cli}/`, mirroring `src/`.

## Alignment status

The agentir→koine rename is **complete**: package names, the `.koine/` convention (`IR_DIRNAME = '.koine'`),
and the CLI literal all landed, and **zero** `agentir` code identifiers remain — the sole surviving mention
is one intentional provenance comment in `pnpm-workspace.yaml`. koine does **not yet** carry its own
polis-aligned dev-agent config; once it does, those defs become projections from `packages/mind`'s corpus
(future dogfooding task).
