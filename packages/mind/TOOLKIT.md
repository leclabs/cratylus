# TOOLKIT — mind's intake & projection engine

The machinery that turns the `ideas/` source-graph into deployable artifacts and back — `toolkit/*.py` plus the pipeline packages `toolkit/{core,compose,decorate,render,place}/`.

## Pipeline

```
intake.py    raw text → ideas/<slug>.md             put: reduce to the source-graph
resolve.py   ideas/   → .claude/{agents,skills}/…    get: agent + skill projection
glossary.py  ideas/   → GLOSSARY.md                  get: human-doc projection
verify.py    gates the graph (schema · refs · round-trip)
deploy.py    ships artifacts to a scope; seeds SELF/MEMORY/EPISODIC (never clobbers)
```

`put` (intake) and `get` (projection) are lens halves ([[round-trip-fidelity]]); `verify.py` enforces the round-trip ([[self-application-is-mandatory]]). The source-of-truth is the `ideas/` cells — every artifact is a regenerable projection ([[projection-is-not-the-source]]).

## The projection pipeline (`get`)

A cell is projected through four pure stages, each a strategy keyed on one axis; the canonical-superset IR ([[canonical-superset-ir]]) flows between them:

```
ideas/<slug>.md
  → compose   walk the [[ ]] graph at a reader density   → ComposedDoc
  → decorate  attach kind-specific front-matter           → DecoratedDoc
  → render    frame as a harness artifact (+ content-hash) → RenderedArtifact
  → place     write to a scope's .claude/ root             → on disk
```

- **core/** — `cells.py` (the one cell reader: parse, corpus glob, delineation, and the CommonMark AST views `parse_body`/`fenced_blocks`/`fence_lines`/`text_nodes`/`refs_in_prose` — the AST, not a line regex, decides what is a fence) + `ir.py` (the three frozen carriers `ComposedDoc → DecoratedDoc → RenderedArtifact`). Shared by every stage and tool ([[cite-dont-copy]]). Sole third-party dependency: `markdown-it-py` (`pip install markdown-it-py`).
- **compose/** — one composer per projection shape, keyed on the cell's kind: `agent.py` (the `≜`-formula dispositions + genus + persona + grants + identity block), `skill.py` (authored body + a lean one-line provenance + `## Harness: <h>` variant selection), `glossary.py` (whole-corpus index). `reader.py` is the orthogonal density axis ([[reader-prior-projection]]): `weak-llm` (name + delineation + kind cue) · `strong-llm` (name + delineation) · `strong-llm-lean` (name only).
- **decorate/** — kind-keyed front-matter: agent → `name`+`description`; skill → `name`+`description`+`trigger`.
- **render/** — harness-keyed artifact framing: `claude_code.py` emits the provenance header + body content-hash ([[generated-artifact-provenance]] / [[regenerate-without-clobbering]]) and the on-disk path (agent → `.claude/agents/<n>.md`; skill → `.claude/skills/<n>/SKILL.md`), and owns the read-back/drift helpers (the format's inverse).
- **place/** — scope-keyed placement: `scope.py` resolves the `.claude/` root (user → `$HOME`; project → cwd), `local.py` / `ssh.py` write it (local fs / scp), `seeds.py` carries an agent's `{SELF,MEMORY,EPISODIC}.md` sidecars.

`resolve.py` is the thin CLI that wires compose→decorate→render and applies the drift/profile guard; `deploy.py` is the thin CLI that places to a host/scope. Default profile `(strong-llm, claude-code)`.

## Projected kinds

- **agent** → `.claude/agents/<name>.md`, plus its self-authored `<name>/{SELF,MEMORY,EPISODIC}.md` layers ([[dream]]). The def is the **SOUL** — generated substance, re-emitted freely; the layers are self-authored, seeded if-absent and never clobbered ([[substance-over-accident]]). Join key is the name ([[named-marker-as-index-key]]).
- **skill** → `.claude/skills/<name>/SKILL.md`. Intent-routed; no sidecars. A skill may **bundle companion assets** (scripts/binaries its runtime needs): a dir-form cell `ideas/<name>/<name>.md` declares them in front-matter `assets:` (comma-separated), and they deploy beside `SKILL.md` so the skill's runtime arm travels with it to every host — invoked at `~/.claude/skills/<name>/<asset>`. A flat cell with no assets ships exactly its `SKILL.md` (the common case).

## glossary.py — the second projector

The whole corpus → `GLOSSARY.md`, one browsable index grouped by `kind` at max density — the same source-graph under a different `(reader, harness)`: single-source, multi-projection ([[projection-is-not-the-source]]). Completeness-checked: every exemplar appears exactly once and the committed artifact stays fresh.

## verify.py — the round-trip gate

Four gates: **schema** (every cell is `kind` ∈ closed-set + `delineation`, or `gloss: true`), **references** (every prose `[[slug]]` resolves; no dangling/piped), **fences** (no `[[ ]]` anchor inside a fenced block — the register rule of `references/formal-symbolic-notation.md`; reject loudly per cell:line, never transform), **round-trip** (every emitted agent/skill names its composed refs + scope grants and carries an intact provenance header whose content-hash matches its body — [[regenerate-without-clobbering]]). One parse: the ref-walks are imported from `core.cells` + `compose/`, so verify cannot drift from what compose reads. Exit non-zero on any failure.

## intake.py — the reduction scaffold (`put`)

The deterministic scaffold around the irreducibly-semantic call ([[anchor-routing]] — never force an ill-fit): `candidates()` (an IDF-weighted lexical pre-filter that shrinks the corpus to top-k routing candidates, [[pretransform-shrinks-inference-surface]]; slug-tokens boosted since the name carries the meaning) and `validate()` (route/mint check: target exists · slug well-formed · MECE-unique). The `semantic-partition` cut and the route-vs-mint judgment stay with the model.

## See also

- `DESIGN.md` — the design model the pipeline realizes.
- `AGENTS.md` — the bona/Mav boundary + corpus mutation rules.
- `ideas/AGENTS.md` — the cell format + `kind` taxonomy the pipeline depends on.
