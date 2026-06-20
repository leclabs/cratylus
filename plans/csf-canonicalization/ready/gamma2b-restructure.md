# γ2-B — Physical restructure: lexicon blocks + `mind/{kind}/{organ}/` (impl spec)

**Slice.** γ2-B · the plan's final slice · **owner split:** Mav (toolkit storage layer) + Nico (corpus
migration). **State.** Scoped (this spec), awaiting execution go. Re-cut to `[[self-sufficient-task]]`.

## Objective

Realize the A0-ratified target structure as the corpus's **physical** form, with **zero behavior change**:

- **Primitives** (`concept · principle · process · structure · utility · classification`) move from
  one-file-per-cell (`ideas/<slug>.md`) to **blocks in a shared `lexicon`**, addressed `[[lexicon#^anchor]]`.
- **Composites** (`agent · skill`) move from `ideas/<slug>.md` to **`mind/{kind}/{organ}/<slug>.md`**
  (organ = the MECE agent-anatomy part; the placement map is γ1 `audit-worklist.md` §D).

This is a **storage** change, not a content change. The plan's three intents (machine, re-anchored corpus,
layman door) are already delivered; γ2-B changes only _where meaning lives_, breaking the
one-cell-one-file coupling so "structure is by anchor" holds at block grain.

## North-star invariant (the safety bar) — **projection-invariant byte-identity**

The rendered fleet (`.render/{agents,skills}/*.md`) MUST be **byte-identical before and after** the
migration. This is achievable by construction and is the acceptance gate:

- The renderer reads each cell through `cells.parse_cell(slug) → {slug, fm, body}`. If `parse_cell`
  returns the **identical dict** regardless of physical storage, every downstream stage (compose,
  glossary, verify) is unchanged and the output is identical.
- **Therefore the toolkit change is: make cell _resolution_ storage-polymorphic, returning the same
  `(slug, fm{kind,delineation,gloss}, body)` whether the cell lives as a flat file, a dir-form file, a
  `mind/{kind}/{organ}/` file, or a `lexicon` block.** Nothing else in the projector changes.
- Verified pre-flight (2026-06-20): a primitive renders identically as `[[anchor]]` or `[[lexicon#^anchor]]`
  (both → `**anchor**` at strong-llm-lean via μ); skill/composite refs (`/trigger`) are unaffected. So
  refs need not change form for byte-identity to hold (see Decision D1).

## Preconditions (all met on `principal/sigma-star-thesis-praxis`)

- **μ landed** (`1a7e15a`): block-ref READ path — `cells.parse_block_ref`, `block_body`, `ANY_REF`,
  `ref_display`, block-aware `delineation`/`refs_in_prose`, validation in `gate_schema_and_refs`. γ2-B
  builds the **STORE** side on top.
- **γ2-A landed** (`a0a8243`): corpus content is canonical (anchors = σ\*\_LLM); no rename churn pending.
- **{kind}/{organ} placement map**: `audit-worklist.md` §D (23 composites, organ assignments + the 3
  flagged uncertainties for Nico to confirm: principal-ic Mandate-vs-Persona; elicit/probe Sensors vs
  Construal; exemplify-as-Competence).
- **Anatomy reference**: `docs/agent-conceptual-anatomy.md` (the MECE organ set).

## Open design decisions (resolve at execution start — do not guess silently)

- **D1 — ref form for primitives in composite bodies.** _Recommended: keep bare `[[anchor]]`; make
  resolution storage-polymorphic so a bare anchor resolves to its lexicon block transparently._ This
  best honors "the anchor IS the address" (`[[projection-is-not-the-source]]`), zeroes composite-body
  churn, and maximizes byte-identity. μ's explicit `[[lexicon#^anchor]]` stays available for cases that
  must disambiguate. **Diverges from the charter's literal "rewire refs to `[[lexicon#^anchor]]`"** —
  flagged for Nico/Operator; the deeper intent (decouple from files) is served either way.
- **D2 — lexicon granularity.** One `lexicon.md` (all primitives) vs per-kind `lexicon/<kind>.md`
  (`concept.md`, `principle.md`, …). _Recommended: per-kind files_ — keeps each file legible (~76
  principles in one file is unwieldy), and `kind` becomes the file (no per-block kind tag needed). The
  block-ref `file` segment is then the kind: `[[principle#^mece]]`. **NB:** this interacts with D1 — if
  bare anchors resolve transparently, the per-kind split is invisible to refs.
