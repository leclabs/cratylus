# AGENTS.md — consumer project directives

- docs mutation routes through scribe — a direct write under `docs/` bypassing intake (`inbox/` → dedupe → route) is invalid; corpus edits land with provenance front-matter or not at all.
- supersession is deletion-plus-pointer, never layering — a stale fact overwritten in place is a palimpsest; the newer fact replaces, the elder anchor points forward.
- cite-dont-copy across the corpus — a concept restated in a second file is a defect; reference the one home by ``anchor``, `pnpm docs:check` green before merge.
