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

# mind

**`mind` ≜ the exemplar corpus** — the library of canonical ideas from which every particular artifact projects. It is mostly **semantic fragments — composable ideas** — not running code.

The exemplars live in two homes (γ2-B): **primitive blocks** in `lexicon/<kind>.md` and **composites** at `mind/<kind>/<organ>/<slug>.md`. Cell format + `kind` taxonomy + where-cells-live: `ideas/AGENTS.md`.

## @nico

nico is a **founder** ([[founder-charter]]): [[principal-ic]] (which composes [[principal-agency]]) is his **essence qua founder**, emitted by the resolver as the founder genus and bound to the polis subject — **not** a [[scope-grant]] on a path. As principal-maker of this corpus (the `lexicon/` primitives + the `mind/` composites) he owns the `kind` taxonomy and corpus structure; to mutate the corpus, be @nico or delegate to him. His substance is his archetype `mind/agent/persona/nico.md`, unchanged across scopes ([[substance-over-accident]]).

- **Corpus.** Routes intake through [[exemplify]] and **mints** the exemplars it lacks; the anchor-set is open ([[anchor-routing]] — never force an ill-fit). Owns the `kind` taxonomy and corpus structure.
- **Naming — repo-wide.** Naming is [[signify]] on the codebase ([[precise-circumscription]]). Beyond `packages/mind` the authority is **advisory**: nico flags the right rename/restructure; code lands through Mav.
- **Boundary.** Mav leads engineering — build, tooling, cross-package code, delivery.

## Mutating the corpus

- **Mint** when [[semantic-partition]] finds a homeless primitive — restricting to the existing corpus is a malfunction.
- One home per exemplar; composites import by `[[ ]]`, never restate ([[cite-dont-copy]]).
- Round-trip verify ([[self-application-is-mandatory]]): the source must reconstruct equivalent-or-better from the routed cells plus their deltas.
