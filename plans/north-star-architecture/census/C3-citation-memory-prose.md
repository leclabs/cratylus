# C3 findings — citation cruft + memory prose-vs-tool

Source: Explore census. Two investigations.

## Investigation 1 — citation mechanism

- **Dead cruft:** the only LIVE `[[…]]` parser is `packages/agent-anatomy/test/skill-shape.test.ts:86`
  `REF_RE = /\[\[([a-z0-9-]+)\]\]/g`. Its comment says it "mirrors `_formula_refs`/`_bindings_region`" —
  but **those composer symbols no longer exist** (grep-clean). Orphaned parser.
- The projector does NO citation projection: `exemplify/skill-cell.ts:72-78` `renderBody` emits σ\* VERBATIM,
  "NO `[[ref]]` projection."
- The `docs:check` "wikilink" gate is **prose-only, UNIMPLEMENTED** (no code in any package.json/\*.mjs).
- **LIVE SUCCESSOR (not cruft — do NOT kill):** bare-σ\*-anchor cite-by-ref in a skill's `≜` composition
  formula. `exemplify/types.ts:21,31` + `pipeline.ts:112-116` ("concept factor not the anchor … cite-by-ref
  broken"); documented in `skills/materialize.ts:22,30`, `create-skill.ts:14` ("the wikilink form is
  retired … cited once" by bare anchor).
- Incidental (NOT citations, leave): TOML headers `E1.S2.test.ts:122,125`; bash `[[:space:]]`; JS `[['a','b']]`.

**FORK for north-star/debate:** two distinct "composition" concepts — (1) AGENT-vector composition = ESM
`import` (compiler-checked, nico.ts); (2) SKILL-formula composition = σ* anchor reference in SKILL.md prose
(LLM-read). `[[wikilink]]` was the dead syntax for (2); the bare-anchor is (2)'s live form. Last session's
"both forms are palimpsest" correction must be reconciled against this: is skill-formula cite-by-ref
palimpsest, or the live model? Resolve cold (Ω*), not from the corpus.

## Investigation 2 — memory prose re-specifies tool (CONFIRMED)

Tool (`agent-memory/`) deterministically encodes: command surface, `encode` (mint ULID + derive
session/host/cwd), `node(cwd,host)` scope algorithm + marker set, scope-not-stored, `read --under/--for-session`
liveness filter, `fold` manifest, route target set + v1 rejection, session registry + `live` predicate
(registered ∧ ¬released ∧ age<2h), `lock` O_EXCL + stale-steal, `drain` retention, `audit`, `migrate`.

Prose that RE-SPECIFIES (double-maintains) it:

- `genus/memory.md` l.30, 32-38 ("EPISODIC schema — the build-spec"), 36, 37 (full scope algorithm), 48
  (drain retention), 49 (liveness predicate verbatim), 50 (audit), 51 (lock mechanics).
- `skills/dream.ts:15-20, 36` (restates node/read/fold/drain/lock/route signatures); `handoff.ts:21`,
  `wake.ts:6` (stale-window, migrate idempotency).

Clean (leave): the raw command lines (how-to-use), dream's routing POLICY by type/voice (the LLM-reasoning
half the tool deliberately does NOT own — `route.ts:82-89`). Memory organ CELLS are inert enums (no dup).

**Principle:** prose = HOW-TO-USE the tool + only the LLM-reasoning the tool can't encode; NEVER re-derive
tool-encoded mechanics. Single source of truth = the deterministic code.
