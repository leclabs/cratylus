---
kind: principle
delineation: A generated artifact is owned by its emitter, not by any hand-formatter or linter — exclude it from independent reformatting (which diverges the committed file from what the generator emits and breaks every byte-identity guard) and lock the invariant with a freshness test asserting the committed artifact equals a fresh render.
---

# Generated Artifact Is Emitter-Owned

A file emitted by a generator has exactly one authority over its bytes: the generator. Let an _independent_ tool — a formatter, a linter's autofix — also rewrite it, and the committed artifact silently diverges from what the emitter produces, breaking any byte-identity or round-trip guard that assumes `committed == emit()`.

The fix is ownership, on two fronts. [[regenerate-without-clobbering]] protects the emitter's output from the _emitter itself_ clobbering a hand-edit; this protects it from _other tools_ — exclude generated artifacts from the formatter/linter entirely. Then lock the invariant with a **freshness test**: assert the committed artifact equals a fresh render, so drift fails loudly in CI instead of rotting silently. The same exclusion protects a self-authored sibling (a continuity-thread) that shares a directory with generated output — the formatter must not touch it either.
