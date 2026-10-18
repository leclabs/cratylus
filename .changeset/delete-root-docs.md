---
"@cratylus/canon": patch
"@cratylus/forge": patch
"@cratylus/schema": patch
"@cratylus/runtime": patch
"cratylus": patch
---

The concept journal is the only home of cratylus's conceptual model, and INTRODUCTION.md is its entry point. The five static root documents (canon, vision, model, engine and architecture) are deleted, and no README or source comment points at them any longer. The repository's `AGENTS.md` is now a plain hand-authored file that sends a session to INTRODUCTION.md and the concept journal; canon's `repo-preamble` rule cell, its projection to `AGENTS.md` and the byte-lock that held them equal are removed, so `project:targets` regenerates hook targets only. The ground-conformance gate, which read the model document, is removed, and the cratylism gate no longer looks for those document names.
