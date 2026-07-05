# agent-forge — agent conventions

**agent-forge** is the projection machinery of the canon: the **common tongue**. Author agent-config once in a
canonical IR, compile it to every client dialect (Claude Code, Codex, Cursor, …), and lift any client's
existing config back into the IR.

It is the substrate half of the founding pair (Mav's domain); the culture it carries comes from
`packages/agent-anatomy` (Nico's domain). agent-forge itself is **client-agnostic** — it knows dialects, not doctrine.

## Layout — one package, three source areas

agent-forge is a **single npm package**, `@leclabs/agent-forge`. The former `core` / `adapters` / `cli` packages are
now source areas under `src/`, wired through subpath `exports` plus a `bin`:

| Source area     | Public entry                             | Role                                                                                                                                                                                                                          |
| --------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/core/`     | `@leclabs/agent-forge` (`.` / `./core`)  | The canonical IR (types + JSON Schema), the engine (read/merge/compile/drift/migrate), runtime validators, markdown+frontmatter serializers, and the **Adapter contract**.                                                    |
| `src/adapters/` | `@leclabs/agent-forge/adapters/<client>` | The 16 official adapters (claude, opencode, codex, gemini, copilot, cursor, cline, crush, aider, continue, zed, amp, kilo, pi, devin, and the neutral `standards` surface), one per client dialect — one subpath export each. |
| `src/cli/`      | `agent-forge` (bin)                      | The user-facing orchestrator (`init` / `import` / `compile` / `diff` / `lint` / `adapters` / `events` / `doctor` / `watch` / `migrate`).                                                                                      |

Internal dependency direction is still strictly `cli → adapters → core` (now plain relative imports);
`core` depends on no sibling. The three were collapsed into one package because nothing external consumed
them independently, they were never published, and the split was inherited from an earlier layout
([[defer-the-package-boundary]]; executed under `plans/repo-structure-firstprinciples`). The "only need
core" story is now served by the `./core` subpath export, not a separate package.

Agent memory lives in a **separate** top-level package, `agent-memory` (`packages/agent-memory/`) — a
different domain (JSONL store + dream routing), zero-coupled to agent-forge. It is a private **build-only
toolsource** (bundled into the `memory` skill, not a published library); its former standalone npm identity
was retired in favor of `@leclabs/agent-memory`.

## The IR and the `.agent-forge/` home

The **IR** (intermediate representation) is the canonical superset of every supported client's config
surface — eight resource types: `Rule`, `Skill`, `Command`, `Agent`, `Hook`, `McpServer`,
`Permissions`, `EnvVars`. TypeScript types are **generated from JSON Schema**
(`src/core/schema/*.schema.json` → `pnpm gen`); the schema is the source of truth, not the `.ts`.

Authored IR lives in a **`.agent-forge/`** directory (constant `IR_DIRNAME = '.agent-forge'`), resolved per scope:
`user` → `~/.agent-forge/`; `project` → walk up from cwd to the nearest `.agent-forge/`; `local` → `<root>/.agent-forge/local/`.
Compile state (for drift detection) is recorded under that same `.agent-forge/`.

## Lossy translation is first-class

Not every client supports every resource or event. Adapters **declare** per-resource support
(`full`/`partial`/`none`) and per-event support; the engine surfaces losses via `WriteReport.warnings`
and `.skipped` rather than failing silently. The CLI's `--explain` prints them; `--strict` promotes them
to errors. agent-forge's canonical **event taxonomy** (`CanonicalEvent`, 28 events) is the vendor-neutral pivot
each adapter maps its native events to and from.

## Conventions

- Toolchain: pnpm workspace · turbo · biome · tsup · vitest (repo-wide — see root `AGENTS.md`).
- Every commit green: `pnpm build` + `pnpm test` + `pnpm lint` + `pnpm typecheck` (the last enforced at `pre-push`;
  see root `AGENTS.md`). Biome is the formatter/linter (no eslint/prettier).
- `src/core/ir/generated.ts` is generated — edit the schema and regenerate (`pnpm gen`), never hand-edit.
- This `AGENTS.md` is the single contributor surface; `README.md` is the user-facing one. Keep them
  consistent. Tests live under `test/{core,adapters,cli}/`, mirroring `src/`.

## Alignment status

agent-forge does **not yet** carry its own canon-aligned dev-agent config; once it does, those defs
become projections from `packages/agent-anatomy`'s corpus (future dogfooding task).
