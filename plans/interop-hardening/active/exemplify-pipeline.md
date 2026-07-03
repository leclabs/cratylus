# exemplify-pipeline — the context-optimization leg: raw context → accept-gated R=LLM artifacts

**Lane** Mav · **wave(4)** · deps: none (root; new module owned paths).

## Static

- `packages/agent-forge/test/stories/E6/{pipeline-probe.ts,S1.accept-gate-manifest,S2.prose-to-skill-cell,S3.agent-elevation,S4.elicit-markers,S5.idempotence,S6.project-every-target,S7.opt-in-lossless,S8.rules-through-exemplify}.test.ts` (probe file names the export/module homes the tests search) · `test/stories/E4/vector-roundtrip.test.ts`
- `packages/agent-forge/src/core/index.ts` · `src/cli/index.ts` (export/registration seams) · `src/catalog/` reachable via `src/cli/commands/catalog.ts` (the 24-organ ANATOMY contract — E6.S3's green companion pins 24 organs · 7 STANCE · 5 set organs)
- `packages/agent-anatomy/src/skills/{exemplify,conceptualize,signify,materialize,elicit,create-skill,formalize}.ts` (the canonical laws the pipeline encodes: accept gate REC ≽ · minimal · conform(register=LLM); R3 routing manifest; cell shape; ELICIT bisection)
- `packages/agent-forge/test/stories/TRACKED-FAILING.md` · `test/stories/MAP.md`
- `plans/interop-hardening/stories/E6-exemplify-optimization.md` · `stories/E4-roundtrip.md`

## Scope

Change class: **feature (new pipeline module)**. Owned paths: new `src/core/exemplify/**` (or the module home the E6 probe accepts) · new `src/cli/commands/optimize.ts` (or equivalent verb) · append-only seams in `src/core/index.ts` + `src/cli/index.ts` · engine export of the organ-vector → per-target projection (E4.S8). NOT existing adapter dirs (E6.S6's aider `read:` wiring id is owned by `aider-adapter-truth`, not here).

Build the documented import → optimize → compile flow:

- **Accept gate + R3 manifest** (E6.S1): verbose human source passes REC ≽ · minimal · conform (register=LLM); `.manifests/<source>.json` routes every concept exactly once; withheld concept ⇒ refuse.
- **Prose → skill cell** (E6.S2): well-formed SKILL.md (name+description frontmatter, verb H1, fenced declarations-above/laws-below, no undeclared symbol); formal block re-derives the pinned answer key.
- **Agent elevation** (E6.S3): persona → compiling 24-organ vector, provenance trace per non-null organ; replacement semantics (vector replaces config-IR agent, no twin, REC ≽).
- **ELICIT markers** (E6.S4): greppable `ELICIT:` at exactly the silent organs with bisecting scripts; inventing an enum value for a silent organ = pipeline failure.
- **Idempotence** (E6.S5): second run — routes all reuse, delta empty, byte-identical artifacts.
- **Projection** (E6.S6 cell/vector/ruleset id · E6.S7 flow + routes∪delta equation · E6.S8 rules leg): optimized artifacts ride normal compile to all targets; raw compile stays untouched/opt-in.
- **Vector projection export** (E4.S8): engine exposes the pinned organ-vector → per-target projection.

## Owned tracked ids (13)

| Story | Test (call site)                                                                                                                                                 |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E6.S1 | `a verbose human CLAUDE.md passes the exemplify accept gate: REC ≽ · minimal · conform (register = LLM)`                                                         |
| E6.S1 | `the R3 routing manifest .manifests/<source>.json routes every concept exactly once; a withheld concept makes the gate refuse`                                   |
| E6.S2 | `the emitted SKILL.md is a well-formed cell: name+description frontmatter, verb H1, fenced declarations-above/laws-below formal block with no undeclared symbol` |
| E6.S2 | `round-trip: the formal block alone re-derives the procedure steps of the pinned answer key`                                                                     |
| E6.S3 | `exemplify+elicit elevates the step-1 persona to a compiling 24-organ vector with a provenance trace per non-null organ`                                         |
| E6.S3 | `replacement semantics: on accept the vector replaces the config-IR agent — no lingering twin, step-1 content recoverable (REC ≽)`                               |
| E6.S4 | `the emitted vector carries greppable ELICIT: markers at exactly the silent organs, each with a bisecting elicitation script`                                    |
| E6.S4 | `negative: a pipeline run that invents a concrete enum value for a silent organ fails`                                                                           |
| E6.S5 | `second run over accepted output: routes all reuse, delta empty, artifacts byte-identical`                                                                       |
| E6.S6 | `the optimized cell, vector, and rule-set ride the normal compile to all targets; SKILL.md spec-valid at each destination, agent bodies per-target projections`  |
| E6.S7 | `the documented import → optimize → compile flow exists end-to-end with the routes ∪ delta coverage equation checked mechanically`                               |
| E6.S8 | `rules ride the exemplify pipeline: accept-gated (conform: register = LLM) optimized bodies reach every rule-bearing dialect with scoping metadata untouched`    |
| E4.S8 | `engine exposes the pinned organ-vector → per-target projection (E6.S3); absent today`                                                                           |

## Accept (falsifiers)

- Graduation: every owned id flips `story.tracked` → `story`; TRACKED-FAILING.md rows deleted; MAP.md regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`); `coverage.test.ts` green. An owned id still tracked = fail.
- No regression: `pnpm build && pnpm test && pnpm lint && pnpm typecheck` green in `packages/agent-forge`; zero previously-green tests broken (E6.S6/S7/S8 green companions: raw compile stays lossless/verbatim); zero non-owned `story.tracked` flips.
- Story ground: E6 stories' observable acceptance holds end-to-end — run the pipeline on the tests' fixture sources and inspect artifacts (manifest, cell, vector, markers), not only assertions.
- Owned paths: production diff confined to the new module + declared seams; graduation flips are the only test edits.
