# Prerequisite

[Graphify](https://github.com/safishamsi/graphify)

confirm installed dependencies - mise => python3 => uv => graphifyy

```zsh
mise install python uv
uv tool install graphifyy   # PyPI package is graphifyy; the CLI it installs is `graphify`
# user scope, claude code  (see --help for more options)
graphify install
cd {repo}
graphify hook install
```

# agent-anatomy

**`agent-anatomy` ≜ the canon** — the library of canonical ideas from which every particular artifact projects. It is mostly **semantic fragments — composable ideas** — not running code.

The exemplars are **typed TS modules under `src/`** — the **sole source**; markdown is a projection (agent-forge is the only projection+deploy machinery). Organ value-fragments live in `src/organs/<organ>/<value>.ts` (e.g. `organs/address/human-on-the-loop.ts`), agents as organ-selection vectors in `src/agents/<name>.ts`, skills in `src/skills/<name>.ts`, and the special `memory` home in `ideas/memory.md`. Anatomy types: `@leclabs/agent-forge/anatomy` (wrong organ/arity = compile error). Cell format + `kind` taxonomy: `ideas/AGENTS.md`.

## @nico

nico is the **canon steward**: mission-command authority (the doctrine homed in `src/organs/autonomy/human-on-the-loop.ts`) held intrinsically — bound to the agent-subject, **not** a path-scoped grant. He owns the **canon** — the organ catalogs + `src/agents/` + `src/skills/` composites + the `rule`/`hook` source cells + the `kind` taxonomy and structure; to mutate the canon, be @nico or delegate to him. His substance is his archetype `src/agents/nico.ts`, unchanged across scopes (substance-over-accident). The source of truth is the root model — `VISION` · `MODEL` · `ENGINE` · `CANON`.

- **Corpus.** Routes intake through [[exemplify]] and **mints** the exemplars it lacks; the anchor-set is open ([[anchor-routing]] — never force an ill-fit). Owns the `kind` taxonomy and corpus structure.
- **Naming — repo-wide.** Naming is [[signify]] on the codebase ([[precise-circumscription]]). Beyond `packages/agent-anatomy` the authority is **advisory**: nico flags the right rename/restructure; code lands through Mav.
- **Boundary.** Mav leads engineering — build, tooling, cross-package code, delivery.

## Mutating the corpus

- **Mint** when [[semantic-partition]] finds a homeless distinction (an organ value or composite the corpus lacks) — restricting to the existing corpus is a malfunction.
- One home per exemplar; composites import by ESM `import` (one module per fragment = one home), never restate (cite-dont-copy).
- Acceptance: `tsc` (types enforce organ/arity) + the projection-stability gate (every fragment/skill/agent still projects) + `pnpm build/test/lint/typecheck` green. The byte-identity round-trip oracle is retired — `.ts` is the source, there is nothing to round-trip against.
- **`ideas/memory.md` regen gotcha.** Editing `ideas/memory.md` `## Protocol` requires re-running `tsx src/toolkit/make-base.ts` to regen `src/agents/base.ts` (the SOUL `## Memory Protocol` genus). The `codegen` npm script (`codegen.ts`) is a DIFFERENT step and does NOT regen `base.ts`. The memory.md skill-dir projection ships only `## Tool`; the SOUL genus is only `## Protocol` — a NEW top-level `##` section in `memory.md` projects NOWHERE (dead context).
