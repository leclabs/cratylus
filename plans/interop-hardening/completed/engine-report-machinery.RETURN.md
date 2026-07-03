# RETURN — engine-report-machinery (wave 4) · judged PASS

commit `d36c2dc` — engine report machinery: loud imports, drift enforcement, plugin support mode.

- **Graduated (owned 19 rows / 25 call sites):** E1.S1 unrepresentable-field · E1.S4 unsupported-by-source · E1.S7 unlifted-surfaces ×5 · E2.S5 no-local-tier skips/no-fabrication/elicit · E2.S7 dry-run IR path · E3.S1 own-format `--from` · E3.S2 hook-id survival ×{claude,cursor,gemini} · E3.S4 drift error/warn + resource-id · E3.S6 refusal paths + version-skew · E5.S1 plugin capability/route/lint · E5.S7 no-native-no-plugin · E7.S1 rule.order concat · E9.S4 recompile-over-drift conflict.
- **Tracked:** 198 → 179/43 (−19). Judge verified: 22 removed − 3 gap-note reflow re-adds (E2.S5/E7.S1/E9.S4, foreign rows edited not flipped) = 19 net ≡ owned set; opencode E5.S4/E8.S6 rows still tracked.
- **Judgment ratified (residue 1):** opencode declaration flipped partial→plugin = capability-honesty truth-alignment, not new capability — the `.opencode/plugins/` hook shim was already plugin delivery; emission extracted to `pluginEmitters.hooks`; zero foreign flips.
- **Gates:** 4×0 repo-wide (joint tree re-verified by judge: forge 670/670, anatomy 36, memory 121).
- **Watch items:** claude/gemini native hook objects now carry `id` when IR has one — fleet settings.json gains it on next anatomy deploy (flag if doctor complains) · drift default = warn (E9.S4-driven) · crush reason literals → `no-native-no-plugin` [CR4].
