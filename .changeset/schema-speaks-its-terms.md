---
"@cratylus/schema": minor
---

`@cratylus/schema` names the canon's shapes in the design's terms: factor, value, term, correction, hook declaration, canon. It no longer says corpus, dimension, fragment, cell, anchor, gloss, residue or σ*.

Breaking renames: `DimensionMeta` → `FactorMeta`, `DimensionManifest` → `FactorManifest`, `DimensionFieldName` → `FactorFieldName`, `DimensionOf` → `FactorOf`, `SetDimensionOf` → `SetFactorOf`, `RequiredDimensionOf` → `RequiredFactorOf`, `FieldDimensionOf` → `FieldFactorOf`, `DimensionFieldsOf` → `FactorFieldsOf`, `isDimensionValue` → `isFactorValue`, `dimensionValueOf` → `factorValueOf`, `anchorOf` → `termOf`, `HookCell` → `HookDeclaration` (its field `residue` → `correction`). A value's brand property `__dimension` is `__factor`. `Binding.anchor` is `Binding.term` and `Binding.fragment` is `Binding.value`. `Slot.gloss` is `Slot.correction`. A plugin's directory of factors is `factors`, not `fragments`. `mergeManifest` logs `override factor …` and, when no plugin declares a manifest, refuses with `no plugin in the set declares a factor manifest`.
