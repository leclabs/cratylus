---
kind: principle
delineation: A generated artifact is owned by its emitter, not by any hand-formatter or linter — exclude it from independent reformatting (which diverges the committed file from what the generator emits and breaks every byte-identity guard) and lock the invariant with a freshness test asserting the committed artifact equals a fresh render.
---

# Generated Artifact Is Emitter-Owned

Ownership has two fronts. [[regenerate-without-clobbering]] protects the emitter's output from the _emitter itself_; this excludes _other tools_ — the formatter/linter must not touch a generated artifact. The same exclusion covers a self-authored sibling (a continuity-thread) sharing a directory with generated output.
