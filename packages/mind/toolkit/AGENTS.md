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

### Closed (B9)

- ~~Round-trip PASSes on an empty skill body~~ → `gate_skill_operative` (OPERATIVE): a `kind: skill` needs ≥1 operative element (step / fenced block / substantive prose) beyond heading + `≜` formula.
- ~~No symbol-coverage lint~~ → `gate_symbols` (SYMBOLS): every fence-interior glyph ∈ (table col-1 ∪ definienda-class ∪ exemptions), else FAIL with cell:line + codepoint. Exemptions = Greek (U+0391–03C9), subscripts (U+2080–2089, ᵢ, ⱼ), box-drawing (U+2500–257F diagram art), em-dash (prose-in-fence). (Ellipsis `…` is **declared** in the table — the "and so on" enumerator — not exempted.) Table: `references/formal-symbolic-notation.md`.
- ~~Fenced-`≜` empty-provenance composes silently~~ → `gate_skill_provenance` (PROVENANCE warning, above).

## Deploy

Per host, sequential explicit `deploy.py` invocations — no shell-loop cleverness.
