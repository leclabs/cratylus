# prettier-markdown-adoption

**State:** ready · **Lead:** Mav (config) + Nico (corpus preconditions) · **Source:** recurring VS Code markdown-format-on-save diffs (emphasis swap, table realign) — twice in one session.

## Intent

End the spurious-diff friction by adopting Prettier-for-markdown **canonically** (committed form = Prettier's
fixpoint → format-on-save produces zero diff), rather than fighting or tolerating ad-hoc reformats.

## Preconditions (Nico verifies — corpus substance)

1. **Fence-safety** — Prettier leaves ` ```text ` formal-block interiors byte-identical (documented behavior;
   verify empirically — a single reflow corrupts a proof block).
2. **`proseWrap: "preserve"`** — never `"always"` (hard-wrap would rewrite every cell's line structure).
3. **Verbatim-organ safety** — `render: verbatim` `## Protocol` sections survive normalization unchanged
   (they project byte-for-byte into agent defs).

## Approach

biome stays for JS/TS (it ignores markdown); Prettier owns markdown — a clean, non-conflicting split. Mav
lands `.prettierrc` (proseWrap: preserve) + a pre-commit hook; one-time corpus-wide normalization commit
after the three preconditions pass.

## Done when

- Prettier config committed; markdown in the format pipeline; the corpus normalized once.
- Re-opening any cell in VS Code produces no diff.
