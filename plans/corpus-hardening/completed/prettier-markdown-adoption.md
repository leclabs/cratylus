# prettier-markdown-adoption

**State:** completed (2026-06-18, `a8ad719`+`f659a23`) · **Lead:** Nico (drove end-to-end by proxy under `/weitermachen`) · **Source:** recurring VS Code markdown-format-on-save diffs (emphasis swap, table realign) — twice in one session.

**DONE — fully landed + verified.** (1) Preconditions cleared (the `embeddedLanguageFormatting:off` finding). (2) `.prettierrc` + `.prettierignore` (excludes generated GLOSSARY) committed; 39 md files normalized to fixpoint — verify.py PASS, fences+Protocol byte-identical, all 11 defs deploy-neutral (`f659a23`). (3) Pre-commit hook wired: `prettier@3` devDep + `.husky/pre-commit` gates staged markdown after biome; **verified end-to-end** in a build-capable worktree (unformatted→blocks, formatted→passes, no-md→biome-only, GLOSSARY→ignored-even-malformatted, biome still gates JS); the wiring commit was made with the hook ACTIVE (`a8ad719`). Format-on-save now produces zero spurious diff and the gate keeps it so.

## Intent

End the spurious-diff friction by adopting Prettier-for-markdown **canonically** (committed form = Prettier's
fixpoint → format-on-save produces zero diff), rather than fighting or tolerating ad-hoc reformats.

## Preconditions (Nico verifies — corpus substance) — ✅ CLEARED 2026-06-17

Verified empirically: ran `prettier@3 --parser markdown` over a temp copy of all 155 `ideas/` cells, then
diffed fenced-block interiors + `## Protocol` regions against the originals.

1. **Fence-safety** — ✅ **but conditional on `embeddedLanguageFormatting: "off"`.** With `proseWrap:preserve`
   ALONE, prettier reformats **language-tagged** fences: it pretty-printed `exemplify.md`'s ` ```json ` routing-
   manifest schema and even **injected trailing commas** (corrupting a deliberately-compact illustrative block).
   ` ```text ` blocks were already safe; the risk is any tagged fence. `embeddedLanguageFormatting: "off"` makes
   ALL fenced interiors byte-identical (re-verified: zero fence drift across 155 cells). **REQUIRED setting.**
2. **`proseWrap: "preserve"`** — ✅ confirmed necessary (without it prettier hard-wraps every line).
3. **Verbatim-organ safety** — ✅ all `render: verbatim` `## Protocol` sections byte-identical post-format.

Net: 17 cells take only cosmetic prose reflow (emphasis `*`→`_`, table padding) — the intended normalization;
zero formal content drift.

## Approach

biome stays for JS/TS (it ignores markdown); Prettier owns markdown — a clean, non-conflicting split. Mav
lands `.prettierrc` with **BOTH `proseWrap: "preserve"` AND `embeddedLanguageFormatting: "off"`** (the second
is load-bearing — see precond 1) + a pre-commit hook; one-time corpus-wide normalization commit. Re-run
`verify.py` after normalization (the corpus gate) — it must still PASS. Preconditions are cleared; this is now
purely the Mav infra landing.

## Done when

- Prettier config committed; markdown in the format pipeline; the corpus normalized once.
- Re-opening any cell in VS Code produces no diff.
