---
"@cratylus/canon": patch
"@cratylus/forge": patch
"@cratylus/schema": patch
"@cratylus/runtime": patch
"cratylus": patch
---

The concept journal is the only home of cratylus's conceptual model, and INTRODUCTION.md is its entry point. The five static root documents (canon, vision, model, engine and architecture) are deleted, and no README or source comment points at them any longer. The repository's `AGENTS.md`, projected from canon's `repo-preamble` rule, now sends a session to INTRODUCTION.md and the concept journal and carries the current working conventions. The ground-conformance gate, which read the model document, is removed, and the cratylism gate no longer looks for those document names.
