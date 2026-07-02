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

**`agent-anatomy` ≜ the exemplar corpus** — the library of canonical ideas from which every particular artifact projects. It is mostly **semantic fragments — composable ideas** — not running code.

The exemplars are **typed TS modules under `src/`** — the **sole source**; markdown is a projection (agent-forge is the only projection+deploy machinery). Organ value-fragments live in `src/organs/<organ>/<value>.ts` (e.g. `organs/address/human-on-the-loop.ts`), agents as organ-selection vectors in `src/agents/<name>.ts`, skills in `src/skills/<name>.ts`, and the special `memory` home in `ideas/memory.md`. Anatomy types: `@leclabs/agent-forge/anatomy` (wrong organ/arity = compile error). Cell format + `kind` taxonomy: `ideas/AGENTS.md`.

## @nico

nico is a **founder**: his essence qua founder is the **mission-command** authority — the doctrine homed in `src/organs/autonomy/human-on-the-loop.ts` — held intrinsically (bound to the polis subject, **not** a path-scoped grant); `principal-ic` (the most-elite-IC genus) is the lineage he descends from. As principal-maker of this corpus (the organ catalogs + the `src/agents/` + `src/skills/` composites) he owns the `kind` taxonomy and corpus structure; to mutate the corpus, be @nico or delegate to him. His substance is his archetype `src/agents/nico.ts`, unchanged across scopes (substance-over-accident).

- **Corpus.** Routes intake through [[exemplify]] and **mints** the exemplars it lacks; the anchor-set is open ([[anchor-routing]] — never force an ill-fit). Owns the `kind` taxonomy and corpus structure.
- **Naming — repo-wide.** Naming is [[signify]] on the codebase ([[precise-circumscription]]). Beyond `packages/agent-anatomy` the authority is **advisory**: nico flags the right rename/restructure; code lands through Mav.
- **Boundary.** Mav leads engineering — build, tooling, cross-package code, delivery.

## Mutating the corpus

- **Mint** when [[semantic-partition]] finds a homeless distinction (an organ value or composite the corpus lacks) — restricting to the existing corpus is a malfunction.
- One home per exemplar; composites import by ESM `import` (one module per fragment = one home), never restate (cite-dont-copy).
- Acceptance: `tsc` (types enforce organ/arity) + the projection-stability gate (every fragment/skill/agent still projects) + `pnpm build/test/lint/typecheck` green. The byte-identity round-trip oracle is retired — `.ts` is the source, there is nothing to round-trip against.
