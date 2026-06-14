# toolkit

Pipeline (run from `packages/mind`): `toolkit/resolve.py --reader strong-llm-lean` → `toolkit/glossary.py` → `toolkit/verify.py` (PASS gate) → `toolkit/deploy.py`. Deployed profile: strong-llm-lean.

## Stages

- **compose** — markdown-it-py AST; fence-immune substitution; FENCE gate rejects `[[ ]]` inside fences.
- **render** — provenance header + content-hash; the hash covers substance, not decoration.
- **place** — defs/skills overwritten freely; SELF/MEMORY/EPISODIC seeded only-if-absent; **never prunes** — agent deletion = manual per-host def rm + sidecar archive.
- **skill projection** — `[[x]]` → `/trigger` (kind×harness); trigger read verbatim from cell front-matter.

## Gotchas (composer, `skill.py`)

- Requires an H1: all body before the first H1 is **silently dropped** (known bug — contradicts degrade-visibly; fix pending).
- The first prose `≜` line is consumed as the composition formula — boundary-bind dependencies with "binds" prose, never `X ≜ [[cell]]` in prose. A skill whose only `≜` is fenced math composes **empty provenance**; this no longer regresses silently — `verify.py` `gate_skill_provenance` surfaces it as a `NOTE PROVENANCE` warning (B9).

## Verify gaps (open)

- Requires an H1: all body before the first H1 is **silently dropped** (composer gotcha above) — not yet a verify gate.

### R3 routing-manifest consumer (B8 — consumer half)

`gate_reconstruct()`'s R3 now mechanizes against a **routing manifest** when one is present. Manifests
live in `packages/mind/.manifests/<source>.json` (dotted sibling of the `.claude/` deploy outputs; a
pipeline artifact, not a corpus cell — outside `ideas/`, so the corpus-slug glob never sees it). Schema
(Nico's, firm): `{source, exemplified_at, reader, routes[]: {fragment_digest, idea_gloss, home_slug,
disposition, rank}, delta[]: {fragment_digest, idea_gloss}}`; `disposition ∈ {reuse, mint, delta}`.

- **Consumer only** (this half): `_load_manifest()` parses + shape-validates (a malformed manifest is a
  **hard error**, never a silent skip); the R3 gate asserts every `routes[].home_slug` resolves to
  exactly one live cell and no fragment is double-listed (routes XOR delta). The **producer** (resolve/
  exemplify emit) and the **digest values** are Nico's follow-on — the toolkit only *reads* digests.
- **Degrade-visibly:** no manifest present (current state) ⇒ R3 stays the audit-line NOTE and the PASS
  line reads `reconstruct (R1+R2; R3 manual)`; ≥1 manifest present + passing ⇒ `(R1+R2+R3)`. On the
  current corpus (no manifests) the gate is a **no-op** — built, fixture-tested, dormant until producers
  arrive (`test_reconstruct.py` R3 cases).

### Closed (B9)

- ~~Round-trip PASSes on an empty skill body~~ → `gate_skill_operative` (OPERATIVE): a `kind: skill` needs ≥1 operative element (step / fenced block / substantive prose) beyond heading + `≜` formula.
- ~~No symbol-coverage lint~~ → `gate_symbols` (SYMBOLS): every fence-interior glyph ∈ (table col-1 ∪ definienda-class ∪ exemptions), else FAIL with cell:line + codepoint. Exemptions = Greek (U+0391–03C9), subscripts (U+2080–2089, ᵢ, ⱼ), box-drawing (U+2500–257F diagram art), em-dash (prose-in-fence). (Ellipsis `…` is **declared** in the table — the "and so on" enumerator — not exempted.) Table: `references/formal-symbolic-notation.md`.
- ~~Fenced-`≜` empty-provenance composes silently~~ → `gate_skill_provenance` (PROVENANCE warning, above).

## Deploy

Per host, sequential explicit `deploy.py` invocations — no shell-loop cleverness.
