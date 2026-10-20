---
"cratylus": minor
"@cratylus/runtime": minor
---

A concept can be renamed: `concepts supersede <concept> --rename <new name>` records a version of the new kind `rename`, which carries `was`, the name it renames. The concept stays one concept through its names. `state` and `design` show it under its current name only, and `design` shows each built-from reference by that name. `history`, given the current name or any earlier one, lists every version with the name it was recorded under. Every verb naming a concept takes any of its names. A name stays its concept's: `define` refuses a name a concept has had, and `--rename` refuses another concept's name, current or earlier, and the concept's own current name. A close opens a renamed concept as a `define` under its current name, with built-from references by current names (decision 0318).
