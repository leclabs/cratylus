# koine — agent conventions

**koine** is the projection machinery of _polis_: the **common tongue**. Author agent-config once in a
canonical IR, compile it to every client dialect (Claude Code, Codex, Cursor, …), and lift any client's
existing config back into the IR. Formerly developed as _agentir_.

It is the substrate half of the founding pair (Mav's domain); the culture it carries comes from
`packages/mind` (Nico's domain). koine itself is **client-agnostic** — it knows dialects, not doctrine.

## Layout — the config-translation packages under the `@leclabs/koine*` scope

| Dir         | Package                   | Role                                                                                                                                                                                                                          |
| ----------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core/`     | `@leclabs/koine-core`     | The canonical IR (types + JSON Schema), the engine (read/merge/compile/drift/migrate), runtime validators, markdown+frontmatter serializers, and the **Adapter contract**. The only package a community adapter author needs. |
| `adapters/` | `@leclabs/koine-adapters` | The 10 official adapters (claude, opencode, codex, gemini, copilot, cursor, cline, crush, aider, continue), one per client dialect. Bundled as subpath exports — install once, import only what you use.                      |
| `cli/`      | `@leclabs/koine`          | The `koine` command — the user-facing orchestrator (`init` / `import` / `compile` / `diff` / `lint` / `adapters` / `events` / `doctor` / `watch` / `migrate`).                                                                |

Dependency direction is strictly `cli → adapters → core`; `core` depends on no sibling.

A fourth member, `episodic/` (`@leclabs/koine-episodic`), currently nests under the `packages/koine/*`
glob but is **off-domain** — agent memory (a JSONL store + dream routing), not config translation — and
is already a structural stranger (absent from `tsconfig.json` references and `.changeset` `fixed`). Its
extraction to a top-level package is under review (`plans/repo-structure-firstprinciples`).

## The IR and the `.koine/` home

The **IR** (intermediate representation) is the canonical superset of every supported client's config
surface — eight resource types: `Rule`, `Skill`, `Command`, `Agent`, `Hook`, `McpServer`,
`Permissions`, `EnvVars`. TypeScript types are **generated from JSON Schema** (`core/schema/*.schema.json`
→ `pnpm gen`); the schema is the source of truth, not the `.ts`.

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
- `core/src/ir/generated.ts` is generated — edit the schema and regenerate, never hand-edit the output.
- Each subpackage carries its own `AGENTS.md` for load-bearing detail. The package README (per dir) is the
  user-facing surface; AGENTS.md is the contributor-facing one. Keep them consistent.

## Alignment status

The agentir→koine rename is **complete**: package names, the `.koine/` convention (`IR_DIRNAME = '.koine'`),
and the CLI literal all landed, and **zero** `agentir` code identifiers remain — the sole surviving mention
is one intentional provenance comment in `pnpm-workspace.yaml`. koine does **not yet** carry its own
polis-aligned dev-agent config; once it does, those defs become projections from `packages/mind`'s corpus
(future dogfooding task).
