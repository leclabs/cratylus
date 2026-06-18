# prettier-markdown-adoption

**State:** ready · **Lead:** Mav (config) + Nico (corpus preconditions) · **Source:** recurring VS Code markdown-format-on-save diffs (emphasis swap, table realign) — twice in one session.

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
