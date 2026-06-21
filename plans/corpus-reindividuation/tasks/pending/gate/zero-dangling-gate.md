# zero-dangling-gate

R=LLM.

obj ≜ final integrity gate. ∀ `[[a]]` ∈ `packages/mind/**` : a resolves to exactly one
`packages/mind/{kind}/{a}.md`. residual prose stripped. round-trip ⊨ equivalent-or-better.

dep ≜ exemplify-corpus-pile ∧ founder-organ-binding.

ops:

1. walk all `[[a]]` in `packages/mind/**`; resolve vs canonical `{kind}/{a}.md`.
2. dangling set D = unresolved anchors. D ≠ ∅ ⇒ classify {mint | fix-typo | drop} and apply.
3. ∀ canonical fragment: ¬ inline-redefine another concept (cite-once); excess prose → strip.
4. round-trip spot-check: reconstruct k sampled parents from refs+fragments; reader-loss ⇒ FAIL.

art → `plans/corpus-reindividuation/research/gate-report.md` (D=∅ proof + sampled round-trips).

acc (blind) ⊨ `gate-report.md` shows |D|=0 over `packages/mind/**` ∧ sampled round-trips PASS. one
script/grep run reproduces |D|=0.