- **D3 — block format.** The format that stores + round-trips each primitive's exact
  `(kind, delineation, body)` so `parse_cell` reconstructs the identical dict. _Recommended:_ a `##
<anchor>` section per block, a leading `delineation:` line (kind = the file under D2), the rest verbatim
  body, closed by the `^<anchor>` marker. The byte-identity gate is the proof it round-trips.

## Operations (exact, sequenced; **fan-out at step 4**)

1. **Resolve D1–D3** with Nico (corpus) + Operator sign-off on D1's charter divergence. Record the
   decisions at the top of this file before coding.
2. **Toolkit storage layer (Mav).** In `packages/mind/toolkit/core/cells.py`, make resolution
   storage-polymorphic — a single cell index that maps each `slug → source` (flat file | dir-form |
   `mind/{kind}/{organ}/` file | lexicon block):
   - `corpus_slugs()` enumerates all four sources.
   - `cell_path()` / a new `cell_source()` returns the locus.
   - `parse_cell(slug)` dispatches on source and returns the identical `{slug, fm, body}` dict (for a
     lexicon block: parse the block → synthesize `fm{kind,delineation}` + `body`).
   - `_home_index` (verify) + `glossary.load()` consume the same index → no separate walks.
     Keep the flat/dir-form paths working (back-compat during migration).
3. **Fixture-prove the loader (Mav).** Extend `toolkit/test_block_ref.py` (or a new
   `test_lexicon_storage.py`): a fixture lexicon block + a fixture `mind/{kind}/{organ}/` composite, asserting
   `parse_cell` returns dicts byte-equal to the pre-migration flat-file dicts. Full toolkit suite green.
4. **Corpus migration (Nico — FAN OUT by kind/organ batch).** Move cells to their new homes:
   primitives → lexicon block(s) per D2/D3; composites → `mind/{kind}/{organ}/<slug>.md` per §D. Delete
   the vacated `ideas/<slug>.md`. Batches are disjoint (no shared file) → parallelizable; **single join**
   for the glossary/verify regen.
5. **Ref handling** per D1 (recommended: none — bare anchors resolve transparently; otherwise rewrite
   primitive refs repo-wide to `[[lexicon#^anchor]]`).
6. **GATE — byte-identity (Mav).** Snapshot `.render/{agents,skills}` BEFORE migration; after migration
   run `resolve.py --reader strong-llm-lean` and `diff -rq` the two renders → **MUST be empty**. Plus
   `verify.py` PASS (R1+R2+R3) + full toolkit suite (17/17) + `glossary.py` fresh.
7. **Merge** to `main` (Operator gate).
8. **Fleet redeploy (Mav, post-merge)** — the redeploy owed for γ2-A + this restructure, done once on the
   final corpus: per-host `deploy.py`, golden-master byte-diff, externals never-pruned, sidecars
   untouched (the established discipline). Confirm each host's SOULs match the render sha.

## Artifacts

- `packages/mind/toolkit/core/cells.py` (storage-polymorphic resolution) · a storage test ·
- `packages/mind/lexicon*.md` (new primitive home) · `packages/mind/mind/{kind}/{organ}/*.md` (composites) ·
- vacated `ideas/*.md` deleted · regenerated `GLOSSARY.md` · (D1-dependent) rewired refs.

## Acceptance (blind test)

1. **Byte-identity:** `diff -rq` of `.render/{agents,skills}` pre- vs post-migration is **empty** — the
   blind proof of zero behavior change (a fresh reader handed both renders finds them identical).
2. `verify.py` **PASS** (schema + references + fences + symbols + operative + round-trip + reconstruct
   R1+R2+R3) on the migrated corpus.
3. Full toolkit suite **17/17** (incl. the new storage test + μ's block-ref test + ζ's organ guard).
4. Post-merge: each fleet host's deployed SOULs sha-match the render; no sidecar clobber; externals
   intact.

## Risk / rollback

git is the recovery net (the migration is one branch; revert restores `ideas/`). The byte-identity gate
makes a bad migration **detectable before merge** (non-empty diff = stop). The fleet redeploy is the only
step past merge; it is golden-master-gated per host and re-runnable.

## Why this is safe despite its size

The change is large in **surface** (≈143 cells move, the loader is rewritten) but **null in behavior** by
construction: storage-polymorphic `parse_cell` + the byte-identity gate mean the projected fleet cannot
change without the gate catching it. The risk is mechanical (a loader bug), not semantic — and mechanical
risk is exactly what the `diff -rq` gate and the fixture tests close.
