---
"@cratylus/canon": minor
---

The canon names its units in the design's terms. The values' directory moved from `src/dimensions/` to `src/factors/`, and the plugin declares it as `factors`. Renamed exports: `Dimension` → `Factor`, `DIMENSION_NAMES` → `FACTOR_NAMES`, `SetDimension` → `SetFactor`, `RequiredDimension` → `RequiredFactor`, `RoleCell` → `RoleProfile`, `HookCell` → `HookDeclaration`; tooling's `fragmentToMarkdown` → `valueToMarkdown`. The manifest's slot entries carry `correction` instead of `gloss`. The texts the canon installs (values, roles, personas) now say term, correction and semantic gap where they said sign, gloss and residue.
