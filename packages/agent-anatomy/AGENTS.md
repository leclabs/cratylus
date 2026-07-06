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

The exemplars are **typed TS modules under `src/`** — the **sole source**; markdown is a projection (agent-forge is the only projection+deploy machinery). Organ value-fragments live in `src/organs/<organ>/<value>.ts` (e.g. `organs/autonomy/human-on-the-loop.ts`), agents as organ-selection vectors in `src/agents/<name>.ts`, skills in `src/skills/<name>.ts`, and the special genus cells (`memory`, `persona`) in `src/genus/`. Anatomy types: `@leclabs/agent-forge/anatomy` (wrong organ/arity = compile error). Cell format + `kind` taxonomy: **§ Cell format + kind taxonomy** below (the retired `ideas/` layer's corpus rules, relocated here).

## @nico

nico is the **canon steward**: mission-command authority (the doctrine homed in `src/organs/autonomy/human-on-the-loop.ts`) held intrinsically — bound to the agent-subject, **not** a path-scoped grant. He owns the **canon** — the organ catalogs + `src/agents/` + `src/skills/` composites + the `rule`/`hook` source cells + the `kind` taxonomy and structure; to mutate the canon, be @nico or delegate to him. His substance is his archetype `src/agents/nico.ts`, unchanged across scopes (substance-over-accident). The source of truth is the root model — `VISION` · `MODEL` · `ENGINE` · `CANON`.

- **Corpus.** Routes intake through [[exemplify]] and **mints** the exemplars it lacks; the anchor-set is open ([[anchor-routing]] — never force an ill-fit). Owns the `kind` taxonomy and corpus structure.
- **Naming — repo-wide.** Naming is [[signify]] on the codebase ([[precise-circumscription]]). Beyond `packages/agent-anatomy` the authority is **advisory**: nico flags the right rename/restructure; code lands through Mav.
- **Boundary.** Mav leads engineering — build, tooling, cross-package code, delivery.

## Mutating the corpus

- **Mint** when [[semantic-partition]] finds a homeless distinction (an organ value or composite the corpus lacks) — restricting to the existing corpus is a malfunction.
- One home per exemplar; composites import by ESM `import` (one module per fragment = one home), never restate (cite-dont-copy).
- Acceptance: `tsc` (types enforce organ/arity) + the projection-stability gate (every fragment/skill/agent still projects) + `pnpm build/test/lint/typecheck` green. The full `accept() = Universal ∧ (agent⇒COMPOSED)` gate is machine-checked at `src/toolkit/cold-oracle/` (static per-leg floor runs every `pnpm test`; the live BLIND priors-only decode via `COLD_ORACLE_LIVE=1` — a coined nonce must decode to its generic prior, proving isolation). The byte-identity round-trip oracle is retired — `.ts` is the source, there is nothing to round-trip against.
- **`src/genus/memory.md` regen gotcha.** Editing `src/genus/memory.md` `## Protocol` requires re-running `tsx src/toolkit/make-base.ts` to regen `src/agents/base.ts` (the SOUL `## Memory Protocol` genus). The `codegen` npm script (`codegen.ts`) is a DIFFERENT step and does NOT regen `base.ts`. The memory.md skill-dir projection ships only `## Tool`; the SOUL genus is only `## Protocol` — a NEW top-level `##` section in `memory.md` projects NOWHERE (dead context).

## Cell format + kind taxonomy

The corpus rules (relocated from the retired `ideas/` conceptual layer; its INVARIANT is ⊆ `MODEL`, see below):

- **A cell = `{slug, fm, body}`; the slug IS the anchor** — the densest reader-relative fittest sign (σ\*\_R) whose latent priors circumscribe exactly the idea (one name ⇔ one concept). The toolkit is storage-polymorphic: parse returns the same shape regardless of home, so `[[anchor]]` resolves identically.
- **`kind` = the anatomy slot** governing how a cell projects — an organ name (the cell is a value in that organ), or `agent` / `skill` / `rule` / `hook` (the composites + first-class source cells; `MODEL`'s 5 Kinds). There is **no idea-typology**: the former 7-primitive set (`principle · concept · process · …`) + its `lexicon/` + `GLOSSARY.md` carriers were demolished in the 2026-06-22 rebuild (git log recovers it).
- **Organ value-cells** — `src/organs/<organ>/<value>.ts`. An **enum-organ**'s values are members of the model's own native enum (sourced by blind model introspection — the industry-standard σ\*\_LLM, never a coinage); an **open-organ**'s values are named per agent (persona · role · provenance · objective · framing · capabilities — where identity lives); a **coined catalog** (guardrails · heuristics · engineering-principles) is a closed, corpus-authored set. **Authoring precedence:** pick the correct organ → bind a canonical value → author a value only when none fits — and even then its anchor is the industry-standard σ\*\_R (blind-validated, never bespoke).
- **Agents** — `src/agents/<name>.ts`: an organ-selection vector `<name> ≜ ⊕{organ ↦ value}`, one selection per organ.
- **Skills** — `src/skills/<name>.ts`: a self-sufficient set-builder block that absorbs its own concepts; a prose `Bindings:` region names live sibling skills. The name carries the trigger-weight (progressive disclosure ships only name + `delineation` at selection).
- **Special genus cells** — `src/genus/{memory,persona}.md`: `render: verbatim` protocols (neither organ value nor composite) whose `## Protocol` the composer projects into every SOUL as genus. `memory.md` is the memory organ-home (also `deploy: skill-dir` carrying the bundled `episodic` runtime, appended as `## Memory Protocol`); `persona.md` is the per-turn persona-persistence protocol (appended LAST as `## Persona Protocol`, recency-anchored, shipping no skill dir).
- **Front-matter — minimal:** `kind` (the anatomy slot) · `delineation` (the one-line bound) · optional projection directives (`trigger`, or the trio `render: verbatim` / `deploy` / `bundle`). **`render: verbatim` marks settled σ\*\_R — never a density exemption:** a verbatim body is R=LLM under the reader binding ρ ([[signify]]); a human-register verbatim body is a defect of the cell, not a licence of the tag.
- **THE INVARIANT ⊆ MODEL.** "Every organ — name, value-type, catalog values — aligns exactly to the industry-standard σ\*\_R, blind-validated" is precisely `MODEL`'s `SIGNIFIED` (α(c)=σ\*(c)) ∧ `COLD-BLIND` (a cold read confirms the sign fires the concept), specialized to the organ catalog. It adds no invariant `MODEL` lacks — hence the `ideas/` layer retires without loss.
- **Reader-density gate** — `test/reader-density.test.ts` enforces `conform(a) ⇔ register(a) = ρ(a)` on every ρ=LLM surface (organ definiens · skill delineation+prose · genus `## Protocol` sections · agent vectors, incl. the `llm-native` ∧ `natural-language` cross-organ contradiction); ρ=human artifacts exempt by ρ, never by path. `test/reader-reach.test.ts` extends the same detector to consumer-generated artifacts + agent-to-agent messages (delegation prompt · subagent return — ρ=LLM standing rule).
